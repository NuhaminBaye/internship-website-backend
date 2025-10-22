const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required']
  },
  resume: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  notes: String,
  interviewScheduled: Date,
  feedback: String
}, {
  timestamps: true
});

// Ensure one application per user per internship
applicationSchema.index({ internship: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
