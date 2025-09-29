const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  number: { type: String, required: true },
  city: { type: String, required: true },
  pinCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
  type: String,
  enum: ['user', 'admin', 'delivery'],
  default: 'user'
},
  isBlocked: {
    type: Boolean,
    default: false,
  },
  addresses: [addressSchema],
  phone: {
    type: String,
  },
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
}, {
  timestamps: true,
});

// 🔑 Compare Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🔑 Hash Password Before Save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
