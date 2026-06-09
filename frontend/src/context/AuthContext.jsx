import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('pizza_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      localStorage.removeItem('pizza_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('pizza_token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      // Note: We don't set the token here anymore due to 2FA requirement.
      return data; // Returns { message, otpRequired: true, otp }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyLogin = async (email, otp) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login verification failed.');
      }

      localStorage.setItem('pizza_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (username, email, password, role = 'user') => {
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      localStorage.setItem('pizza_token', data.token);
      setUser(data.user);
      return data; // Returns otp and user data
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyEmail = async (email, otp) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      // Update user state to verified
      setUser(prev => prev ? { ...prev, isVerified: true } : null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resendVerificationOTP = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Resending OTP failed.');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Forgot password request failed.');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Reset password failed.');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('pizza_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      verifyLogin,
      register,
      verifyEmail,
      resendVerificationOTP,
      forgotPassword,
      resetPassword,
      logout,
      refreshUser: () => {
        const token = localStorage.getItem('pizza_token');
        if (token) fetchCurrentUser(token);
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
