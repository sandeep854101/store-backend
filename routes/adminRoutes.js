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

// Cloudinary upload handled inside controller, no need for local upload
const upload = require('../middleware/uploadMiddleware');

router.use(protect, admin); // All routes protected & admin only

router.get('/dashboard', getDashboardStats);

// Users
router.route('/users').get(getUsers);
router.route('/users/:id').get(getUserById).put(updateUser).delete(deleteUser);

// Products
router.route('/products')
  .get(getProducts)
  .post(upload.array('images', 10), createProduct);

router.route('/products/:id')
  .put(upload.array('images', 10), updateProduct)
  .delete(deleteProduct);

// Orders
router.route('/orders').get(getOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
