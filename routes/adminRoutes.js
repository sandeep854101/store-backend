const express = require('express');
const router = express.Router();
const {
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
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.route('/users').get(getUsers);
router.route('/users/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.route('/products').get(getProducts).post(upload.array('images'), createProduct);
router.route('/products/:id').put(upload.array('images'), updateProduct).delete(deleteProduct);
router.route('/orders').get(getOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.route('/products/:id').put(upload.array('images'), updateProduct).delete(deleteProduct);
module.exports = router;