const express = require("express");
const router = express.Router();
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/uploadMiddleware");

// Single image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        msg: "No file uploaded" 
      });
    }

    // Check file size
    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        msg: "File exceeds the 20MB size limit"
      });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "products",
      resource_type: "image"
    });

    res.json({
      success: true,
      imageUrl: result.secure_url,
      message: "Image uploaded successfully"
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ 
      success: false,
      msg: "Upload failed", 
      error: err.message 
    });
  }
});

// Limits info
router.get("/limits", (req, res) => {
  res.json({
    success: true,
    limits: {
      maxFileSize: "20MB",
      maxFiles: 1,
      allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    }
  });
});

module.exports = router;
