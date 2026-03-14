const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  event:   { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:     { type: String, default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  college: { type: String, required: true },
  status:  {
    type:    String,
    enum:    ['forming', 'complete', 'registered', 'disqualified'],
    default: 'forming'
  },
  joinCode: { type: String, unique: true },
  maxSize:  { type: Number, required: true },
  minSize:  { type: Number, default: 1 },   // ← store minSize too
}, { timestamps: true });

// Auto-generate join code
teamSchema.pre('save', function(next) {
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
