const multer = require('multer');

// Store file in memory instead of local disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter(req, file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, jpeg, png) are allowed'));
    }
  },
});

module.exports = upload;
