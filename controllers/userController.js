const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ------------------- Validation Helpers -------------------
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password && password.length >= 8;

// ------------------- Auth User -------------------
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (user && (await user.matchPassword(password))) {
    if (user.isBlocked) {
      return res.status(403).json({ message: 'User is blocked. Contact support.' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// ------------------- Register User -------------------
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, phone });

  if (!user) {
    return res.status(400).json({ message: 'Invalid user data' });
  }

  return res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    token: generateToken(user._id),
  });
});

// ------------------- Get User Profile -------------------
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// ------------------- Update User Profile -------------------
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (req.body.email && !validateEmail(req.body.email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.address = req.body.address || user.address;
  user.phone = req.body.phone || user.phone;

  if (req.body.password) {
    if (!validatePassword(req.body.password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    token: generateToken(updatedUser._id),
  });
});

// ------------------- Cart Management -------------------
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Valid product ID and quantity are required' });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const user = await User.findById(req.user._id);
  const itemIndex = user.cart.findIndex((item) => item.product.toString() === productId);

  if (itemIndex >= 0) {
    user.cart[itemIndex].quantity += quantity;
  } else {
    user.cart.push({ product: productId, quantity });
  }

  await user.save();
  res.status(201).json({ message: 'Item added to cart' });
});

const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json(user.cart);
});

const removeFromCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter((item) => item.product.toString() !== req.params.id);
  await user.save();
  res.json({ message: 'Item removed from cart' });
});

// ------------------- Orders -------------------
const createOrder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  if (!user.cart.length) {
    return res.status(400).json({ message: 'No items in cart' });
  }

  const { shippingAddress } = req.body;
  if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
    return res.status(400).json({ message: 'Complete shipping address is required' });
  }

  const orderItems = user.cart.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    image: item.product.images[0].url,
    price: item.product.price,
    product: item.product._id,
  }));

  const totalPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: 'COD',
    totalPrice,
  });

  const createdOrder = await order.save();
  user.cart = [];
  await user.save();

  res.status(201).json(createdOrder);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized to access this order' });
  }

  res.json(order);
});

module.exports = {
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
};
