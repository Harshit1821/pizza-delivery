import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider, useOrder } from './context/OrderContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { io } from 'socket.io-client';
import { LogOut, Pizza, User, ShieldAlert, CheckCircle, AlertTriangle, X } from 'lucide-react';

// Socket connection client helper
let socket;

function AppContent() {
  const { user, logout } = useAuth();
  const { fetchUserOrders, fetchAdminOrders, fetchInventory } = useOrder();
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  const addToast = (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time synchronization via Socket.io
  useEffect(() => {
    if (user) {
      socket = io(window.location.origin || 'http://localhost:5000');
      
      // Join general room for user
      socket.emit('join', user.id);

      // Join admin room if role is admin
      if (user.role === 'admin') {
        socket.emit('join_admin');
        
        socket.on('new_order', (order) => {
          addToast(`🍕 New Order Received! Order #${order._id || order.id} placed by ${order.username}.`, 'success');
          fetchAdminOrders();
          fetchInventory();
        });
      }

      // Track order status update broadcasts
      socket.on('order_update', (order) => {
        addToast(`📦 Order Status Updated: Your order is now "${order.status}"!`, 'success');
        fetchUserOrders();
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [user]);

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle size={18} className="text-accent" />}
            {t.type === 'error' && <AlertTriangle size={18} style={{ color: '#ef4444' }} />}
            <span>{t.message}</span>
            <button 
              onClick={() => removeToast(t.id)} 
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <nav className="navbar">
        <Link to="/" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
          <Pizza className="float-animation" size={28} style={{ color: 'var(--primary)' }} />
          <span>Slicely<span style={{ color: 'var(--primary)' }}>.</span></span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {user.isVerified && (
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                  Pizza Builder
                </Link>
              )}
              
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                My Orders
              </Link>
              
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
                  <ShieldAlert size={16} />
                  Admin Dashboard
                </Link>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</span>
              </div>

              <button onClick={logout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}>
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: '2rem 2rem 4rem 2rem', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        {user && !user.isVerified && location.pathname !== '/auth' && (
          <div className="glass-card slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #f59e0b', marginBottom: '2rem', background: 'rgba(245, 158, 11, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <AlertTriangle style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Verify Your Email Address</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              You need to verify your email to unlock custom pizza builder ordering. Check your mailbox/console for the OTP code, and enter it to activate your account.
            </p>
            <div>
              <Link to="/auth?verify=true" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                Verify Now
              </Link>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={user ? (user.isVerified ? <Home addToast={addToast} /> : <Navigate to="/dashboard" />) : <Navigate to="/auth" />} />
          <Route path="/auth" element={!user ? <Auth addToast={addToast} /> : (user.isVerified ? <Navigate to="/" /> : <Auth addToast={addToast} />)} />
          <Route path="/dashboard" element={user ? <UserDashboard addToast={addToast} /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard addToast={addToast} /> : <Navigate to="/auth" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Slicely Pizza Delivery Inc. All rights reserved. Created locally for Oasis Infobyte.
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <AppContent />
        </OrderProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
