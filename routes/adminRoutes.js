const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');

// Apply protect and admin middleware to all routes
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Products - Add handleMulterError middleware
router.route('/products')
  .get(getProducts)
  .post(upload.array('images', 10), handleMulterError, createProduct);

router.route('/products/:id')
  .put(upload.array('images', 10), handleMulterError, updateProduct)
  .delete(deleteProduct);

// Orders
router.route('/orders')
  .get(getOrders);

router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;