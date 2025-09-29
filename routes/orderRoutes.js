const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  createOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Admin access checks inside controller
router.route('/')
  .get(protect, getOrders)   // Admin only enforced in controller
  .post(protect, createOrder);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrderStatus); // Status update handled in controller

router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;
