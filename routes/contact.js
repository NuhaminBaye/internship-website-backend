const express = require('express');
const { body } = require('express-validator');
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

// @desc    Send contact message
// @route   POST /api/contact
// @access  Public
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const transporter = createTransporter();

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contact Form Submission</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; color: #666;">${message}</p>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This message was sent from the contact form on ${process.env.FRONTEND_URL || 'the website'}.</p>
      </div>
    </div>
  `;

  try {
    // Send email to admin/support
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to admin email, or use a separate CONTACT_EMAIL env variable
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: emailContent
    });

    // Send confirmation email to user
    const confirmationContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Contacting Us!</h2>
        <p>Hello ${name},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Your Message:</strong></p>
          <p style="white-space: pre-wrap; color: #666;">${message}</p>
        </div>
        <p>Best regards,<br>The Internship Platform Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'We Received Your Message',
      html: confirmationContent
    });

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
}));

module.exports = router;

