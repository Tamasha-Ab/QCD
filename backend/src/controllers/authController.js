import crypto from 'crypto';
import User from '../models/userModel.js';
import generateToken from '../utils/jwtUtils.js';
import sendEmail from '../utils/sendEmail.js'; // Assuming this is defined
import { createActivity } from './activityController.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, department });

    // Log registration activity
    await createActivity(
      user._id,
      'user_created',
      `New user ${name} registered with role: ${role}`,
      { email, role, department }
    );

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user by name
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ name }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Log login activity
    await createActivity(
      user._id,
      'login',
      `User ${user.name} logged in`,
      { email: user.email, role: user.role, department: user.department }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.status(200).json({ success: true, data: {} });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Forgot password - generate token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Quality Control Dashboard</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #1E73BE; margin-bottom: 30px;">Password Reset Request</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">You requested a password reset for your Quality Control Dashboard account.</p>
          <p style="margin-bottom: 30px;">Click the button below to reset your password:</p>
          
          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 15px 30px; background-color: #1E73BE; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reset Password</a>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Or copy and paste this URL in your browser:<br>
            <a href="${resetUrl}" style="color: #1E73BE; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ Important:</p>
            <p style="margin: 5px 0 0 0; color: #856404;">This link will expire in 15 minutes for security reasons.</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; font-size: 12px; color: #999;">
          <p>This email was sent from Quality Control Dashboard</p>
          <p>© 2025 Quality Control Dashboard. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Quality Control Dashboard - Password Reset Request',
        html: message,
      });

      // Check if running in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      const responseMessage = isDevelopment
        ? 'Password reset link has been sent to your email address (Development mode: Check server console for email content)'
        : 'Password reset link has been sent to your email address';

      res.status(200).json({
        success: true,
        message: responseMessage,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);

      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      // Return specific error based on email failure type
      if (emailError.message.includes('credentials not configured')) {
        return res.status(503).json({
          success: false,
          error: 'Email service is not configured. Please contact support.'
        });
      } else if (emailError.message.includes('authentication failed')) {
        return res.status(503).json({
          success: false,
          error: 'Email service authentication failed. Please contact support.'
        });
      } else if (emailError.message.includes('connect to email service')) {
        return res.status(503).json({
          success: false,
          error: 'Email service is currently unavailable. Please try again later.'
        });
      } else {
        return res.status(503).json({
          success: false,
          error: 'Failed to send reset email. Please try again later.'
        });
      }
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token to match the stored one
    const crypto = await import('crypto');
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with the reset token and check if it's not expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Set new password (it will be hashed by the pre-save middleware)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate JWT token for automatic login
    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
};
