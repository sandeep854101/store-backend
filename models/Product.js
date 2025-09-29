const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  category: {
    type: String,
    required: true,
    index: true, // helps in filtering
  },
  brand: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  images: [
  { url: String, public_id: String }
],
stock: { type: Number, required: true, default: 0 },

}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
