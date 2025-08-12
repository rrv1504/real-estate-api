// index.js or routes/upload.js
const express = require('express');
const multer = require('multer');
const { storageCloudinary } = require('./config/cloudinary'); // adjust path as needed
const upload = multer({ storage });
const app = express();

app.post('/upload', upload.single('image'), (req, res) => {
  res.json({
    message: 'Image uploaded successfully',
    imageUrl: req.file.path,     // Cloudinary URL
    publicId: req.file.filename  // Useful for deletion
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});