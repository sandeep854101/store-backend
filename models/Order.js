const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    },
  ],
  shippingAddress: {
    type: Object,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'COD',
    enum: ['COD', 'Razorpay', 'Stripe', 'PayPal'],
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    default: 'Placed',
    enum: ['Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId, // ✅ Staff assigned to deliver
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
