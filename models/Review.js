const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  review: {
    type: String,
    required: [true, 'Review text is required'],
    maxlength: 1000
  },
  pros: [{
    type: String,
    trim: true
  }],
  cons: [{
    type: String,
    trim: true
  }],
  workEnvironment: {
    type: Number,
    min: 1,
    max: 5
  },
  mentorship: {
    type: Number,
    min: 1,
    max: 5
  },
  learningOpportunities: {
    type: Number,
    min: 1,
    max: 5
  },
  compensation: {
    type: Number,
    min: 1,
    max: 5
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure one review per user per internship
reviewSchema.index({ internship: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
