const express = require('express');
const { body } = require('express-validator');
const Resource = require('../models/Resource');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get all resources with search and filter
// @route   GET /api/resources
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    search,
    category,
    tags,
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query object
  const query = { isPublished: true };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }

  // Sort options
  const sortOptions = {};
  if (sort === 'createdAt') {
    sortOptions.createdAt = order === 'desc' ? -1 : 1;
  } else if (sort === 'views') {
    sortOptions.views = order === 'desc' ? -1 : 1;
  } else if (sort === 'likes') {
    sortOptions.likes = order === 'desc' ? -1 : 1;
  } else if (sort === 'readingTime') {
    sortOptions.readingTime = order === 'desc' ? -1 : 1;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const resources = await Resource.find(query)
    .populate('author', 'firstName lastName profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const total = await Resource.countDocuments(query);

  res.json({
    success: true,
    count: resources.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    resources
  });
}));

// @desc    Get featured resources
// @route   GET /api/resources/featured
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  const resources = await Resource.find({ 
    isPublished: true 
  })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ likes: -1, views: -1 })
    .limit(6);

  res.json({
    success: true,
    count: resources.length,
    resources
  });
}));

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture bio');

  if (!resource || !resource.isPublished) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  // Increment view count
  resource.views += 1;
  await resource.save();

  res.json({
    success: true,
    resource
  });
}));

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').optional().isLength({ max: 200 }).withMessage('Excerpt cannot exceed 200 characters'),
  body('category').isIn(['resume', 'interview', 'career', 'networking', 'skills', 'general']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('readingTime').optional().isInt({ min: 1 }).withMessage('Reading time must be at least 1 minute'),
  handleValidationErrors
], protect, authorize('intern', 'company', 'admin'), asyncHandler(async (req, res) => {
  const {
    title,
    content,
    excerpt,
    category,
    tags,
    readingTime
  } = req.body;

  // Generate excerpt if not provided
  const generatedExcerpt = excerpt || content.substring(0, 200) + '...';

  // Calculate reading time if not provided
  const calculatedReadingTime = readingTime || Math.ceil(content.split(' ').length / 200);

  const resource = await Resource.create({
    title,
    content,
    excerpt: generatedExcerpt,
    category,
    tags: tags || [],
    author: req.user._id,
    readingTime: calculatedReadingTime,
    isPublished: req.user.role === 'admin' // Auto-publish for admins
  });

  await resource.populate('author', 'firstName lastName profilePicture');

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    resource
  });
}));

// @desc    Update a resource
// @route   PUT /api/resources/:id
// @access  Private
router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('excerpt').optional().isLength({ max: 200 }).withMessage('Excerpt cannot exceed 200 characters'),
  body('category').optional().isIn(['resume', 'interview', 'career', 'networking', 'skills', 'general']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('readingTime').optional().isInt({ min: 1 }).withMessage('Reading time must be at least 1 minute'),
  handleValidationErrors
], protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if user can edit this resource
  const resource = await Resource.findById(id);
  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  if (resource.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to edit this resource' });
  }

  // Recalculate reading time if content is updated
  if (updates.content && !updates.readingTime) {
    updates.readingTime = Math.ceil(updates.content.split(' ').length / 200);
  }

  // Generate excerpt if content is updated and excerpt is not provided
  if (updates.content && !updates.excerpt) {
    updates.excerpt = updates.content.substring(0, 200) + '...';
  }

  const updatedResource = await Resource.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('author', 'firstName lastName profilePicture');

  res.json({
    success: true,
    message: 'Resource updated successfully',
    resource: updatedResource
  });
}));

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  if (resource.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this resource' });
  }

  await Resource.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
}));

// @desc    Upload featured image for resource
// @route   POST /api/resources/:id/image
// @access  Private
router.post('/:id/image', protect, upload.single('featuredImage'), handleUploadError, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image' });
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  if (resource.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to edit this resource' });
  }

  resource.featuredImage = req.file.path;
  await resource.save();

  res.json({
    success: true,
    message: 'Featured image uploaded successfully',
    featuredImage: resource.featuredImage
  });
}));

// @desc    Like a resource
// @route   POST /api/resources/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  resource.likes += 1;
  await resource.save();

  res.json({
    success: true,
    message: 'Resource liked successfully',
    likes: resource.likes
  });
}));

// @desc    Get resources by category
// @route   GET /api/resources/category/:category
// @access  Public
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const resources = await Resource.find({ 
    category, 
    isPublished: true 
  })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Resource.countDocuments({ category, isPublished: true });

  res.json({
    success: true,
    count: resources.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    category,
    resources
  });
}));

// @desc    Get resources by author
// @route   GET /api/resources/author/:authorId
// @access  Public
router.get('/author/:authorId', asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const resources = await Resource.find({ 
    author: authorId, 
    isPublished: true 
  })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Resource.countDocuments({ author: authorId, isPublished: true });

  res.json({
    success: true,
    count: resources.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    resources
  });
}));

// @desc    Get resource statistics
// @route   GET /api/resources/stats
// @access  Public
router.get('/stats', asyncHandler(async (req, res) => {
  const totalResources = await Resource.countDocuments({ isPublished: true });
  
  const resourcesByCategory = await Resource.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const topAuthors = await Resource.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$author', count: { $sum: 1 }, totalViews: { $sum: '$views' } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'author' } },
    { $unwind: '$author' },
    { $project: { 
      authorName: { $concat: ['$author.firstName', ' ', '$author.lastName'] },
      count: 1,
      totalViews: 1
    }}
  ]);

  res.json({
    success: true,
    stats: {
      totalResources,
      resourcesByCategory,
      topAuthors
    }
  });
}));

module.exports = router;
