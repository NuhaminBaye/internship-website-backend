const mongoose = require('mongoose');

const emailAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  locations: [{
    type: String,
    trim: true
  }],
  industries: [{
    type: String,
    trim: true
  }],
  internshipTypes: [{
    type: String,
    enum: ['full-time', 'part-time', 'remote', 'hybrid']
  }],
  salaryRange: {
    min: Number,
    max: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  lastSent: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailAlert', emailAlertSchema);
