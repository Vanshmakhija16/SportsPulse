const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect, adminOrCoach } = require('../middleware/auth');

// ─────────────────────────────────────────────────────
// POST /api/registrations  — Register for an event
// ─────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, teamId, type } = req.body;

    // 1. Fetch event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 2. Deadline check
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // 3. Spots check
    const spotsLeft = event.maxParticipants - event.registrations.length;
    if (spotsLeft <= 0) return res.status(400).json({ message: 'Event is full' });

    // ── TEAM EVENT LOGIC ──────────────────────────────
    if (event.category === 'team') {
      if (!teamId) {
        return res.status(400).json({ message: 'Team ID is required for team events' });
      }

      // Fetch the team with members
      const team = await Team.findById(teamId).populate('members.user', 'name email');
      if (!team) return res.status(404).json({ message: 'Team not found' });

      // Check user is in this team
      const isMember = team.members.some(
        m => m.user._id.toString() === req.user._id.toString() ||
             m.user.toString()     === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this team' });
      }

      // ── KEY CHECK: Validate team size against event min/max ──
      const memberCount = team.members.length;
      const minSize     = event.minTeamSize || 1;
      const maxSize     = event.maxTeamSize || 99;

      if (memberCount < minSize) {
        return res.status(400).json({
          message: `Team has only ${memberCount} member(s). Minimum required is ${minSize}. Add more members before registering.`
        });
      }
      if (memberCount > maxSize) {
        return res.status(400).json({
          message: `Team has ${memberCount} members. Maximum allowed is ${maxSize}. Remove some members first.`
        });
      }

      // Check if this team is already registered for this event
      const teamAlreadyRegistered = await Registration.findOne({
        event: eventId,
        team:  teamId,
        type:  'team'
      });
      if (teamAlreadyRegistered) {
        return res.status(400).json({ message: 'This team is already registered for this event' });
      }

      // Check if this user already registered (individually or via another team)
      const userAlreadyRegistered = await Registration.findOne({
        event:       eventId,
        participant: req.user._id
      });
      if (userAlreadyRegistered) {
        return res.status(400).json({ message: 'You are already registered for this event' });
      }

      // Create ONE registration for the whole team
      const registration = await Registration.create({
        event:       eventId,
        participant: req.user._id,   // captain who pressed register
        team:        teamId,
        type:        'team',
        status:      'pending'
      });

      // Update team status to 'registered'
      await Team.findByIdAndUpdate(teamId, { status: 'registered' });

      // Push to event registrations
      await Event.findByIdAndUpdate(eventId, {
        $push: { registrations: registration._id }
      });

      // Update captain's registeredEvents
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { registeredEvents: eventId }
      });

      // Populate before returning
      const populated = await Registration.findById(registration._id)
        .populate('team', 'name college members joinCode')
        .populate('participant', 'name email');

      return res.status(201).json({
        registration: populated,
        message: `Team "${team.name}" registered successfully! (${memberCount} members)`
      });
    }

    // ── INDIVIDUAL EVENT LOGIC ────────────────────────
    const existing = await Registration.findOne({
      event:       eventId,
      participant: req.user._id
    });
    if (existing) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    const registration = await Registration.create({
      event:       eventId,
      participant: req.user._id,
      type:        'individual',
      status:      'pending'
    });

    await Event.findByIdAndUpdate(eventId, {
      $push: { registrations: registration._id }
    });
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { registeredEvents: eventId }
    });

    return res.status(201).json({ registration, message: 'Registered successfully!' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/registrations/my  — My registrations
// ─────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const registrations = await Registration.find({ participant: req.user._id })
      .populate('event', 'title sport startDate venue status banner category')
      .populate({
        path:     'team',
        select:   'name college members joinCode status',
        populate: { path: 'members.user', select: 'name email department year' }
      });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/registrations/event/:eventId  — All registrations for an event (admin)
// Shows both individual and team registrations properly
// ─────────────────────────────────────────────────────
router.get('/event/:eventId', protect, adminOrCoach, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('participant', 'name email college department year phone')
      .populate({
        path:     'team',
        select:   'name college members joinCode status maxSize',
        populate: { path: 'members.user', select: 'name email college department year phone' }
      })
      .sort('-createdAt');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────
// PUT /api/registrations/:id/status
// ─────────────────────────────────────────────────────
router.put('/:id/status', protect, adminOrCoach, async (req, res) => {
  try {
    const reg = await Registration.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ registration: reg, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
