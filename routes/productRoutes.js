const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getTopProducts,
  createProduct,
  updateProduct
} = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getProducts);
router.get('/top', getTopProducts);
router.get('/:id', getProductById);

// Protected admin routes
router.use(protect, admin);
router.post('/', upload.array('images', 10), createProduct);
router.put('/:id', upload.array('images', 10), updateProduct);

module.exports = router;