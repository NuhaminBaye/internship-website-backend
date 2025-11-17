const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: 200
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true,
    enum: ['resume', 'interview', 'career', 'networking', 'skills', 'general']
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featuredImage: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number, // in minutes
    default: 5
  }
}, {
  timestamps: true
});

// Index for search functionality
resourceSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
