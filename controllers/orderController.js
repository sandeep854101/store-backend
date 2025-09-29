// server/controllers/orderController.js
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Save shipping address to user if not already saved
  const user = await User.findById(req.user._id);
  if (user) {
    if (!user.address) user.address = shippingAddress.address;
    if (!user.phone) user.phone = shippingAddress.number;
    await user.save();
  }

  const order = new Order({
    orderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    totalPrice,
    status: 'Placed',
    isPaid: false,
    isDelivered: false,
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email role');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only owner, admin, or delivery can access
  if (
    order.user._id.toString() === req.user._id.toString() ||
    ['admin', 'delivery'].includes(req.user.role)
  ) {
    res.json(order);
  } else {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer?.email_address,
  };

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Update order status (Packed/Shipped/Delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin or Delivery
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!['admin', 'delivery'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to update order status');
  }

  // Update status
  if (['Placed', 'Packed', 'Shipped', 'Delivered'].includes(status)) {
    order.status = status;
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(400);
    throw new Error('Invalid status value');
  }
});

// @desc    Get logged-in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const orders = await Order.find({}).populate('user', 'id name email role');
  res.json(orders);
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
};
