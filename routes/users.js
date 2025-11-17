const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    user
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, location, bio, skills } = req.body;

  // Handle skills - could be array or comma-separated string
  let processedSkills = undefined;
  if (skills) {
    if (Array.isArray(skills)) {
      processedSkills = skills.map(skill => typeof skill === 'string' ? skill.trim() : skill).filter(skill => skill);
    } else if (typeof skills === 'string') {
      processedSkills = skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName,
      lastName,
      phone,
      location,
      bio,
      skills: processedSkills
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    user
  });
}));

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
router.post('/profile-picture', protect, authorize('intern'), upload.single('profilePicture'), handleUploadError, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a profile picture' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: req.file.path },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Profile picture uploaded successfully',
    profilePicture: user.profilePicture
  });
}));

// @desc    Upload resume
// @route   POST /api/users/resume
// @access  Private
router.post('/resume', protect, authorize('intern'), upload.single('resume'), handleUploadError, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a resume' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { resume: req.file.path },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Resume uploaded successfully',
    resume: user.resume
  });
}));

// @desc    Add education
// @route   POST /api/users/education
// @access  Private
router.post('/education', [
  body('institution').trim().notEmpty().withMessage('Institution is required'),
  body('degree').trim().notEmpty().withMessage('Degree is required'),
  body('fieldOfStudy').trim().notEmpty().withMessage('Field of study is required'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { institution, degree, fieldOfStudy, startDate, endDate, current } = req.body;

  const user = await User.findById(req.user._id);
  user.education.push({
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    current: current || false
  });

  await user.save();

  res.json({
    success: true,
    message: 'Education added successfully',
    education: user.education
  });
}));

// @desc    Update education
// @route   PUT /api/users/education/:eduId
// @access  Private
router.put('/education/:eduId', [
  body('institution').optional().trim().notEmpty().withMessage('Institution cannot be empty'),
  body('degree').optional().trim().notEmpty().withMessage('Degree cannot be empty'),
  body('fieldOfStudy').optional().trim().notEmpty().withMessage('Field of study cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { eduId } = req.params;
  const updates = req.body;

  const user = await User.findById(req.user._id);
  const education = user.education.id(eduId);

  if (!education) {
    return res.status(404).json({ message: 'Education not found' });
  }

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      education[key] = updates[key];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: 'Education updated successfully',
    education: user.education
  });
}));

// @desc    Delete education
// @route   DELETE /api/users/education/:eduId
// @access  Private
router.delete('/education/:eduId', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { eduId } = req.params;

  const user = await User.findById(req.user._id);
  user.education.pull(eduId);
  await user.save();

  res.json({
    success: true,
    message: 'Education deleted successfully'
  });
}));

// @desc    Add experience
// @route   POST /api/users/experience
// @access  Private
router.post('/experience', [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  body('description').optional().trim(),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { company, position, startDate, endDate, description, current } = req.body;

  const user = await User.findById(req.user._id);
  user.experience.push({
    company,
    position,
    startDate,
    endDate,
    description,
    current: current || false
  });

  await user.save();

  res.json({
    success: true,
    message: 'Experience added successfully',
    experience: user.experience
  });
}));

// @desc    Update experience
// @route   PUT /api/users/experience/:expId
// @access  Private
router.put('/experience/:expId', [
  body('company').optional().trim().notEmpty().withMessage('Company cannot be empty'),
  body('position').optional().trim().notEmpty().withMessage('Position cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  body('description').optional().trim(),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { expId } = req.params;
  const updates = req.body;

  const user = await User.findById(req.user._id);
  const experience = user.experience.id(expId);

  if (!experience) {
    return res.status(404).json({ message: 'Experience not found' });
  }

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      experience[key] = updates[key];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: 'Experience updated successfully',
    experience: user.experience
  });
}));

// @desc    Delete experience
// @route   DELETE /api/users/experience/:expId
// @access  Private
router.delete('/experience/:expId', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { expId } = req.params;

  const user = await User.findById(req.user._id);
  user.experience.pull(expId);
  await user.save();

  res.json({
    success: true,
    message: 'Experience deleted successfully'
  });
}));

// @desc    Update preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', [
  body('industries').optional().isArray().withMessage('Industries must be an array'),
  body('internshipTypes').optional().isArray().withMessage('Internship types must be an array'),
  body('locations').optional().isArray().withMessage('Locations must be an array'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { industries, internshipTypes, locations, salaryRange } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'preferences.industries': industries,
      'preferences.internshipTypes': internshipTypes,
      'preferences.locations': locations,
      'preferences.salaryRange': salaryRange
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    preferences: user.preferences
  });
}));

module.exports = router;
