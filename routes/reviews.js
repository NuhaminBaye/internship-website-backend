const express = require('express');
const { body } = require('express-validator');
const Review = require('../models/Review');
const Internship = require('../models/Internship');
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get reviews for a company
// @route   GET /api/reviews/company/:companyId
// @access  Public
router.get('/company/:companyId', asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sort] = order === 'desc' ? -1 : 1;

  const reviews = await Review.find({ company: companyId })
    .populate('reviewer', 'firstName lastName profilePicture')
    .populate('internship', 'title')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments({ company: companyId });

  // Calculate average rating
  const avgRating = await Review.aggregate([
    { $match: { company: companyId } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    count: reviews.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    averageRating: avgRating.length > 0 ? avgRating[0].average : 0,
    totalReviews: avgRating.length > 0 ? avgRating[0].count : 0,
    reviews
  });
}));

// @desc    Get reviews for an internship
// @route   GET /api/reviews/internship/:internshipId
// @access  Public
router.get('/internship/:internshipId', asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sort] = order === 'desc' ? -1 : 1;

  const reviews = await Review.find({ internship: internshipId })
    .populate('reviewer', 'firstName lastName profilePicture')
    .populate('company', 'name logo')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments({ internship: internshipId });

  // Calculate average rating
  const avgRating = await Review.aggregate([
    { $match: { internship: internshipId } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    count: reviews.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    averageRating: avgRating.length > 0 ? avgRating[0].average : 0,
    totalReviews: avgRating.length > 0 ? avgRating[0].count : 0,
    reviews
  });
}));

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', [
  body('company').isMongoId().withMessage('Valid company ID is required'),
  body('internship').isMongoId().withMessage('Valid internship ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().notEmpty().withMessage('Review title is required'),
  body('review').trim().notEmpty().withMessage('Review content is required'),
  body('pros').optional().isArray().withMessage('Pros must be an array'),
  body('cons').optional().isArray().withMessage('Cons must be an array'),
  body('workEnvironment').optional().isInt({ min: 1, max: 5 }).withMessage('Work environment rating must be between 1 and 5'),
  body('mentorship').optional().isInt({ min: 1, max: 5 }).withMessage('Mentorship rating must be between 1 and 5'),
  body('learningOpportunities').optional().isInt({ min: 1, max: 5 }).withMessage('Learning opportunities rating must be between 1 and 5'),
  body('compensation').optional().isInt({ min: 1, max: 5 }).withMessage('Compensation rating must be between 1 and 5'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const {
    company,
    internship,
    rating,
    title,
    review,
    pros,
    cons,
    workEnvironment,
    mentorship,
    learningOpportunities,
    compensation,
    wouldRecommend
  } = req.body;

  // Check if internship exists and belongs to the company
  const internshipDoc = await Internship.findOne({
    _id: internship,
    company: company
  });

  if (!internshipDoc) {
    return res.status(404).json({ message: 'Internship not found for this company' });
  }

  // Check if user has already reviewed this internship
  const existingReview = await Review.findOne({
    internship: internship,
    reviewer: req.user._id
  });

  if (existingReview) {
    return res.status(400).json({ message: 'You have already reviewed this internship' });
  }

  // Create review
  const reviewDoc = await Review.create({
    company,
    internship,
    reviewer: req.user._id,
    rating,
    title,
    review,
    pros: pros || [],
    cons: cons || [],
    workEnvironment,
    mentorship,
    learningOpportunities,
    compensation,
    wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true
  });

  await reviewDoc.populate('reviewer', 'firstName lastName profilePicture');
  await reviewDoc.populate('internship', 'title');
  await reviewDoc.populate('company', 'name logo');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    review: reviewDoc
  });
}));

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().notEmpty().withMessage('Review title cannot be empty'),
  body('review').optional().trim().notEmpty().withMessage('Review content cannot be empty'),
  body('pros').optional().isArray().withMessage('Pros must be an array'),
  body('cons').optional().isArray().withMessage('Cons must be an array'),
  body('workEnvironment').optional().isInt({ min: 1, max: 5 }).withMessage('Work environment rating must be between 1 and 5'),
  body('mentorship').optional().isInt({ min: 1, max: 5 }).withMessage('Mentorship rating must be between 1 and 5'),
  body('learningOpportunities').optional().isInt({ min: 1, max: 5 }).withMessage('Learning opportunities rating must be between 1 and 5'),
  body('compensation').optional().isInt({ min: 1, max: 5 }).withMessage('Compensation rating must be between 1 and 5'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const review = await Review.findOneAndUpdate(
    { _id: id, reviewer: req.user._id },
    updates,
    { new: true, runValidators: true }
  )
    .populate('reviewer', 'firstName lastName profilePicture')
    .populate('internship', 'title')
    .populate('company', 'name logo');

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  res.json({
    success: true,
    message: 'Review updated successfully',
    review
  });
}));

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.id,
    reviewer: req.user._id
  });

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

// @desc    Mark review as helpful/not helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
router.post('/:id/helpful', [
  body('helpful').isBoolean().withMessage('Helpful must be a boolean value'),
  handleValidationErrors
], protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { helpful } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  if (helpful) {
    review.helpful += 1;
  } else {
    review.notHelpful += 1;
  }

  await review.save();

  res.json({
    success: true,
    message: helpful ? 'Marked as helpful' : 'Marked as not helpful',
    helpful: review.helpful,
    notHelpful: review.notHelpful
  });
}));

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get('/my-reviews', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewer: req.user._id })
    .populate('company', 'name logo')
    .populate('internship', 'title')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: reviews.length,
    reviews
  });
}));

// @desc    Get company rating summary
// @route   GET /api/reviews/company/:companyId/summary
// @access  Public
router.get('/company/:companyId/summary', asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const summary = await Review.aggregate([
    { $match: { company: companyId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        averageWorkEnvironment: { $avg: '$workEnvironment' },
        averageMentorship: { $avg: '$mentorship' },
        averageLearningOpportunities: { $avg: '$learningOpportunities' },
        averageCompensation: { $avg: '$compensation' },
        recommendationRate: {
          $avg: { $cond: ['$wouldRecommend', 1, 0] }
        },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (summary.length === 0) {
    return res.json({
      success: true,
      summary: {
        averageRating: 0,
        totalReviews: 0,
        averageWorkEnvironment: 0,
        averageMentorship: 0,
        averageLearningOpportunities: 0,
        averageCompensation: 0,
        recommendationRate: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    });
  }

  const result = summary[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  res.json({
    success: true,
    summary: {
      averageRating: Math.round(result.averageRating * 10) / 10,
      totalReviews: result.totalReviews,
      averageWorkEnvironment: Math.round(result.averageWorkEnvironment * 10) / 10,
      averageMentorship: Math.round(result.averageMentorship * 10) / 10,
      averageLearningOpportunities: Math.round(result.averageLearningOpportunities * 10) / 10,
      averageCompensation: Math.round(result.averageCompensation * 10) / 10,
      recommendationRate: Math.round(result.recommendationRate * 100),
      ratingDistribution: distribution
    }
  });
}));

module.exports = router;
