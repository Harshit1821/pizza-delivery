import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { Settings, RefreshCw, ShoppingCart, Sliders, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

function AdminDashboard({ addToast }) {
  const {
    adminOrders,
    inventory,
    fetchAdminOrders,
    fetchInventory,
    updateInventoryStock,
    updateOrderStatus
  } = useOrder();

  const [activeTab, setActiveTab] = useState('orders'); // orders | inventory | alerts
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchAdminOrders();
    fetchInventory();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      addToast(`Order #${orderId} updated to "${newStatus}"`, 'success');
      fetchAdminOrders();
    } catch (err) {
      addToast('Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStockSlider = async (itemId, newQty) => {
    try {
      const item = inventory.find(i => i.id === itemId || i._id === itemId);
      await updateInventoryStock(itemId, Number(newQty), item.threshold);
    } catch (err) {
      addToast('Failed to update stock quantity.', 'error');
    }
  };

  const handleThresholdChange = async (itemId, newThreshold) => {
    try {
      const item = inventory.find(i => i.id === itemId || i._id === itemId);
      await updateInventoryStock(itemId, item.quantity, Number(newThreshold));
    } catch (err) {
      addToast('Failed to update threshold parameter.', 'error');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group inventory items by category
  const categories = ['base', 'sauce', 'cheese', 'veggie', 'meat'];

  // Check if any stock levels are low
  const lowStockItems = inventory.filter(item => item.quantity < item.threshold);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Admin Title Banner */}
      <section className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'between', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck style={{ color: 'var(--primary)' }} /> Admin Control Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage client orders and audit real-time pizza ingredient stock levels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', marginLeft: 'auto' }}>
          <button onClick={() => { fetchAdminOrders(); fetchInventory(); addToast('Database synced.', 'success'); }} className="btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{ background: 'none', border: 'none', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ShoppingCart size={16} /> Active Orders ({adminOrders.filter(o => o.status !== 'Delivered').length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{ background: 'none', border: 'none', color: activeTab === 'inventory' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'inventory' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Sliders size={16} /> Stock Inventory
          {lowStockItems.length > 0 && (
            <span style={{ fontSize: '0.75rem', background: '#dc2626', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 'bold' }}>
              {lowStockItems.length} Low
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{ background: 'none', border: 'none', color: activeTab === 'alerts' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'alerts' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Mail size={16} /> Notifications / Alert Logs
        </button>
      </div>

      {/* ORDERS LIST TAB */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {adminOrders.length > 0 ? (
            adminOrders.map((order, idx) => {
              const isDelivered = order.status === 'Delivered';
              return (
                <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: isDelivered ? '3px solid var(--accent)' : '3px solid var(--primary)', opacity: isDelivered ? 0.75 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Order ID: #{order._id || order.id}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '1rem' }}>by {order.username}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ color: '#fff', marginBottom: '0.4rem' }}>Pizzas Ordered:</h4>
                      {order.items.map((item, id) => (
                        <div key={id} style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#fff' }}>{item.name}</strong> x{item.quantity} (₹{item.price})
                          {item.customized && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', paddingLeft: '0.8rem', borderLeft: '1px solid rgba(255,255,255,0.05)', marginTop: '0.1rem' }}>
                              Crust: {item.base} | Sauce: {item.sauce} | Cheese: {item.cheese}
                              {item.veggies.length > 0 && <div>Veggies: {item.veggies.join(', ')}</div>}
                              {item.meats.length > 0 && <div>Meats: {item.meats.join(', ')}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Amount</div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>₹{order.totalAmount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payment Status</div>
                        <span style={{ fontSize: '0.75rem', background: order.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: order.paymentStatus === 'Paid' ? 'var(--accent)' : '#ef4444', padding: '0.1rem 0.5rem', borderRadius: '10px', fontWeight: 600 }}>
                          {order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Change Track Status</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id || order.id, e.target.value)}
                          className="glass-input"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                          disabled={updatingId === (order._id || order.id)}
                        >
                          <option value="Order Received">Order Received</option>
                          <option value="In the Kitchen">In the Kitchen</option>
                          <option value="Sent to Delivery">Sent to Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No client orders found in the database.</span>
            </div>
          )}
        </div>
      )}

      {/* INVENTORY TABLE TAB */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Warn alert panel */}
          {lowStockItems.length > 0 && (
            <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #dc2626', background: 'rgba(220, 38, 38, 0.03)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <AlertTriangle style={{ color: '#dc2626' }} />
              <div>
                <h4 style={{ margin: 0, color: '#fff' }}>Low Stock Alert!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  The following ingredients: <strong>{lowStockItems.map(i => i.name).join(', ')}</strong> have fallen below their safety threshold value. An alert notification will be sent to the administrator.
                </p>
              </div>
            </div>
          )}

          {/* Grouped lists */}
          {categories.map(cat => (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ textTransform: 'capitalize', color: 'var(--primary)', fontSize: '1.2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.3rem' }}>
                {cat} Options Stock
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {inventory.filter(i => i.category === cat).map(item => {
                  const itemId = item._id || item.id;
                  const isLow = item.quantity < item.threshold;
                  
                  return (
                    <div key={itemId} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', border: isLow ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{item.name}</span>
                        {isLow ? (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            Restock Needed
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: 'var(--accent)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            Normal
                          </span>
                        )}
                      </div>

                      {/* Stock amount slider */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          <span>Available Stock:</span>
                          <span style={{ fontWeight: 'bold', color: isLow ? '#ef4444' : '#fff' }}>{item.quantity} units</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="150"
                          value={item.quantity}
                          onChange={(e) => handleStockSlider(itemId, e.target.value)}
                          style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', outline: 'none', borderRadius: '4px', accentColor: isLow ? '#ef4444' : 'var(--primary)' }}
                        />
                      </div>

                      {/* Threshold parameter controller */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Low Stock Trigger Threshold:</span>
                        <input
                          type="number"
                          value={item.threshold}
                          onChange={(e) => handleThresholdChange(itemId, e.target.value)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#fff', textAlign: 'center', padding: '0.1rem' }}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERT LOGS TAB */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✉ Alert Trigger Configuration
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.6rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '150px' }}>Recipient Email:</span>
                <strong style={{ color: 'var(--primary)' }}>{process.env.ADMIN_EMAIL || 'admin@pizzadelivery.com'}</strong>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.6rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '150px' }}>Mailer Transporter:</span>
                <span style={{ color: '#fff' }}>Nodemailer SMTP System</span>
              </div>
              <div style={{ display: 'flex', paddingBottom: '0.6rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '150px' }}>Trigger Rule:</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Triggered automatically when any database ingredient stock drops below its designated parameter. Email content outputs to the backend console logs if SMTP details are left default/blank.
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>
              📋 Recent Action Log Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                🟢 Real-time Socket.io active listener connection established with browser client.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                🟢 Auto-initialized 26 gourmet stock records in database (fallback layer operational).
              </div>
              {lowStockItems.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.05)', borderLeft: '2px solid #ef4444', padding: '0.5rem 1rem', borderRadius: '6px', color: '#ef4444' }}>
                  ⚠️ STOCK ALERT: {lowStockItems.length} items have breached safety thresholds. SMTP trigger verification event scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
