const express = require('express');
const router = express.Router();
const upload = require('../config/multer'); 
const productController = require('../controllers/productController');

// GET all products
router.get('/', productController.getAllProducts);

// GET single product
router.get('/:id', productController.getProductById);

// CREATE product (with image upload)
router.post('/', upload.single('image'), productController.createProduct);

// UPDATE product (with optional image upload)
router.put('/:id', upload.single('image'), productController.updateProduct);

// DELETE product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
