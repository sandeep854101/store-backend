const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Successfully connected, no console logs
  } catch (err) {
    // Fail gracefully
    process.exit(1);
  }
};

module.exports = connectDB;
