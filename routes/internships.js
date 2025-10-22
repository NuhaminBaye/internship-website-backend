const express = require('express');
const { body } = require('express-validator');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, handleValidationErrors } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get all internships with search and filter
// @route   GET /api/internships
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    search,
    location,
    industry,
    internshipType,
    category,
    experienceLevel,
    salaryMin,
    salaryMax,
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query object
  const query = { isActive: true };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Location filter
  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Industry filter
  if (industry) {
    query.industry = { $regex: industry, $options: 'i' };
  }

  // Internship type filter
  if (internshipType) {
    query.internshipType = internshipType;
  }

  // Category filter
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }

  // Experience level filter
  if (experienceLevel) {
    query.experienceLevel = experienceLevel;
  }

  // Salary range filter
  if (salaryMin || salaryMax) {
    query['salary.amount'] = {};
    if (salaryMin) query['salary.amount'].$gte = parseInt(salaryMin);
    if (salaryMax) query['salary.amount'].$lte = parseInt(salaryMax);
  }

  // Sort options
  const sortOptions = {};
  if (sort === 'createdAt') {
    sortOptions.createdAt = order === 'desc' ? -1 : 1;
  } else if (sort === 'applicationDeadline') {
    sortOptions.applicationDeadline = order === 'desc' ? -1 : 1;
  } else if (sort === 'salary') {
    sortOptions['salary.amount'] = order === 'desc' ? -1 : 1;
  } else if (sort === 'views') {
    sortOptions.views = order === 'desc' ? -1 : 1;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const internships = await Internship.find(query)
    .populate('company', 'name logo industry location')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const total = await Internship.countDocuments(query);

  res.json({
    success: true,
    count: internships.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    internships
  });
}));

// @desc    Get featured internships
// @route   GET /api/internships/featured
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  const internships = await Internship.find({ 
    isActive: true, 
    isFeatured: true 
  })
    .populate('company', 'name logo industry')
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({
    success: true,
    count: internships.length,
    internships
  });
}));

// @desc    Get internship by ID
// @route   GET /api/internships/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.id)
    .populate('company', 'name logo description industry location culture socialMedia');

  if (!internship) {
    return res.status(404).json({ message: 'Internship not found' });
  }

  // Increment view count
  internship.views += 1;
  await internship.save();

  res.json({
    success: true,
    internship
  });
}));

// @desc    Apply for internship
// @route   POST /api/internships/:id/apply
// @access  Private
router.post('/:id/apply', [
  body('coverLetter').notEmpty().withMessage('Cover letter is required'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { coverLetter } = req.body;

  // Check if internship exists and is active
  const internship = await Internship.findById(id);
  if (!internship || !internship.isActive) {
    return res.status(404).json({ message: 'Internship not found or not available' });
  }

  // Check if application deadline has passed
  if (new Date() > internship.applicationDeadline) {
    return res.status(400).json({ message: 'Application deadline has passed' });
  }

  // Check if user has already applied
  const existingApplication = await Application.findOne({
    internship: id,
    applicant: req.user._id
  });

  if (existingApplication) {
    return res.status(400).json({ message: 'You have already applied for this internship' });
  }

  // Check if internship has reached max applications
  if (internship.currentApplications >= internship.maxApplications) {
    return res.status(400).json({ message: 'This internship has reached maximum applications' });
  }

  // Create application
  const application = await Application.create({
    internship: id,
    applicant: req.user._id,
    company: internship.company,
    coverLetter,
    resume: req.user.resume
  });

  // Update application count
  internship.currentApplications += 1;
  await internship.save();

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    application
  });
}));

// @desc    Get user applications
// @route   GET /api/internships/my-applications
// @access  Private
router.get('/my-applications', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate('internship', 'title company location internshipType applicationDeadline')
    .populate('company', 'name logo')
    .sort({ appliedAt: -1 });

  res.json({
    success: true,
    count: applications.length,
    applications
  });
}));

// @desc    Get application by ID
// @route   GET /api/internships/applications/:id
// @access  Private
router.get('/applications/:id', protect, asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('internship', 'title description requirements responsibilities skills')
    .populate('applicant', 'firstName lastName email phone resume')
    .populate('company', 'name logo');

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  // Check if user has access to this application
  if (req.userType === 'user' && application.applicant._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view this application' });
  }

  if (req.userType === 'company' && application.company._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view this application' });
  }

  res.json({
    success: true,
    application
  });
}));

// @desc    Get internship statistics
// @route   GET /api/internships/stats
// @access  Public
router.get('/stats', asyncHandler(async (req, res) => {
  const totalInternships = await Internship.countDocuments({ isActive: true });
  const totalApplications = await Application.countDocuments();
  
  const internshipsByType = await Internship.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$internshipType', count: { $sum: 1 } } }
  ]);

  const internshipsByIndustry = await Internship.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$industry', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const internshipsByLocation = await Internship.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$location', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    stats: {
      totalInternships,
      totalApplications,
      internshipsByType,
      internshipsByIndustry,
      internshipsByLocation
    }
  });
}));

module.exports = router;
