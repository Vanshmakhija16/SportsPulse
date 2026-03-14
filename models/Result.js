const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  position: { type: Number, required: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  score: { type: String },
  medal: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'none'],
    default: 'none'
  },
  college: { type: String },
  notes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
