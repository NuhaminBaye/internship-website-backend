const express = require('express');
const Resource = require('../models/Resource'); // Using Resource model as blog posts
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get all blog posts (using resources as blog)
// @route   GET /api/blog
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    search,
    tag,
    page = 1,
    limit = 10
  } = req.query;

  // Build query
  const query = { isPublished: true };

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } }
    ];
  }

  // Tag filter
  if (tag) {
    query.tags = { $in: [tag] };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const posts = await Resource.find(query)
    .populate('author', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('title slug excerpt content featuredImage tags author createdAt');

  const total = await Resource.countDocuments(query);

  // Transform to blog post format
  const blogPosts = posts.map(post => ({
    _id: post._id,
    title: post.title,
    slug: post.slug || post._id.toString(),
    excerpt: post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : ''),
    content: post.content,
    coverImage: post.featuredImage || post.coverImage,
    tags: post.tags || [],
    author: post.author ? {
      name: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || 'Admin',
      id: post.author._id
    } : { name: 'Admin' },
    createdAt: post.createdAt
  }));

  res.json({
    success: true,
    count: blogPosts.length,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    posts: blogPosts
  });
}));

// @desc    Get blog post by slug
// @route   GET /api/blog/:slug
// @access  Public
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Try to find by slug first, then by ID
  let post = await Resource.findOne({ 
    $or: [
      { slug: slug },
      { _id: slug }
    ],
    isPublished: true 
  })
    .populate('author', 'firstName lastName email');

  if (!post) {
    return res.status(404).json({ message: 'Blog post not found' });
  }

  // Transform to blog post format
  const blogPost = {
    _id: post._id,
    title: post.title,
    slug: post.slug || post._id.toString(),
    excerpt: post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : ''),
    content: post.content,
    coverImage: post.featuredImage || post.coverImage,
    tags: post.tags || [],
    author: post.author ? {
      name: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || 'Admin',
      id: post.author._id,
      email: post.author.email
    } : { name: 'Admin' },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };

  res.json({
    success: true,
    post: blogPost
  });
}));

module.exports = router;

