const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, adminOnly, adminOrCoach } = require('../middleware/auth');

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { status, sport, category, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (sport) query.sport = sport;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    const events = await Event.find(query).populate('organizer', 'name email').sort('-createdAt');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate({ path: 'registrations', populate: { path: 'participant', select: 'name email college' } });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events
router.post('/', protect, adminOrCoach, async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user._id });
    res.status(201).json({ event, message: 'Event created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/events/:id
router.put('/:id', protect, adminOrCoach, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ event, message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
