const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'],
  },
  quantity: {
    type: Number,
    required: true,
    default: 50,
  },
  threshold: {
    type: Number,
    required: true,
    default: 20,
  },
});

module.exports = mongoose.model('Inventory', InventorySchema);
