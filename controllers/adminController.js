const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const cloudinary = require("../utils/cloudinary");

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const productsCount = await Product.countDocuments();
  const ordersCount = await Order.countDocuments();
  
  const orders = await Order.find();
  const revenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
  
  res.json({
    usersCount,
    productsCount,
    ordersCount,
    revenue,
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      isBlocked: updatedUser.isBlocked,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Private/Admin
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, brand, stock } = req.body;

  let images = [];
  if (Array.isArray(req.files)) {
    images = req.files.map(file => ({ url: `/uploads/${file.filename}` }));
  }

  const product = new Product({
    name,
    description,
    price,
    category,
    brand,
    stock,
    images,
    user: req.user._id,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});
// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin


// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
// Helper: extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  try {
    // Example URL: https://res.cloudinary.com/dbgel16ay/image/upload/v1755665461/products/jgikrrhmz8dn5y7eiimm.jpg
    const parts = url.split("/upload/"); // ["https://res.cloudinary.com/...","v1755665461/products/jgikrrhmz8dn5y7eiimm.jpg"]
    if (!parts[1]) return null;

    const pathAfterUpload = parts[1];
    // Remove version number (v123456...) if exists
    const pathParts = pathAfterUpload.split("/");
    let startIndex = 0;
    if (pathParts[0].startsWith("v")) startIndex = 1;
    const publicIdWithExt = pathParts.slice(startIndex).join("/"); // "products/jgikrrhmz8dn5y7eiimm.jpg"
    const public_id = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf(".")); // remove extension
    return public_id;
  } catch {
    return null;
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (let img of product.images) {
        const public_id = getPublicIdFromUrl(img.url);
        if (public_id) {
          try {
            await cloudinary.uploader.destroy(public_id);
          } catch (err) {
            console.error("Cloudinary delete error:", err.message);
          }
        }
      }
    }

    // Delete product from MongoDB
    await Product.deleteOne({ _id: product._id });

    return res.json({ message: "Product removed successfully" });
  } catch (error) {
    console.error("Delete product error:", error.message);
    return res.status(500).json({ message: "Server error while deleting product" });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = req.body.status;
    
    if (req.body.status === 'Delivered') {
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});
// server/controllers/adminController.js
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, brand, stock } = req.body;
  
  const product = await Product.findById(req.params.id);

  if (product) {
    // Handle image updates
    if (req.files && req.files.images) {
      // Delete old images from Cloudinary
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
      
      // Upload new images
      const images = [];
      for (const file of req.files.images) {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'products'
        });
        images.push({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
      req.body.images = images;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.stock = stock || product.stock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

module.exports = {
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
};