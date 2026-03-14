const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  type: { type: String, enum: ['individual', 'team'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'waitlisted'], default: 'pending' },
  paymentStatus: { type: String, enum: ['free', 'pending', 'paid'], default: 'free' },
  registeredAt: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
