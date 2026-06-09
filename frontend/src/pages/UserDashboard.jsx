import React, { useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, ChevronRight, Package, Utensils, Truck, Check } from 'lucide-react';

function UserDashboard({ addToast }) {
  const { user } = useAuth();
  const { orders, fetchUserOrders, loading } = useOrder();

  useEffect(() => {
    fetchUserOrders();
  }, []);

  // Filter out the most recent paid order to show as the active tracking timeline
  const activeOrder = orders.find(o => o.paymentStatus === 'Paid' && o.status !== 'Delivered');
  const pastOrders = orders.filter(o => o.paymentStatus === 'Paid' && o.status === 'Delivered');

  const statusSteps = [
    { label: 'Order Received', desc: 'We have received your order and payment.', icon: Package },
    { label: 'In the Kitchen', desc: 'Our chefs are crafting your customized pizza.', icon: Utensils },
    { label: 'Sent to Delivery', desc: 'Out for delivery! Your driver is on the way.', icon: Truck },
    { label: 'Delivered', desc: 'Delicious pizza has been dropped off. Enjoy!', icon: CheckCircle2 }
  ];

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.label === status);
  };

  const activeIndex = activeOrder ? getStatusIndex(activeOrder.status) : -1;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Title block */}
      <section style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Welcome Back, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track your custom pizza status in real-time or review past gourmet bakes.
          </p>
        </div>
      </section>

      {/* Grid: Active Tracker on Left, History List on Right */}
      <div className="dashboard-grid">
        
        {/* Active tracking timeline section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.8rem', fontFamily: 'var(--font-display)' }}>
            📍 Real-time Order Tracker
          </h2>

          {activeOrder ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Order ID</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>#{activeOrder._id || activeOrder.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Placed At</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(activeOrder.createdAt)}</div>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="timeline">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx < activeIndex;
                  const isActive = idx === activeIndex;
                  const itemClass = isCompleted ? 'completed' : isActive ? 'active' : '';

                  return (
                    <div key={idx} className={`timeline-item ${itemClass}`}>
                      <div className="timeline-marker">
                        {isCompleted && <Check size={12} style={{ color: '#fff' }} />}
                      </div>
                      <div className="timeline-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                          <Icon size={16} style={{ color: isCompleted ? 'var(--accent)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: isActive || isCompleted ? '#fff' : 'var(--text-secondary)' }}>
                            {step.label}
                          </h4>
                          {isActive && (
                            <span style={{ fontSize: '0.7rem', background: 'rgba(249, 115, 22, 0.15)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '10px', fontWeight: 600 }}>
                              In Progress
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', borderStyle: 'dashed' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🍕</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>No Active Orders</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                Your custom creations will appear here in real-time when placed. Create one now!
              </p>
            </div>
          )}
        </div>

        {/* Order History column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.8rem', fontFamily: 'var(--font-display)' }}>
            📜 Order History
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '480px' }}>
            {pastOrders.length > 0 ? (
              pastOrders.map((order, index) => (
                <div key={index} className="glass-card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Delivered</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatDate(order.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                    {order.items.map(i => i.name).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Amount Paid:</span>
                    <span style={{ fontWeight: 600 }}>₹{order.totalAmount}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No completed orders found.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserDashboard;
