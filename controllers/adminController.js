const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const cloudinary = require("../utils/cloudinary");


const getDashboardStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const productsCount = await Product.countDocuments();
  const ordersCount = await Order.countDocuments();

  const orders = await Order.find();  
  const revenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
  const pendingOrders = ordersCount - deliveredOrders;

  res.json({
    usersCount,
    productsCount,
    ordersCount,
    deliveredOrders,
    pendingOrders,
    revenue,
  });
});

// ---------------- User Management ----------------
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// @desc    Update user (role, block/unblock)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role; // 'user' | 'admin' | 'delivery'
  user.isBlocked = req.body.isBlocked ?? user.isBlocked;

  const updatedUser = await user.save();
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    isBlocked: updatedUser.isBlocked,
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await user.deleteOne();
  res.json({ message: "User removed" });
});

// ---------------- Product Management ----------------
// @desc    Get all products
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
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "At least one image is required" });
  }

  // Upload images to Cloudinary from buffer
  const uploadedImages = [];
  for (const file of req.files) {
    try {
      // Convert buffer to base64 for Cloudinary
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      const result = await cloudinary.uploader.upload(dataUri, { 
        folder: 'products',
        resource_type: 'image'
      });
      
      uploadedImages.push({ 
        url: result.secure_url, 
        public_id: result.public_id 
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({ message: 'Error uploading image to Cloudinary' });
    }
  }

  const product = new Product({
    name,
    description,
    price,
    category,
    brand,
    stock,
    images: uploadedImages,
    user: req.user._id,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, brand, stock } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Handle multiple images if new files are uploaded
  if (req.files && req.files.length > 0) {
    // Delete old images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error);
        }
      }
    }

    // Upload new images
    const uploadedImages = [];
    for (const file of req.files) {
      try {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        const result = await cloudinary.uploader.upload(dataUri, { 
          folder: 'products',
          resource_type: 'image'
        });
        
        uploadedImages.push({ 
          url: result.secure_url, 
          public_id: result.public_id 
        });
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: 'Error uploading image to Cloudinary' });
      }
    }
    product.images = uploadedImages;
  }

  // Update other fields
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.brand = brand || product.brand;
  product.stock = stock || product.stock;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  // Delete all images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      try {
        await cloudinary.uploader.destroy(img.public_id);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }
  }

  await product.deleteOne();
  res.json({ message: "Product removed successfully" });
});

// ---------------- Order Management ----------------
// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate("user", "id name email role");
  res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin or Delivery
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, deliveryStaffId } = req.body; // optional: assign delivery
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status || order.status;

  if (status === "Delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  if (deliveryStaffId) {
    order.deliveryStaff = deliveryStaffId; // requires schema update
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
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