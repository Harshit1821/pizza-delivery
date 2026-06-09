import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const standardPizzas = [
    {
      id: 'sp1',
      name: 'Classic Margherita',
      description: 'Simple yet delicious. Tomato sauce, mozzarella cheese, and fresh tomatoes.',
      price: 299,
      base: 'Classic Pan',
      sauce: 'Marinara',
      cheese: 'Mozzarella',
      veggies: ['Tomatoes'],
      meats: [],
      image: '🍕'
    },
    {
      id: 'sp2',
      name: 'Farmhouse Garden',
      description: 'Loaded with fresh crunchy onions, bell peppers, mushrooms, and sweet corn.',
      price: 449,
      base: 'Thin Crust',
      sauce: 'Marinara',
      cheese: 'Mozzarella',
      veggies: ['Onions', 'Bell Peppers', 'Mushrooms', 'Sweet Corn'],
      meats: [],
      image: '🥦'
    },
    {
      id: 'sp3',
      name: 'Pepperoni Supreme',
      description: 'Double portion of spicy sliced pepperoni topped with extra mozzarella cheese.',
      price: 499,
      base: 'Classic Pan',
      sauce: 'Marinara',
      cheese: 'Mozzarella',
      veggies: [],
      meats: ['Pepperoni'],
      image: '🍖'
    },
    {
      id: 'sp4',
      name: 'Pesto Veggie Delight',
      description: 'Artisanal wheat crust spread with rich pesto sauce, olives, jalapenos, and tomatoes.',
      price: 429,
      base: 'Wheat Crust',
      sauce: 'Pesto',
      cheese: 'Mozzarella',
      veggies: ['Olives', 'Jalapenos', 'Tomatoes'],
      meats: [],
      image: '🍃'
    },
    {
      id: 'sp5',
      name: 'Spicy Chicken BBQ',
      description: 'Zesty BBQ sauce, cheddar cheese, grilled chicken, red onions, and fiery jalapenos.',
      price: 529,
      base: 'Gluten-free',
      sauce: 'BBQ',
      cheese: 'Cheddar',
      veggies: ['Onions', 'Jalapenos'],
      meats: ['Grilled Chicken'],
      image: '🔥'
    }
  ];

  const fetchInventory = async () => {
    const token = localStorage.getItem('pizza_token');
    if (!token) return;
    try {
      const response = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchUserOrders = async () => {
    const token = localStorage.getItem('pizza_token');
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/orders/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminOrders = async () => {
    const token = localStorage.getItem('pizza_token');
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    try {
      const response = await fetch('/api/orders/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminOrders(data);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryStock = async (id, quantity, threshold) => {
    const token = localStorage.getItem('pizza_token');
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity, threshold })
      });
      if (response.ok) {
        const data = await response.json();
        setInventory(prev => prev.map(item => item.id === id || item._id === id ? data.item : item));
        return data.item;
      } else {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update inventory');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err;
    }
  };

  const createPendingOrder = async (orderItems, totalAmount) => {
    const token = localStorage.getItem('pizza_token');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: orderItems, totalAmount })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      return data.order;
    } catch (err) {
      console.error('Error placing order:', err);
      throw err;
    }
  };

  const confirmPaidOrder = async (orderId, paymentId, isMock = false) => {
    const token = localStorage.getItem('pizza_token');
    try {
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, paymentId, isMock })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Payment confirmation failed on server.');
      }
      // Refresh local stock and orders list
      fetchInventory();
      fetchUserOrders();
      return data.order;
    } catch (err) {
      console.error('Error confirming order payment:', err);
      throw err;
    }
  };

  const createRazorpayTx = async (amount) => {
    const token = localStorage.getItem('pizza_token');
    try {
      const response = await fetch('/api/payment/razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error creating Razorpay transaction:', err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const token = localStorage.getItem('pizza_token');
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        const data = await response.json();
        setAdminOrders(prev => prev.map(o => o.id === orderId || o._id === orderId ? data.order : o));
        return data.order;
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchUserOrders();
      if (user.role === 'admin') {
        fetchAdminOrders();
      }
    } else {
      setInventory([]);
      setOrders([]);
      setAdminOrders([]);
      setCart(null);
    }
  }, [user]);

  return (
    <OrderContext.Provider value={{
      inventory,
      orders,
      adminOrders,
      standardPizzas,
      cart,
      loading,
      setCart,
      fetchInventory,
      fetchUserOrders,
      fetchAdminOrders,
      updateInventoryStock,
      createPendingOrder,
      confirmPaidOrder,
      createRazorpayTx,
      updateOrderStatus,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext);
export default OrderContext;
