const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken, protect } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role = 'intern' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
}));

// @desc    Register company
// @route   POST /api/auth/register-company
// @access  Public
router.post('/register-company', [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('industry').trim().notEmpty().withMessage('Industry is required'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { name, email, password, industry, website, phone } = req.body;

  // Check if company already exists
  const existingCompany = await Company.findOne({ email });
  if (existingCompany) {
    return res.status(400).json({ message: 'Company already exists with this email' });
  }

  // Create company
  const company = await Company.create({
    name,
    email,
    password,
    industry,
    website,
    phone
  });

  const token = generateToken(company._id);

  res.status(201).json({
    success: true,
    token,
    company: {
      id: company._id,
      name: company.name,
      email: company.email,
      industry: company.industry,
      role: company.role
    }
  });
}));

// @desc    Login user/company
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { email, password, userType = 'user' } = req.body;

  let user;
  if (userType === 'company') {
    user = await Company.findOne({ email }).select('+password');
  } else {
    user = await User.findOne({ email }).select('+password');
  }

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.firstName ? `${user.firstName} ${user.lastName}` : user.name,
      email: user.email,
      role: user.role,
      userType: userType
    }
  });
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
    userType: req.userType
  });
}));

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
], protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  let user;
  if (req.userType === 'company') {
    user = await Company.findById(req.user._id).select('+password');
  } else {
    user = await User.findById(req.user._id).select('+password');
  }

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

module.exports = router;
