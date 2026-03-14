const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Event = require('../models/Event');
const { protect, adminOrCoach } = require('../middleware/auth');

// GET /api/results/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const results = await Result.find({ medal: { $in: ['gold', 'silver', 'bronze'] } })
      .populate('event', 'title sport')
      .populate('participant', 'name college')
      .populate('team', 'name college')
      .sort('position');

    const collegePoints = {};
    results.forEach(r => {
      const college = r.college || r.participant?.college || r.team?.college;
      if (!college) return;
      if (!collegePoints[college]) collegePoints[college] = { gold: 0, silver: 0, bronze: 0, total: 0 };
      if (r.medal === 'gold')   { collegePoints[college].gold++;   collegePoints[college].total += 3; }
      if (r.medal === 'silver') { collegePoints[college].silver++; collegePoints[college].total += 2; }
      if (r.medal === 'bronze') { collegePoints[college].bronze++; collegePoints[college].total += 1; }
    });

    const leaderboard = Object.entries(collegePoints)
      .map(([college, pts]) => ({ college, ...pts }))
      .sort((a, b) => b.total - a.total);

    res.json({ leaderboard, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/event/:eventId
router.get('/event/:eventId', async (req, res) => {
  try {
    const results = await Result.find({ event: req.params.eventId })
      .populate('participant', 'name college department')
      .populate('team', 'name college')
      .sort('position');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/results
router.post('/', protect, adminOrCoach, async (req, res) => {
  try {
    const result = await Result.create({ ...req.body, recordedBy: req.user._id });
    await Event.findByIdAndUpdate(req.body.event, { $push: { results: result._id } });
    res.status(201).json({ result, message: 'Result recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/results/:id
router.delete('/:id', protect, adminOrCoach, async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ message: 'Result deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
