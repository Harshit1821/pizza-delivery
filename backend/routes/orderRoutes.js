const express = require('express');
const router = express.Router();
const {
  createOrder,
  confirmOrder,
  getUserOrders,
  getAdminOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

router.post('/', auth, createOrder);
router.post('/confirm', auth, confirmOrder);
router.get('/user', auth, getUserOrders);
router.get('/admin', auth, admin, getAdminOrders);
router.put('/:id/status', auth, admin, updateOrderStatus);

module.exports = router;
