import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle2, RefreshCw, KeyRound, Eye, EyeOff, Timer } from 'lucide-react';

function Auth({ addToast }) {
  const { login, verifyLogin, register, verifyEmail, resendVerificationOTP, forgotPassword, resetPassword, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // login | register | forgot | reset
  const [showVerify, setShowVerify] = useState(false);
  const [verifyMode, setVerifyMode] = useState('register'); // 'register' | 'login'
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Toggle for Admin Role in register
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Sandbox testing helpers
  const [developerOTP, setDeveloperOTP] = useState('');

  // Expiry Timer State
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // Timer Effect
  useEffect(() => {
    let interval;
    if ((showVerify || activeTab === 'reset') && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showVerify, activeTab, timeLeft]);

  useEffect(() => {
    // If URL has verify=true or user is registered but not verified
    if (searchParams.get('verify') === 'true' || (user && !user.isVerified)) {
      setShowVerify(true);
      setVerifyMode('register');
      if (user && !email) {
        setEmail(user.email);
      }
    }
  }, [searchParams, user]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields.', 'warning');
      return;
    }
    try {
      const data = await login(email, password);
      addToast(data.message || 'OTP sent! Please check your email.', 'success');
      if (data.otp) setDeveloperOTP(data.otp);
      
      setVerifyMode('login');
      setTimeLeft(300); // Reset timer for new OTP
      setShowVerify(true);
    } catch (err) {
      addToast(err.message || 'Login failed.', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast('Password must be at least 6 characters long.', 'warning');
      return;
    }
    try {
      const data = await register(username, email, password, isAdmin ? 'admin' : 'user');
      addToast('Registration successful! Verification code sent.', 'success');
      
      if (data.otp) {
        setDeveloperOTP(data.otp);
        console.log('Developer Verification OTP:', data.otp);
      }
      
      setVerifyMode('register');
      setTimeLeft(300);
      setShowVerify(true);
      setSearchParams({ verify: 'true' });
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      addToast('Please enter a valid 6-digit OTP.', 'warning');
      return;
    }
    try {
      if (verifyMode === 'login') {
        const loggedUser = await verifyLogin(email, otp);
        addToast(`Welcome back, ${loggedUser.username}!`, 'success');
      } else {
        await verifyEmail(email || user?.email, otp);
        addToast('Account verified successfully!', 'success');
      }
      setShowVerify(false);
      setSearchParams({});
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Verification failed.', 'error');
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 240) {
      addToast('Please wait a moment before resending.', 'warning');
      return; // Prevent spamming within first 60 seconds
    }
    try {
      const data = await resendVerificationOTP(email || user?.email);
      addToast('New verification code sent!', 'success');
      setTimeLeft(300); // Reset timer
      if (data.otp) {
        setDeveloperOTP(data.otp);
      }
    } catch (err) {
      addToast(err.message || 'Failed to resend code.', 'error');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast('Please enter your email.', 'warning');
      return;
    }
    try {
      const data = await forgotPassword(email);
      addToast('Reset OTP sent to email!', 'success');
      if (data.otp) {
        setDeveloperOTP(data.otp);
      }
      setTimeLeft(300); // Start timer for forgot password
      setActiveTab('reset');
    } catch (err) {
      addToast(err.message || 'Forgot password failed.', 'error');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      addToast('Please enter a valid 6-digit reset code.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long.', 'warning');
      return;
    }
    try {
      await resetPassword(email, otp, newPassword);
      addToast('Password reset successful! Please log in.', 'success');
      setActiveTab('login');
      setOtp('');
      setNewPassword('');
      setDeveloperOTP('');
      setTimeLeft(0);
    } catch (err) {
      addToast(err.message || 'Password reset failed.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '1rem' }}>
      <div className="glass-panel slide-up" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        
        {/* Verification Modal Panel */}
        {showVerify ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                {verifyMode === 'login' ? 'Two-Factor Auth' : 'Verify Account'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Enter the 6-digit code sent to <strong>{email || user?.email}</strong>.
              </p>
            </div>

            {developerOTP && (
              <div className="glass-card" style={{ padding: '0.8rem', borderLeft: '4px solid var(--accent)', background: 'rgba(16, 185, 129, 0.05)', fontSize: '0.85rem' }}>
                💡 <strong>Dev Sandbox Hint:</strong> The verification OTP code is <strong>{developerOTP}</strong>.
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <KeyRound size={18} />
              </span>
              <input
                type="text"
                placeholder="6-Digit OTP"
                className="glass-input"
                style={{ paddingLeft: '2.8rem', textAlign: 'center', letterSpacing: '0.3em', fontWeight: 'bold' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            
            {/* Expiry Timer Display */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: timeLeft > 0 ? 'var(--text-secondary)' : 'var(--error)' }}>
              <Timer size={16} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code has expired!'}
              </span>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={timeLeft === 0}>
              Verify & Proceed
            </button>

            <div style={{ display: 'flex', justifySelf: 'center', gap: '0.5rem', alignSelf: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={timeLeft > 240} // Disabled for the first 60 seconds
                style={{ background: 'none', border: 'none', color: timeLeft > 240 ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 600, cursor: timeLeft > 240 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <RefreshCw size={12} /> Resend OTP
              </button>
            </div>
          </form>
        ) : (
          /* Normal Auth Tab Panels */
          <>
            {/* Header tab selectors */}
            {activeTab !== 'forgot' && activeTab !== 'reset' && (
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
                <button
                  className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                  style={{ flex: 1, paddingBottom: '0.8rem', border: 'none', background: 'none', fontWeight: 600, borderBottom: activeTab === 'login' ? '2px solid var(--primary)' : 'none', color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => setActiveTab('login')}
                >
                  Sign In
                </button>
                <button
                  className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
                  style={{ flex: 1, paddingBottom: '0.8rem', border: 'none', background: 'none', fontWeight: 600, borderBottom: activeTab === 'register' ? '2px solid var(--primary)' : 'none', color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => setActiveTab('register')}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* LOGIN PANEL */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                    onClick={() => setActiveTab('forgot')}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Sign In securely
                </button>
              </form>
            )}

            {/* REGISTER PANEL */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (Min 6 chars)"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Role Switcher */}
                <div className="glass-card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
                  <label htmlFor="admin-toggle" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Register as Admin</span>
                    Create manager account to edit inventory
                  </label>
                  <input
                    id="admin-toggle"
                    type="checkbox"
                    style={{ width: '18px', height: '18px', cursor: 'pointer', marginLeft: 'auto', accentColor: 'var(--primary)' }}
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Create Account
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD PANEL */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Forgot Password</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Enter your email address and we'll send you a password reset code.
                  </p>
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Send Reset Code
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    onClick={() => setActiveTab('login')}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD PANEL */}
            {activeTab === 'reset' && (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Reset Password</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Enter the code from your email and select a new password.
                  </p>
                </div>

                {developerOTP && (
                  <div className="glass-card" style={{ padding: '0.8rem', borderLeft: '4px solid var(--accent)', background: 'rgba(16, 185, 129, 0.05)', fontSize: '0.85rem' }}>
                    💡 <strong>Dev Sandbox Hint:</strong> The password reset code is <strong>{developerOTP}</strong>.
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <KeyRound size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="6-Digit Reset Code"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem', textAlign: 'center', letterSpacing: '0.3em', fontWeight: 'bold' }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: timeLeft > 0 ? 'var(--text-secondary)' : 'var(--error)' }}>
                  <Timer size={16} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code has expired!'}
                  </span>
                </div>

                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="New Password"
                    className="glass-input"
                    style={{ paddingLeft: '2.8rem' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={timeLeft === 0}>
                  Reset Password
                </button>
                
                <div style={{ display: 'flex', justifySelf: 'center', gap: '0.5rem', alignSelf: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleForgot}
                    disabled={timeLeft > 240}
                    style={{ background: 'none', border: 'none', color: timeLeft > 240 ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 600, cursor: timeLeft > 240 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <RefreshCw size={12} /> Resend Link
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;
