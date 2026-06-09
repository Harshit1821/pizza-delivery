const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbService = require('../models/dbService');
const { sendEmail } = require('../config/mailer');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecretpizzaappkey123', {
    expiresIn: '7d',
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    const userExists = await dbService.User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const newUser = await dbService.User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      isVerified: false,
      verificationOTP,
      otpExpiry,
    });

    await sendEmail({
      to: email,
      subject: 'Verify your Pizza App account',
      text: `Your account verification code is: ${verificationOTP}.`,
      html: `<h3>Welcome to Pizza Delivery Website!</h3><p>Your account verification code is: <strong>${verificationOTP}</strong></p><p>This code expires in 5 minutes.</p>`
    });

    const token = generateToken(newUser._id || newUser.id);

    res.status(201).json({
      message: 'Registration successful! Verification code sent.',
      token,
      otp: verificationOTP,
      user: {
        id: newUser._id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and verification code.' });
    }

    const user = await dbService.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified.' });
    }

    if (user.verificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (user.otpExpiry && Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const id = user._id || user.id;
    await dbService.User.findByIdAndUpdate(id, {
      isVerified: true,
      verificationOTP: null,
      otpExpiry: null
    });

    res.status(200).json({ message: 'Email verified successfully! You can now access all features.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await dbService.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const id = user._id || user.id;
    await dbService.User.findByIdAndUpdate(id, { verificationOTP, otpExpiry });

    await sendEmail({
      to: email,
      subject: 'New verification code - Pizza Delivery',
      text: `Your new verification code is: ${verificationOTP}.`,
      html: `<p>Your new verification code is: <strong>${verificationOTP}</strong></p><p>This code expires in 5 minutes.</p>`
    });

    res.status(200).json({
      message: 'New verification OTP sent.',
      otp: verificationOTP
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error resending OTP.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    const user = await dbService.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate Login OTP for 2FA
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const id = user._id || user.id;
    await dbService.User.findByIdAndUpdate(id, { verificationOTP, otpExpiry });

    await sendEmail({
      to: email,
      subject: 'Login verification code - Pizza Delivery',
      text: `Your login verification code is: ${verificationOTP}.`,
      html: `<p>Your login verification code is: <strong>${verificationOTP}</strong></p><p>This code expires in 5 minutes.</p>`
    });

    res.status(200).json({
      message: 'OTP sent. Please verify to complete login.',
      otpRequired: true,
      otp: verificationOTP // for easy local sandbox testing
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and verification code.' });
    }

    const user = await dbService.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (user.otpExpiry && Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const id = user._id || user.id;
    await dbService.User.findByIdAndUpdate(id, {
      verificationOTP: null,
      otpExpiry: null
    });

    const token = generateToken(id);

    res.status(200).json({
      token,
      user: {
        id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify login error:', error);
    res.status(500).json({ message: 'Server error during login verification.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email.' });
    }

    const user = await dbService.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const id = user._id || user.id;
    await dbService.User.findByIdAndUpdate(id, { resetToken: resetOTP, resetTokenExpiry });

    await sendEmail({
      to: email,
      subject: 'Reset your password - Pizza Delivery',
      text: `Your password reset code is: ${resetOTP}.`,
      html: `<p>Your password reset code is: <strong>${resetOTP}</strong></p><p>This code expires in 5 minutes.</p>`
    });

    res.status(200).json({
      message: 'Password reset code sent to email.',
      otp: resetOTP 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide all details.' });
    }

    const user = await dbService.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.resetToken !== otp) {
      return res.status(400).json({ message: 'Invalid password reset code.' });
    }

    if (user.resetTokenExpiry && Date.now() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const id = user._id || user.id;

    await dbService.User.findByIdAndUpdate(id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.status(200).json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error getting profile.' });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendOTP,
  login,
  verifyLogin,
  forgotPassword,
  resetPassword,
  getMe,
};
