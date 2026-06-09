const dbService = require('../models/dbService');
const { checkStockAndNotify } = require('./inventoryController');

// Helper to validate if ingredients are available for an order
const validateIngredientsStock = async (items) => {
  const inventory = await dbService.Inventory.find({});
  const stockMap = {};
  inventory.forEach(item => {
    stockMap[item.name.toLowerCase()] = item.quantity;
  });

  const neededIngredients = {};

  for (let item of items) {
    const qty = item.quantity || 1;
    // Check base
    if (item.base) {
      const baseName = item.base.toLowerCase();
      neededIngredients[baseName] = (neededIngredients[baseName] || 0) + qty;
    }
    // Check sauce
    if (item.sauce) {
      const sauceName = item.sauce.toLowerCase();
      neededIngredients[sauceName] = (neededIngredients[sauceName] || 0) + qty;
    }
    // Check cheese
    if (item.cheese) {
      const cheeseName = item.cheese.toLowerCase();
      neededIngredients[cheeseName] = (neededIngredients[cheeseName] || 0) + qty;
    }
    // Check veggies
    if (item.veggies && Array.isArray(item.veggies)) {
      item.veggies.forEach(veg => {
        const vegName = veg.toLowerCase();
        neededIngredients[vegName] = (neededIngredients[vegName] || 0) + qty;
      });
    }
    // Check meats
    if (item.meats && Array.isArray(item.meats)) {
      item.meats.forEach(meat => {
        const meatName = meat.toLowerCase();
        neededIngredients[meatName] = (neededIngredients[meatName] || 0) + qty;
      });
    }
  }

  // Check if any ingredient is short in stock
  for (let name in neededIngredients) {
    const available = stockMap[name] !== undefined ? stockMap[name] : 0;
    if (available < neededIngredients[name]) {
      // Find formal name
      const itemInInv = inventory.find(i => i.name.toLowerCase() === name);
      const formalName = itemInInv ? itemInInv.name : name;
      return {
        available: false,
        message: `Insufficient stock for ingredient: ${formalName}. Available: ${available}, Required: ${neededIngredients[name]}`
      };
    }
  }

  return { available: true, neededIngredients };
};

// Deduct stock after order is paid/confirmed
const deductIngredientsStock = async (neededIngredients) => {
  const inventory = await dbService.Inventory.find({});
  for (let name in neededIngredients) {
    const neededQty = neededIngredients[name];
    const item = inventory.find(i => i.name.toLowerCase() === name);
    if (item) {
      const newQty = Math.max(0, item.quantity - neededQty);
      const queryKey = global.dbFallback ? 'id' : '_id';
      const itemId = item._id || item.id;
      await dbService.Inventory.findOneAndUpdate({ [queryKey]: itemId }, { quantity: newQty });
    }
  }
  // Check for alerts and notify if needed
  await checkStockAndNotify();
};

const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.status(400).json({ message: 'Invalid order request. Items and totalAmount are required.' });
    }

    // Check stock availability
    const stockValidation = await validateIngredientsStock(items);
    if (!stockValidation.available) {
      return res.status(400).json({ message: stockValidation.message });
    }

    const orderData = {
      userId: req.user._id || req.user.id,
      username: req.user.username,
      items,
      totalAmount,
      status: 'Order Received',
      paymentStatus: 'Pending',
    };

    const newOrder = await dbService.Order.create(orderData);

    res.status(201).json({
      message: 'Order created successfully. Payment pending.',
      order: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order.' });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ message: 'OrderId and PaymentId are required.' });
    }

    const queryKey = global.dbFallback ? 'id' : '_id';
    const order = await dbService.Order.findOne({ [queryKey]: orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order has already been paid and confirmed.' });
    }

    // Re-verify stock before final confirmation
    const stockValidation = await validateIngredientsStock(order.items);
    if (!stockValidation.available) {
      // Refund or cancel logic would be here, but for our application:
      return res.status(400).json({ message: stockValidation.message });
    }

    // Confirm Payment
    const updatedOrder = await dbService.Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'Paid',
      paymentId: paymentId
    });

    // Deduct stock
    await deductIngredientsStock(stockValidation.neededIngredients);

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', updatedOrder);
      io.to(updatedOrder.userId).emit('order_update', updatedOrder);
    }

    res.status(200).json({
      message: 'Order confirmed and ingredients deducted!',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ message: 'Server error confirming order.' });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await dbService.Order.find({ userId });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error retrieving orders.' });
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const orders = await dbService.Order.find({});
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Server error retrieving orders.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Order Received', 'In the Kitchen', 'Sent to Delivery', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const queryKey = global.dbFallback ? 'id' : '_id';
    const updatedOrder = await dbService.Order.findByIdAndUpdate(id, { status });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Emit socket update for real-time status tracker on frontend
    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_update', updatedOrder);
      io.to(updatedOrder.userId).emit('order_update', updatedOrder);
    }

    res.status(200).json({ message: 'Order status updated.', order: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error updating order status.' });
  }
};

module.exports = {
  createOrder,
  confirmOrder,
  getUserOrders,
  getAdminOrders,
  updateOrderStatus,
};
