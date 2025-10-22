const express = require('express');
const { body } = require('express-validator');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get company profile
// @route   GET /api/companies/profile
// @access  Private
router.get('/profile', protect, authorize('company'), asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user._id);
  res.json({
    success: true,
    company
  });
}));

// @desc    Update company profile
// @route   PUT /api/companies/profile
// @access  Private
router.put('/profile', [
  body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('phone').optional().trim(),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('industry').optional().trim().notEmpty().withMessage('Industry cannot be empty'),
  body('size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).withMessage('Invalid company size'),
  handleValidationErrors
], protect, authorize('company'), asyncHandler(async (req, res) => {
  const {
    name,
    website,
    phone,
    description,
    industry,
    size,
    location,
    culture,
    socialMedia
  } = req.body;

  const company = await Company.findByIdAndUpdate(
    req.user._id,
    {
      name,
      website,
      phone,
      description,
      industry,
      size,
      location,
      culture,
      socialMedia
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    company
  });
}));

// @desc    Upload company logo
// @route   POST /api/companies/logo
// @access  Private
router.post('/logo', protect, authorize('company'), upload.single('logo'), handleUploadError, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a logo' });
  }

  const company = await Company.findByIdAndUpdate(
    req.user._id,
    { logo: req.file.path },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Logo uploaded successfully',
    logo: company.logo
  });
}));

// @desc    Create internship
// @route   POST /api/companies/internships
// @access  Private
router.post('/internships', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('internshipType').isIn(['full-time', 'part-time', 'remote', 'hybrid']).withMessage('Invalid internship type'),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required'),
  body('applicationDeadline').isISO8601().withMessage('Application deadline is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('industry').trim().notEmpty().withMessage('Industry is required'),
  handleValidationErrors
], protect, authorize('company'), asyncHandler(async (req, res) => {
  const {
    title,
    description,
    requirements,
    responsibilities,
    skills,
    location,
    internshipType,
    duration,
    startDate,
    endDate,
    applicationDeadline,
    salary,
    benefits,
    category,
    industry,
    experienceLevel,
    maxApplications,
    tags
  } = req.body;

  const internship = await Internship.create({
    title,
    company: req.user._id,
    description,
    requirements: requirements ? requirements.split(',').map(req => req.trim()) : [],
    responsibilities: responsibilities ? responsibilities.split(',').map(resp => resp.trim()) : [],
    skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
    location,
    internshipType,
    duration,
    startDate,
    endDate,
    applicationDeadline,
    salary,
    benefits: benefits ? benefits.split(',').map(benefit => benefit.trim()) : [],
    category,
    industry,
    experienceLevel,
    maxApplications,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : []
  });

  res.status(201).json({
    success: true,
    internship
  });
}));

// @desc    Get company internships
// @route   GET /api/companies/internships
// @access  Private
router.get('/internships', protect, authorize('company'), asyncHandler(async (req, res) => {
  const internships = await Internship.find({ company: req.user._id })
    .sort({ createdAt: -1 })
    .populate('company', 'name logo');

  res.json({
    success: true,
    count: internships.length,
    internships
  });
}));

// @desc    Update internship
// @route   PUT /api/companies/internships/:id
// @access  Private
router.put('/internships/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('internshipType').optional().isIn(['full-time', 'part-time', 'remote', 'hybrid']).withMessage('Invalid internship type'),
  body('duration').optional().trim().notEmpty().withMessage('Duration cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  body('applicationDeadline').optional().isISO8601().withMessage('Application deadline must be valid'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('industry').optional().trim().notEmpty().withMessage('Industry cannot be empty'),
  handleValidationErrors
], protect, authorize('company'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Convert comma-separated strings to arrays
  if (updates.requirements) {
    updates.requirements = updates.requirements.split(',').map(req => req.trim());
  }
  if (updates.responsibilities) {
    updates.responsibilities = updates.responsibilities.split(',').map(resp => resp.trim());
  }
  if (updates.skills) {
    updates.skills = updates.skills.split(',').map(skill => skill.trim());
  }
  if (updates.benefits) {
    updates.benefits = updates.benefits.split(',').map(benefit => benefit.trim());
  }
  if (updates.tags) {
    updates.tags = updates.tags.split(',').map(tag => tag.trim());
  }

  const internship = await Internship.findOneAndUpdate(
    { _id: id, company: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!internship) {
    return res.status(404).json({ message: 'Internship not found' });
  }

  res.json({
    success: true,
    internship
  });
}));

// @desc    Delete internship
// @route   DELETE /api/companies/internships/:id
// @access  Private
router.delete('/internships/:id', protect, authorize('company'), asyncHandler(async (req, res) => {
  const internship = await Internship.findOneAndDelete({
    _id: req.params.id,
    company: req.user._id
  });

  if (!internship) {
    return res.status(404).json({ message: 'Internship not found' });
  }

  res.json({
    success: true,
    message: 'Internship deleted successfully'
  });
}));

// @desc    Get internship applications
// @route   GET /api/companies/internships/:id/applications
// @access  Private
router.get('/internships/:id/applications', protect, authorize('company'), asyncHandler(async (req, res) => {
  const Application = require('../models/Application');
  
  const applications = await Application.find({ 
    internship: req.params.id,
    company: req.user._id 
  })
    .populate('applicant', 'firstName lastName email phone resume')
    .populate('internship', 'title')
    .sort({ appliedAt: -1 });

  res.json({
    success: true,
    count: applications.length,
    applications
  });
}));

// @desc    Update application status
// @route   PUT /api/companies/applications/:id/status
// @access  Private
router.put('/applications/:id/status', [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'interviewed', 'accepted', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().trim(),
  body('feedback').optional().trim(),
  handleValidationErrors
], protect, authorize('company'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, feedback, interviewScheduled } = req.body;

  const Application = require('../models/Application');
  
  const application = await Application.findOneAndUpdate(
    { _id: id, company: req.user._id },
    {
      status,
      notes,
      feedback,
      interviewScheduled,
      reviewedAt: status !== 'pending' ? new Date() : undefined
    },
    { new: true }
  ).populate('applicant', 'firstName lastName email');

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  res.json({
    success: true,
    application
  });
}));

module.exports = router;
