const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// GET /api/teams/my  — must be before /:eventId to avoid conflict
router.get('/my', protect, async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('event',          'title sport startDate minTeamSize maxTeamSize')
      .populate('captain',        'name email')
      .populate('members.user',   'name email college department year');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teams/event/:eventId
router.get('/event/:eventId', async (req, res) => {
  try {
    const teams = await Team.find({ event: req.params.eventId })
      .populate('captain',      'name email college')
      .populate('members.user', 'name email college department year');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teams — Create team
router.post('/', protect, async (req, res) => {
  try {
    const { name, eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.category !== 'team') {
      return res.status(400).json({ message: 'This is not a team event' });
    }

    // Check user doesn't already have a team for this event
    const existingTeam = await Team.findOne({
      event:          eventId,
      'members.user': req.user._id
    });
    if (existingTeam) {
      return res.status(400).json({ message: 'You already have a team for this event' });
    }

    const team = await Team.create({
      name,
      event:   eventId,
      captain: req.user._id,
      college: req.user.college,
      maxSize: event.maxTeamSize,
      minSize: event.minTeamSize,   // ← save minSize
      members: [{ user: req.user._id, role: 'captain' }]
    });

    const populated = await Team.findById(team._id)
      .populate('captain',      'name email college')
      .populate('members.user', 'name email college');

    res.status(201).json({ team: populated, message: 'Team created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teams/join — Join by code
router.post('/join', protect, async (req, res) => {
  try {
    const { joinCode } = req.body;
    const team = await Team.findOne({ joinCode: joinCode.toUpperCase() })
      .populate('event', 'title sport minTeamSize maxTeamSize');

    if (!team) return res.status(404).json({ message: 'Invalid team join code' });

    // Cannot join a registered team
    if (team.status === 'registered') {
      return res.status(400).json({ message: 'This team is already registered for the event' });
    }

    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ message: `Team is already full (max ${team.maxSize} members)` });
    }

    const alreadyMember = team.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'You are already in this team' });
    }

    // Check if user already has a team for this event
    const existingTeam = await Team.findOne({
      event:          team.event._id,
      'members.user': req.user._id
    });
    if (existingTeam) {
      return res.status(400).json({ message: 'You already belong to another team for this event' });
    }

    team.members.push({ user: req.user._id, role: 'member' });

    // Mark complete if max size reached
    if (team.members.length === team.maxSize) team.status = 'complete';

    await team.save();

    const populated = await Team.findById(team._id)
      .populate('captain',      'name email college')
      .populate('members.user', 'name email college');

    res.json({
      team: populated,
      message: `Joined team "${team.name}"! (${team.members.length}/${team.maxSize} members)`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/teams/:id/members/:userId — Remove a member (captain only)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only captain can remove members' });
    }
    team.members = team.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    if (team.status === 'complete') team.status = 'forming';
    await team.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
