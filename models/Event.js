const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  sport: { type: String, required: true },
  category: { type: String, enum: ['individual', 'team'], required: true },
  venue: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  maxParticipants: { type: Number, required: true },
  maxTeamSize: { type: Number, default: 1 },
  minTeamSize: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  banner: { type: String, default: '' },
  prizes: {
    first:  { type: String },
    second: { type: String },
    third:  { type: String }
  },
  rules: [{ type: String }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Registration' }],
  results: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Result' }],
  college: { type: String, required: true },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
