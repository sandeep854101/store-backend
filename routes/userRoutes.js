const express = require('express');
const router = express.Router();
const {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  addToCart,
  getCart,
  removeFromCart,
  createOrder,
  getMyOrders,
  getOrderById,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/register', registerUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/cart')
  .get(protect, getCart)
  .post(protect, addToCart);

router.delete('/cart/:id', protect, removeFromCart);

router.route('/orders')
  .get(protect, getMyOrders)
  .post(protect, createOrder);

router.get('/orders/:id', protect, getOrderById);

module.exports = router;
