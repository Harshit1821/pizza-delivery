const User = require('./User');
const Order = require('./Order');
const Inventory = require('./Inventory');
const MockDb = require('../config/mockDb');

const useFallback = () => global.dbFallback === true;

// Default items to populate MongoDB with if empty
const defaultInventoryItems = [
  // Bases
  { name: 'Thin Crust', category: 'base', quantity: 50, threshold: 20 },
  { name: 'Cheese Burst', category: 'base', quantity: 50, threshold: 20 },
  { name: 'Wheat Crust', category: 'base', quantity: 50, threshold: 20 },
  { name: 'Gluten-free', category: 'base', quantity: 50, threshold: 20 },
  { name: 'Classic Pan', category: 'base', quantity: 50, threshold: 20 },
  // Sauces
  { name: 'Marinara', category: 'sauce', quantity: 50, threshold: 20 },
  { name: 'Spicy Schezwan', category: 'sauce', quantity: 50, threshold: 20 },
  { name: 'Creamy Alfredo', category: 'sauce', quantity: 50, threshold: 20 },
  { name: 'Pesto', category: 'sauce', quantity: 50, threshold: 20 },
  { name: 'BBQ', category: 'sauce', quantity: 50, threshold: 20 },
  // Cheeses
  { name: 'Mozzarella', category: 'cheese', quantity: 50, threshold: 15 },
  { name: 'Cheddar', category: 'cheese', quantity: 50, threshold: 15 },
  { name: 'Parmesan', category: 'cheese', quantity: 50, threshold: 15 },
  { name: 'Blue Cheese', category: 'cheese', quantity: 50, threshold: 15 },
  { name: 'Feta', category: 'cheese', quantity: 50, threshold: 15 },
  // Veggies
  { name: 'Onions', category: 'veggie', quantity: 80, threshold: 25 },
  { name: 'Bell Peppers', category: 'veggie', quantity: 80, threshold: 25 },
  { name: 'Mushrooms', category: 'veggie', quantity: 80, threshold: 25 },
  { name: 'Olives', category: 'veggie', quantity: 80, threshold: 25 },
  { name: 'Jalapenos', category: 'veggie', quantity: 80, threshold: 25 },
  { name: 'Sweet Corn', category: 'veggie', quantity: 80, threshold: 25 },
  { name: 'Tomatoes', category: 'veggie', quantity: 80, threshold: 25 },
  // Meats
  { name: 'Pepperoni', category: 'meat', quantity: 40, threshold: 15 },
  { name: 'Grilled Chicken', category: 'meat', quantity: 40, threshold: 15 },
  { name: 'Smoked Ham', category: 'meat', quantity: 40, threshold: 15 },
  { name: 'Sausage', category: 'meat', quantity: 40, threshold: 15 }
];

const dbService = {
  // Initialize inventory in Mongo if needed
  initializeInventory: async () => {
    if (useFallback()) {
      // Handled automatically by readData inside mockDb
      return;
    }
    try {
      const count = await Inventory.countDocuments();
      if (count === 0) {
        await Inventory.insertMany(defaultInventoryItems);
        console.log('✔ Default inventory items inserted into MongoDB.');
      }
    } catch (error) {
      console.error('Error initializing MongoDB inventory:', error);
    }
  },

  // User Service
  User: {
    create: async (data) => {
      if (useFallback()) {
        return MockDb.create('users', data);
      }
      return await User.create(data);
    },
    findOne: async (query) => {
      if (useFallback()) {
        const res = MockDb.findOne('users', query);
        if (res && res.id && !res._id) res._id = res.id; // Normalize ID field
        return res;
      }
      return await User.findOne(query);
    },
    findById: async (id) => {
      if (useFallback()) {
        const res = MockDb.findOne('users', { id });
        if (res && res.id && !res._id) res._id = res.id;
        return res;
      }
      return await User.findById(id);
    },
    findByIdAndUpdate: async (id, update) => {
      if (useFallback()) {
        const res = MockDb.findByIdAndUpdate('users', id, update);
        if (res && res.id && !res._id) res._id = res.id;
        return res;
      }
      return await User.findByIdAndUpdate(id, update, { new: true });
    },
    findOneAndUpdate: async (query, update) => {
      if (useFallback()) {
        const res = MockDb.findOneAndUpdate('users', query, update);
        if (res && res.id && !res._id) res._id = res.id;
        return res;
      }
      return await User.findOneAndUpdate(query, update, { new: true });
    }
  },

  // Inventory Service
  Inventory: {
    find: async (query = {}) => {
      if (useFallback()) {
        return MockDb.find('inventory', query);
      }
      return await Inventory.find(query);
    },
    findOne: async (query) => {
      if (useFallback()) {
        return MockDb.findOne('inventory', query);
      }
      return await Inventory.findOne(query);
    },
    findOneAndUpdate: async (query, update) => {
      if (useFallback()) {
        return MockDb.findOneAndUpdate('inventory', query, update);
      }
      return await Inventory.findOneAndUpdate(query, update, { new: true });
    },
    findByIdAndUpdate: async (id, update) => {
      if (useFallback()) {
        return MockDb.findByIdAndUpdate('inventory', id, update);
      }
      return await Inventory.findByIdAndUpdate(id, update, { new: true });
    }
  },

  // Order Service
  Order: {
    create: async (data) => {
      if (useFallback()) {
        return MockDb.create('orders', data);
      }
      return await Order.create(data);
    },
    find: async (query = {}) => {
      if (useFallback()) {
        // Sort active orders newest first by default in our mapping
        const orders = MockDb.find('orders', query);
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return orders.map(o => { o._id = o.id; return o; });
      }
      return await Order.find(query).sort({ createdAt: -1 });
    },
    findOne: async (query) => {
      if (useFallback()) {
        const res = MockDb.findOne('orders', query);
        if (res && res.id && !res._id) res._id = res.id;
        return res;
      }
      return await Order.findOne(query);
    },
    findByIdAndUpdate: async (id, update) => {
      if (useFallback()) {
        const res = MockDb.findByIdAndUpdate('orders', id, update);
        if (res && res.id && !res._id) res._id = res.id;
        return res;
      }
      return await Order.findByIdAndUpdate(id, update, { new: true });
    }
  }
};

module.exports = dbService;
