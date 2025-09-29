require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

// Connect to DB
require("./config/db")();

const app = express();

// Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Not Found
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
