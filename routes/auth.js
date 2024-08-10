const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('../models/user');
const Otp = require('../models/otp'); 
const Token = require('../models/token');

const { generateOtp, sendOtpEmail } = require('../services/emailService'); 
const { sendPhoneOtp, verifyPhoneOtp } = require('../controllers/otpcontroller');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

require('dotenv').config();

// Ensure required functions are imported
if (typeof authenticateToken !== 'function') throw new Error('authenticateToken is not a function');
if (typeof authorizeAdmin !== 'function') throw new Error('authorizeAdmin is not a function');
if (typeof sendPhoneOtp !== 'function') throw new Error('sendPhoneOtp is not a function');
if (typeof verifyPhoneOtp !== 'function') throw new Error('verifyPhoneOtp is not a function');
if (typeof generateOtp !== 'function') throw new Error('generateOtp is not a function');
if (typeof sendOtpEmail !== 'function') throw new Error('sendOtpEmail is not a function');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Admin Emails
const adminEmails = ['ras535212@gmail.com', 'Planbclo.2024@gmail.com', 'anotheradmin@example.com'];

// ----------------------------------------------
// Authentication Routes
// ----------------------------------------------

// Signup Route
router.post('/signup', async (req, res) => {
  const { firstname, lastname, mobile, email, password, address1, address2, city, state, country, pincode } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const role = adminEmails.includes(email) ? 'admin' : 'user';

    const user = new User({
      firstname,
      lastname,
      mobile,
      email,
      password, // Store plain text password
      address1,
      address2,
      city,
      state,
      country,
      pincode,
      role,
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    res.status(201).json({ message: 'Signup successful. Logged in successfully.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({ email: identifier });
    if (!user || user.password !== password) { // Compare plain text passwords
      req.flash('error_msg', 'Invalid credentials');
      return res.redirect('/account'); // Redirect back to the login page
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    
    res.redirect('/');
    req.flash('success_msg', 'Login successful'); // Redirect to the home page or dashboard
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'Server error');
    res.redirect('/account'); // Redirect back to the login page
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  req.flash('success_msg', 'Logged out successfully');
  res.status(200).redirect('/');
});

// ----------------------------------------------
// Google OAuth Routes
// ----------------------------------------------

// Start Google OAuth Process
router.get('/google', (req, res, next) => {
  const { type } = req.query;
  const state = JSON.stringify({ type });
  const prompt = type === 'signup' ? 'select_account' : '';
  passport.authenticate('google', { scope: ['profile', 'email'], state, prompt })(req, res, next);
});

// Google OAuth Callback
// Google OAuth Callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
  try {
    const state = req.query.state ? JSON.parse(req.query.state) : {};
    const googleUser = req.user; // The user object from Google authentication

    // Check if a user already exists with the Google email
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // If no user exists, create a new one
      user = new User({
        firstname: googleUser.name.givenName,
        lastname: googleUser.name.familyName,
        email: googleUser.email,
        googleId: googleUser.id,
        // Add any other fields as necessary
      });
      await user.save();
    } else {
      // If user exists, update any necessary fields (optional)
      user.googleId = googleUser.id;
      await user.save();
    }

    // Generate a JWT for the user
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    // Redirect based on profile completion status
    if (state.type === 'signup' && (!user.mobile || !user.address1 || !user.city || !user.state || !user.country || !user.pincode)) {
      req.flash('error_msg', 'Please complete your profile');
      res.redirect('/auth/complete-profile');
    } else {
      req.flash('success_msg', 'Logged in successfully');
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error in Google callback:', error);
    res.redirect('/');
  }
});

// ----------------------------------------------
// Password Reset Routes
// ----------------------------------------------

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const resetToken = new Token({ userId: user._id, token, createdAt: Date.now() });

    await resetToken.save();

    const resetLink = `http://${req.headers.host}/auth/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: user.email,
      subject: 'Password Reset Link',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset link' });
  }
});

// Reset Password Page
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const resetToken = await Token.findOne({ token });
    if (!resetToken || resetToken.createdAt < Date.now() - 3600000) { // Token valid for 1 hour
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.render('reset-password', { token });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to load reset page' });
  }
});

// Reset Password Handler
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const resetToken = await Token.findOne({ token });
    if (!resetToken || resetToken.createdAt < Date.now() - 3600000) { // Token valid for 1 hour
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(resetToken.userId);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    await Token.deleteOne({ token });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ----------------------------------------------
// Profile Completion Routes
// ----------------------------------------------

// Complete Profile Page
router.get('/complete-profile', authenticateToken, (req, res) => {
  res.render('complete-profile', { user: req.user });
});

// Complete Profile Handler
router.post('/complete-profile', authenticateToken, async (req, res) => {
  const { firstname, lastname, mobile, address1, address2, city, state, country, pincode, password } = req.body;

  if (!firstname || !lastname || !mobile || !address1 || !city || !state || !country || !pincode) {
    req.flash('error_msg', 'All fields are required');
    return res.redirect('/auth/complete-profile');
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/auth/complete-profile');
    }

    // Update user details
    user.firstname = firstname;
    user.lastname = lastname;
    user.mobile = mobile;
    user.address1 = address1;
    user.address2 = address2;
    user.city = city;
    user.state = state;
    user.country = country;
    user.pincode = pincode;

    // Hash the password before saving if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Generate a new token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    req.flash('success_msg', 'Profile completed successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error completing profile:', error);
    req.flash('error_msg', 'Failed to complete profile');
    res.redirect('/auth/complete-profile');
  }
});

// ----------------------------------------------
// OTP Routes
// ----------------------------------------------

// Send Phone OTP
router.post('/send-phone-otp', sendPhoneOtp);

// Verify Phone OTP
router.post('/verify-phone-otp', verifyPhoneOtp);

// Send Email OTP
router.post('/send-email-otp', async (req, res) => {
  const { identifier } = req.body;
  const otp = generateOtp();
  const otpExpiresAt = Date.now() + 300000; // OTP valid for 5 minutes

  try {
    await sendOtpEmail(identifier, otp);

    await Otp.findOneAndUpdate(
      { email: identifier },
      { otp, otpExpiresAt },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
  const { identifier, otp } = req.body;

  try {
    const otpEntry = await Otp.findOne({ email: identifier, otp });

    if (!otpEntry) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > otpEntry.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;

 