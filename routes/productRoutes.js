const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.route('/').get(getProducts).post(protect, admin, upload.array('images', 10), createProduct);
router.get('/top', getTopProducts);

// Reviews
router.route('/:id/reviews').post(protect, createProductReview);

// Product operations
router.route('/:id')
  .get(getProductById)
  .put(protect, admin, upload.array('images', 10), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
