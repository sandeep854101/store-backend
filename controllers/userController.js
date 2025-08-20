const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
// ...existing code...
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) { // <-- fixed parenthesis here
    if (user.isBlocked) {
      res.status(401);
      throw new Error('User is blocked. Contact support.');
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});
// ...existing code...

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password ,phone} = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
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
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Add item to cart
// @route   POST /api/users/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(req.user._id);
  
  // Check if item already exists in cart
  const itemIndex = user.cart.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex >= 0) {
    // Update quantity if item exists
    user.cart[itemIndex].quantity += quantity;
  } else {
    // Add new item to cart
    user.cart.push({ product: productId, quantity });
  }

  await user.save();
  res.status(201).json({ message: 'Item added to cart' });
});

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  
  res.json(user.cart);
});

// @desc    Remove item from cart
// @route   DELETE /api/users/cart/:id
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.cart = user.cart.filter(
    (item) => item.product.toString() !== req.params.id
  );

  await user.save();
  res.json({ message: 'Item removed from cart' });
});

// @desc    Create new order
// @route   POST /api/users/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  
  if (user.cart.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  const orderItems = user.cart.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    image: item.product.images[0].url,
    price: item.product.price,
    product: item.product._id,
  }));

  const totalPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: 'COD',
    totalPrice,
  });

  const createdOrder = await order.save();
  
  // Clear cart after order is placed
  user.cart = [];
  await user.save();

  res.status(201).json(createdOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/users/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/users/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    // Check if the order belongs to the user or if the user is admin
    if (order.user._id.toString() === req.user._id.toString() || req.user.isAdmin) {
      res.json(order);
    } else {
      res.status(401);
      throw new Error('Not authorized');
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
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