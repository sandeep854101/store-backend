// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  createOrder,
} = require('../controllers/orderController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

router.route('/')
  .get(protect, admin, getOrders)
  .post(protect, createOrder);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, admin, updateOrderToDelivered);

router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;