const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendOTP,
  login,
  verifyLogin,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/verify-login', verifyLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);

module.exports = router;
