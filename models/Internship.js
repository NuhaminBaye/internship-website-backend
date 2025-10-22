const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Internship title is required'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  internshipType: {
    type: String,
    enum: ['full-time', 'part-time', 'remote', 'hybrid'],
    required: true
  },
  duration: {
    type: String,
    required: true // e.g., "3 months", "6 months"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  salary: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'stipend'],
      default: 'monthly'
    }
  },
  benefits: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true // e.g., "Software Development", "Marketing", "Design"
  },
  industry: {
    type: String,
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry-level', 'intermediate', 'advanced'],
    default: 'entry-level'
  },
  maxApplications: {
    type: Number,
    default: 100
  },
  currentApplications: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for search functionality
internshipSchema.index({ title: 'text', description: 'text', skills: 'text' });
internshipSchema.index({ location: 1, internshipType: 1, industry: 1 });

module.exports = mongoose.model('Internship', internshipSchema);
