const express = require('express');
const { body } = require('express-validator');
const EmailAlert = require('../models/EmailAlert');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');
const nodemailer = require('nodemailer');

const router = express.Router();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// @desc    Create email alert
// @route   POST /api/alerts
// @access  Private
router.post('/', [
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('locations').optional().isArray().withMessage('Locations must be an array'),
  body('industries').optional().isArray().withMessage('Industries must be an array'),
  body('internshipTypes').optional().isArray().withMessage('Internship types must be an array'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const {
    keywords,
    locations,
    industries,
    internshipTypes,
    salaryRange,
    frequency = 'weekly'
  } = req.body;

  // Check if user already has an active alert
  const existingAlert = await EmailAlert.findOne({ 
    user: req.user._id, 
    isActive: true 
  });

  if (existingAlert) {
    return res.status(400).json({ 
      message: 'You already have an active email alert. Please update or delete the existing one.' 
    });
  }

  const alert = await EmailAlert.create({
    user: req.user._id,
    keywords: keywords || [],
    locations: locations || [],
    industries: industries || [],
    internshipTypes: internshipTypes || [],
    salaryRange,
    frequency
  });

  res.status(201).json({
    success: true,
    message: 'Email alert created successfully',
    alert
  });
}));

// @desc    Get user's email alert
// @route   GET /api/alerts
// @access  Private
router.get('/', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const alert = await EmailAlert.findOne({ 
    user: req.user._id, 
    isActive: true 
  });

  res.json({
    success: true,
    alert
  });
}));

// @desc    Update email alert
// @route   PUT /api/alerts/:id
// @access  Private
router.put('/:id', [
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('locations').optional().isArray().withMessage('Locations must be an array'),
  body('industries').optional().isArray().withMessage('Industries must be an array'),
  body('internshipTypes').optional().isArray().withMessage('Internship types must be an array'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  handleValidationErrors
], protect, authorize('intern'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const alert = await EmailAlert.findOneAndUpdate(
    { _id: id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!alert) {
    return res.status(404).json({ message: 'Email alert not found' });
  }

  res.json({
    success: true,
    message: 'Email alert updated successfully',
    alert
  });
}));

// @desc    Delete email alert
// @route   DELETE /api/alerts/:id
// @access  Private
router.delete('/:id', protect, authorize('intern'), asyncHandler(async (req, res) => {
  const alert = await EmailAlert.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!alert) {
    return res.status(404).json({ message: 'Email alert not found' });
  }

  res.json({
    success: true,
    message: 'Email alert deleted successfully'
  });
}));

// @desc    Send email notifications (Admin/System function)
// @route   POST /api/alerts/send-notifications
// @access  Private
router.post('/send-notifications', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { frequency = 'weekly' } = req.body;

  // Get all active alerts for the specified frequency
  const alerts = await EmailAlert.find({ 
    isActive: true, 
    frequency 
  }).populate('user', 'firstName lastName email emailNotifications');

  const transporter = createTransporter();
  let emailsSent = 0;
  let errors = [];

  for (const alert of alerts) {
    try {
      // Skip if user has disabled email notifications
      if (!alert.user.emailNotifications) {
        continue;
      }

      // Build search query based on alert criteria
      const query = { isActive: true };

      if (alert.keywords.length > 0) {
        query.$text = { $search: alert.keywords.join(' ') };
      }

      if (alert.locations.length > 0) {
        query.location = { $in: alert.locations };
      }

      if (alert.industries.length > 0) {
        query.industry = { $in: alert.industries };
      }

      if (alert.internshipTypes.length > 0) {
        query.internshipType = { $in: alert.internshipTypes };
      }

      if (alert.salaryRange) {
        query['salary.amount'] = {};
        if (alert.salaryRange.min) {
          query['salary.amount'].$gte = alert.salaryRange.min;
        }
        if (alert.salaryRange.max) {
          query['salary.amount'].$lte = alert.salaryRange.max;
        }
      }

      // Get internships matching the criteria
      const internships = await Internship.find(query)
        .populate('company', 'name logo industry')
        .sort({ createdAt: -1 })
        .limit(10);

      if (internships.length === 0) {
        continue;
      }

      // Create email content
      const emailContent = createEmailContent(alert.user, internships, alert);

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: alert.user.email,
        subject: `New Internship Opportunities - ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Alert`,
        html: emailContent
      });

      // Update last sent date
      alert.lastSent = new Date();
      await alert.save();

      emailsSent++;
    } catch (error) {
      console.error(`Error sending email to ${alert.user.email}:`, error);
      errors.push({
        email: alert.user.email,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    message: `Email notifications sent successfully`,
    emailsSent,
    errors
  });
}));

