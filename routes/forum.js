const express = require('express');
const { body } = require('express-validator');
const Forum = require('../models/Forum');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get all forum posts with search and filter
// @route   GET /api/forum
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
  const query = {};

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
  } else if (sort === 'replies') {
    sortOptions['replies.length'] = order === 'desc' ? -1 : 1;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const posts = await Forum.find(query)
    .populate('author', 'firstName lastName profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const total = await Forum.countDocuments(query);

  res.json({
    success: true,
    count: posts.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    posts
  });
}));

// @desc    Get pinned posts
// @route   GET /api/forum/pinned
// @access  Public
router.get('/pinned', asyncHandler(async (req, res) => {
  const posts = await Forum.find({ isPinned: true })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    count: posts.length,
    posts
  });
}));

// @desc    Get forum post by ID
// @route   GET /api/forum/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const post = await Forum.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture bio')
    .populate('replies.author', 'firstName lastName profilePicture');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Increment view count
  post.views += 1;
  await post.save();

  res.json({
    success: true,
    post
  });
}));

// @desc    Create a forum post
// @route   POST /api/forum
// @access  Private
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isIn(['general', 'job-search', 'interview-prep', 'networking', 'experience-sharing', 'questions']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  handleValidationErrors
], protect, authorize('intern', 'company'), asyncHandler(async (req, res) => {
  const {
    title,
    content,
    category,
    tags
  } = req.body;

  const post = await Forum.create({
    title,
    content,
    category,
    tags: tags || [],
    author: req.user._id
  });

  await post.populate('author', 'firstName lastName profilePicture');

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post
  });
}));

// @desc    Update a forum post
// @route   PUT /api/forum/:id
// @access  Private
router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('category').optional().isIn(['general', 'job-search', 'interview-prep', 'networking', 'experience-sharing', 'questions']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  handleValidationErrors
], protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if user can edit this post
  const post = await Forum.findById(id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to edit this post' });
  }

  const updatedPost = await Forum.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('author', 'firstName lastName profilePicture');

  res.json({
    success: true,
    message: 'Post updated successfully',
    post: updatedPost
  });
}));

// @desc    Delete a forum post
// @route   DELETE /api/forum/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const post = await Forum.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this post' });
  }

  await Forum.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

// @desc    Add reply to forum post
// @route   POST /api/forum/:id/reply
// @access  Private
router.post('/:id/reply', [
  body('content').notEmpty().withMessage('Reply content is required'),
  handleValidationErrors
], protect, authorize('intern', 'company'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const post = await Forum.findById(id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.isLocked) {
    return res.status(400).json({ message: 'This post is locked and cannot be replied to' });
  }

  post.replies.push({
    author: req.user._id,
    content
  });

  await post.save();
  await post.populate('replies.author', 'firstName lastName profilePicture');

  res.json({
    success: true,
    message: 'Reply added successfully',
    replies: post.replies
  });
}));

// @desc    Like a forum post
// @route   POST /api/forum/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const post = await Forum.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.likes += 1;
  await post.save();

  res.json({
    success: true,
    message: 'Post liked successfully',
    likes: post.likes
  });
}));

// @desc    Like a reply
// @route   POST /api/forum/:postId/reply/:replyId/like
// @access  Private
router.post('/:postId/reply/:replyId/like', protect, asyncHandler(async (req, res) => {
  const { postId, replyId } = req.params;

  const post = await Forum.findById(postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const reply = post.replies.id(replyId);
  if (!reply) {
    return res.status(404).json({ message: 'Reply not found' });
  }

  reply.likes += 1;
  await post.save();

  res.json({
    success: true,
    message: 'Reply liked successfully',
    likes: reply.likes
  });
}));

// @desc    Pin/unpin a forum post (Admin only)
// @route   PUT /api/forum/:id/pin
// @access  Private
router.put('/:id/pin', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const post = await Forum.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.isPinned = !post.isPinned;
  await post.save();

  res.json({
    success: true,
    message: post.isPinned ? 'Post pinned successfully' : 'Post unpinned successfully',
    isPinned: post.isPinned
  });
}));

// @desc    Lock/unlock a forum post (Admin only)
// @route   PUT /api/forum/:id/lock
// @access  Private
router.put('/:id/lock', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const post = await Forum.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.isLocked = !post.isLocked;
  await post.save();

  res.json({
    success: true,
    message: post.isLocked ? 'Post locked successfully' : 'Post unlocked successfully',
    isLocked: post.isLocked
  });
}));

// @desc    Get posts by category
// @route   GET /api/forum/category/:category
// @access  Public
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const posts = await Forum.find({ category })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Forum.countDocuments({ category });

  res.json({
    success: true,
    count: posts.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    category,
    posts
  });
}));

// @desc    Get posts by author
// @route   GET /api/forum/author/:authorId
// @access  Public
router.get('/author/:authorId', asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const posts = await Forum.find({ author: authorId })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Forum.countDocuments({ author: authorId });

  res.json({
    success: true,
    count: posts.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    posts
  });
}));

// @desc    Get forum statistics
// @route   GET /api/forum/stats
// @access  Public
router.get('/stats', asyncHandler(async (req, res) => {
  const totalPosts = await Forum.countDocuments();
  
  const postsByCategory = await Forum.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const topAuthors = await Forum.aggregate([
    { $group: { _id: '$author', count: { $sum: 1 }, totalLikes: { $sum: '$likes' } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'author' } },
    { $unwind: '$author' },
    { $project: { 
      authorName: { $concat: ['$author.firstName', ' ', '$author.lastName'] },
      count: 1,
      totalLikes: 1
    }}
  ]);

  res.json({
    success: true,
    stats: {
      totalPosts,
      postsByCategory,
      topAuthors
    }
  });
}));

module.exports = router;
