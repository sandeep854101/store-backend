const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect middleware: Verify JWT & attach user to request
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user & exclude password
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found, authorization failed' });
      }

      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied, admin only' });
};

// Delivery middleware
const delivery = (req, res, next) => {
  if (req.user?.role === 'delivery') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied, delivery staff only' });
};

// Admin or Delivery
const adminOrDelivery = (req, res, next) => {
  if (['admin', 'delivery'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied, admin or delivery only' });
};

module.exports = { protect, admin, delivery, adminOrDelivery };
