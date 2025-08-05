const express = require('express');
const router = express.Router();
const analytics = require("../controllers/analyticsController");

// Fixed: Use req.params instead of req.query for route parameters
// Changed from companyId to companyName
router.get('/reports', async (req, res) => {
  try {
    const result = await analytics.getReportsAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const result = await analytics.getOrderAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const result = await analytics.getInvoiceAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/quotes', async (req, res) => {
  try {
    const result = await analytics.getQuoteAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const result = await analytics.getProductAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const {  } = req.query;
    const result = await analytics.getSaleAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const {  } = req.query;
    const result = await analytics.getCustomerAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;