// Helper function to create email content
const createEmailContent = (user, internships, alert) => {
  let content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${user.firstName}!</h2>
      <p>We found ${internships.length} new internship opportunities that match your criteria:</p>
      
      <div style="margin: 20px 0;">
        <h3 style="color: #666;">Your Alert Criteria:</h3>
        <ul>
          ${alert.keywords.length > 0 ? `<li><strong>Keywords:</strong> ${alert.keywords.join(', ')}</li>` : ''}
          ${alert.locations.length > 0 ? `<li><strong>Locations:</strong> ${alert.locations.join(', ')}</li>` : ''}
          ${alert.industries.length > 0 ? `<li><strong>Industries:</strong> ${alert.industries.join(', ')}</li>` : ''}
          ${alert.internshipTypes.length > 0 ? `<li><strong>Types:</strong> ${alert.internshipTypes.join(', ')}</li>` : ''}
        </ul>
      </div>

      <h3 style="color: #333;">New Opportunities:</h3>
  `;

  internships.forEach(internship => {
    content += `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">${internship.title}</h4>
        <p style="margin: 5px 0; color: #666;"><strong>Company:</strong> ${internship.company.name}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Location:</strong> ${internship.location}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Type:</strong> ${internship.internshipType}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Deadline:</strong> ${new Date(internship.applicationDeadline).toLocaleDateString()}</p>
        <p style="margin: 10px 0;">${internship.description.substring(0, 200)}...</p>
        <a href="${process.env.FRONTEND_URL}/internships/${internship._id}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Details
        </a>
      </div>
    `;
  });

  content += `
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <p style="margin: 0; color: #666;">
          <strong>Don't want these emails?</strong> 
          <a href="${process.env.FRONTEND_URL}/profile/alerts">Manage your email alerts</a>
        </p>
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This email was sent because you subscribed to internship alerts.</p>
      </div>
    </div>
  `;

  return content;
};

// @desc    Send application status notification
// @route   POST /api/alerts/application-status
// @access  Private
router.post('/application-status', protect, authorize('company'), asyncHandler(async (req, res) => {
  const { applicationId, status, message } = req.body;

  const Application = require('../models/Application');
  const application = await Application.findById(applicationId)
    .populate('applicant', 'firstName lastName email')
    .populate('internship', 'title')
    .populate('company', 'name');

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  if (application.company._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to send notification for this application' });
  }

  const transporter = createTransporter();

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Application Status Update</h2>
      <p>Hello ${application.applicant.firstName},</p>
      
      <p>We have an update regarding your application for the <strong>${application.internship.title}</strong> position at <strong>${application.company.name}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
        ${message ? `<p style="margin: 0; color: #666;">${message}</p>` : ''}
      </div>
      
      ${status === 'accepted' ? `
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #155724;">Congratulations!</h3>
          <p style="margin: 0; color: #155724;">We're excited to have you join our team. Please check your dashboard for next steps.</p>
        </div>
      ` : ''}
      
      <p>You can view your application details and status in your dashboard.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/applications/${applicationId}" 
           style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
          View Application
        </a>
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This email was sent regarding your internship application.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.applicant.email,
      subject: `Application Status Update - ${application.internship.title}`,
      html: emailContent
    });

    res.json({
      success: true,
      message: 'Status notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending status notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
}));

module.exports = router;
