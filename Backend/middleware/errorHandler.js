const multer = require("multer");

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  // Handle custom file filter errors
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: "Something went wrong!" });
};

module.exports = errorHandler;