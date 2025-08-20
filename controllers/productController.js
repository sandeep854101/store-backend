const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');

// Create product with image handling
const createProduct = async (req, res) => {
  try {
    let images = [];

    // Case 1: If files are uploaded (via multer)
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map(async (file) => {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = "data:" + file.mimetype + ";base64," + b64;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'products',
          });

          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );
    } 
    // Case 2: If frontend sends image URLs directly
else if (req.body.images && req.body.images.length > 0) {
  images = req.body.images.map((img) => {
    // if frontend sends plain string
    if (typeof img === "string") {
      return { url: img };
    }
    // if frontend already sends object like { url: "..." }
    if (typeof img === "object" && img.url) {
      return { url: img.url, public_id: img.public_id || undefined };
    }
    return null;
  }).filter(Boolean);
}


    const product = new Product({
      ...req.body,
      images,
      user: req.user._id,
    });

    await product.save();

    res.status(201).json({
      success: true,
      product,
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};


// Update product with image handling
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let images = product.images; // keep old images if not replaced

    // Case 1: If new files are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary if they exist
      await Promise.all(
        product.images.map((image) =>
          image.public_id ? cloudinary.uploader.destroy(image.public_id) : null
        )
      );

      images = await Promise.all(
        req.files.map(async (file) => {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = "data:" + file.mimetype + ";base64," + b64;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'products',
          });

          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );
    } 
    // Case 2: If frontend sends image URLs directly
    else if (req.body.images && req.body.images.length > 0) {
      images = req.body.images.map((url) => ({ url }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      product: updatedProduct,
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};


// Fetch all products
const getProducts = async (req, res) => {
  try {
    const pageSize = 8; 
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: 'i' } }
      : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Fetch single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Get top rated products
const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ rating: -1 }).limit(4);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  getTopProducts,
};
