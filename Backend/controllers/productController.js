const { Pool } = require('pg');
const path = require('path');
const { deleteFile } = require('../utils/fileHelpers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to build full image URL
const getImageUrl = (imagePath) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;
  return imagePath ? `${baseUrl}${imagePath}` : null;
};

// GET all products
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    const products = result.rows.map(product => ({
      id: product.id,
      sku: product.sku,
      image: getImageUrl(product.image),
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description || null,
    }));
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// GET single product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = result.rows[0];
    res.json({
      id: product.id,
      sku: product.sku,
      image: getImageUrl(product.image),
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description || null,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// CREATE new product
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, quantity, description } = req.body;

    if (!sku || !name || price == null || quantity == null) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: 'sku, name, price, and quantity are required' });
    }

    if (isNaN(price) || isNaN(quantity) || parseInt(quantity) < 0) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: 'Invalid price or quantity' });
    }

    const existing = await pool.query('SELECT * FROM products WHERE sku = $1', [sku]);
    if (existing.rows.length > 0) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: 'Product with this SKU already exists' });
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
    const result = await pool.query(
      'INSERT INTO products (sku, image, name, price, quantity, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [sku, imagePath, name, parseFloat(price), parseInt(quantity), description || null]
    );

    const product = result.rows[0];
    res.status(201).json({
      id: product.id,
      sku: product.sku,
      image: getImageUrl(product.image),
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description || null,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// UPDATE product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, price, quantity, description } = req.body;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ error: 'Product not found' });
    }

    if (sku && sku !== existing.rows[0].sku) {
      const conflict = await pool.query('SELECT * FROM products WHERE sku = $1', [sku]);
      if (conflict.rows.length > 0) {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ error: 'SKU already in use' });
      }
    }

    if (price != null && isNaN(price)) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: 'Invalid price' });
    }

    if (quantity != null && (isNaN(quantity) || parseInt(quantity) < 0)) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const updated = {
      sku: sku || existing.rows[0].sku,
      name: name || existing.rows[0].name,
      price: price != null ? parseFloat(price) : existing.rows[0].price,
      quantity: quantity != null ? parseInt(quantity) : existing.rows[0].quantity,
      description: description !== undefined ? description : existing.rows[0].description,
      image: req.file ? `/uploads/products/${req.file.filename}` : existing.rows[0].image,
    };

    if (req.file && existing.rows[0].image) {
      const oldPath = path.join(__dirname, '..', existing.rows[0].image);
      deleteFile(oldPath);
    }

    const result = await pool.query(
      'UPDATE products SET sku = $1, image = $2, name = $3, price = $4, quantity = $5, description = $6 WHERE id = $7 RETURNING *',
      [updated.sku, updated.image, updated.name, updated.price, updated.quantity, updated.description, parseInt(id)]
    );

    const product = result.rows[0];
    res.json({
      id: product.id,
      sku: product.sku,
      image: getImageUrl(product.image),
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description || null,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.rows[0].image) {
      const imagePath = path.join(__dirname, '..', existing.rows[0].image);
      deleteFile(imagePath);
    }

    await pool.query('DELETE FROM products WHERE id = $1', [parseInt(id)]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
