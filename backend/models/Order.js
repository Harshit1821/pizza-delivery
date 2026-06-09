const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  items: [
    {
      name: { type: String, required: true }, // Custom Pizza or Pizza Name
      customized: { type: Boolean, default: false },
      base: { type: String },
      sauce: { type: String },
      cheese: { type: String },
      veggies: [{ type: String }],
      meats: [{ type: String }],
      price: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Order Received', 'In the Kitchen', 'Sent to Delivery', 'Delivered'],
    default: 'Order Received',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  },
  paymentId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
