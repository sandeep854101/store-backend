const express = require("express");
const router = express.Router();
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/uploadMiddleware");

// Multiple image upload with enhanced error handling
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        msg: "No files uploaded" 
      });
    }

    // Check if files are too large (additional validation)
    const oversizedFiles = req.files.filter(file => file.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return res.status(413).json({
        success: false,
        msg: "One or more files exceed the 20MB size limit"
      });
    }

    const uploadResults = await Promise.all(
      req.files.map(file => {
        try {
          // Convert buffer to base64 for Cloudinary
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = "data:" + file.mimetype + ";base64," + b64;
          
          return cloudinary.uploader.upload(dataURI, {
            folder: "products",
            resource_type: "image",
            timeout: 60000 // 60 second timeout for large files
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
        }
      })
    );

    res.json({
      success: true,
      urls: uploadResults.map(result => result.secure_url),
      message: `${req.files.length} image(s) uploaded successfully`
    });

  } catch (err) {
    console.error("Upload error:", err);
    
    // Handle specific Cloudinary errors
    if (err.message.includes("File size too large")) {
      return res.status(413).json({ 
        success: false,
        msg: "File too large for Cloudinary. Maximum size is 10MB for free accounts." 
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: "Upload failed", 
      error: err.message 
    });
  }
});

// Get upload limits
router.get("/limits", (req, res) => {
  res.json({
    success: true,
    limits: {
      maxFileSize: "20MB",
      maxFiles: 5,
      allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    }
  });
});

module.exports = router;