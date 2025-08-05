const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const {
  mapDiscountToEnum,
  mapDiscountFromEnum,
  mapSalesStatusToEnum,
  mapSalesStatusFromEnum,
  mapPaymentMethodToEnum,
  mapPaymentMethodFromEnum,
  getDiscountPercentage,
} = require('../enumMapper');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all sales
const getAllSales = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as customer_name, p.name as product_name
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      LEFT JOIN products p ON s."productId" = p.id
      ORDER BY s."createdAt" DESC
    `);

    const transformedSales = result.rows.map((sale) => ({
      id: sale.id,
      saleId: sale.saleId,
      customerId: sale.customerId,
      customerName: sale.customer_name || sale.customerId.toString(),
      date: sale.date.toISOString().split('T')[0],
      productId: sale.productId,
      productName: sale.product_name || sale.productId.toString(),
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      discount: mapDiscountFromEnum(sale.discount),
      amount: sale.amount,
      paymentMethod: mapPaymentMethodFromEnum(sale.paymentMethod),
      notes: sale.notes || '',
      createdBy: sale.createdBy,
      companyId: sale.companyId || null,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
    }));

    res.json(transformedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

// GET single sale
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, c.name as customer_name, p.name as product_name
      FROM sales s
      LEFT JOIN customers c ON s.customerId = c.id
      LEFT JOIN products p ON s.productId = p.id
      WHERE s.id = $1
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = result.rows[0];
    res.json({
      id: sale.id,
      saleId: sale.saleId,
      customerId: sale.customerId,
      customerName: sale.customer_name || sale.customerId.toString(),
      date: sale.date.toISOString().split('T')[0],
      productId: sale.productId,
      productName: sale.product_name || sale.productId.toString(),
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      discount: mapDiscountFromEnum(sale.discount),
      amount: sale.amount,
      paymentMethod: mapPaymentMethodFromEnum(sale.paymentMethod),
      notes: sale.notes || '',
      createdBy: sale.createdBy,
      companyId: sale.companyId || null,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
};

// CREATE new sale
const createSale = async (req, res) => {
  try {
    const {
      customerId,
      productId,
      date,
      quantity,
      unitPrice,
      discount,
      paymentMethod,
      notes,
      createdBy,
      companyId,
    } = req.body;

    if (!customerId || !productId || !date || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate customer and product existence
    const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [parseInt(customerId)]);
    if (customer.rows.length === 0) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const product = await pool.query('SELECT id, quantity FROM products WHERE id = $1', [parseInt(productId)]);
    if (product.rows.length === 0) {
      return res.status(400).json({ error: 'Product not found' });
    }

    if (product.rows[0].quantity < parseFloat(quantity)) {
      return res.status(400).json({ error: 'Insufficient product quantity' });
    }

    const saleId = `SALE-${Date.now()}`;
    const discountPercentage = getDiscountPercentage(discount);
    const amount = parseFloat(quantity) * parseFloat(unitPrice) * (1 - discountPercentage);

    await pool.query('BEGIN');
    try {
      // Insert sale
      const saleResult = await pool.query(
        `INSERT INTO sales (sale_id, customerId, productId, companyId, date, quantity, unit_price, discount, amount, payment_method, notes, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          saleId,
          parseInt(customerId),
          parseInt(productId),
          companyId || null,
          new Date(date),
          parseFloat(quantity),
          parseFloat(unitPrice),
          mapDiscountToEnum(discount) || 'NONE',
          amount,
          mapPaymentMethodToEnum(paymentMethod) || 'CASH',
          notes || null,
          createdBy || 'Admin',
          new Date(),
          new Date(),
        ]
      );

      // Update product quantity
      await pool.query('UPDATE products SET quantity = quantity - $1 WHERE id = $2', [
        parseFloat(quantity),
        parseInt(productId),
      ]);

      await pool.query('COMMIT');

      const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);
      const productResult = await pool.query('SELECT name FROM products WHERE id = $1', [parseInt(productId)]);
      const sale = saleResult.rows[0];

      res.status(201).json({
        id: sale.id,
        saleId: sale.saleId,
        customerId: sale.customerId,
        customerName: customerResult.rows[0]?.name || sale.customerId.toString(),
        date: sale.date.toISOString().split('T')[0],
        productId: sale.productId,
        productName: productResult.rows[0]?.name || sale.productId.toString(),
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        discount: mapDiscountFromEnum(sale.discount),
        amount: sale.amount,
        paymentMethod: mapPaymentMethodFromEnum(sale.paymentMethod),
        notes: sale.notes || '',
        createdBy: sale.createdBy,
        companyId: sale.companyId || null,
        createdAt: sale.createdAt.toISOString(),
        updatedAt: sale.updatedAt.toISOString(),
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
};

// UPDATE sale
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
      productId,
      date,
      quantity,
      unitPrice,
      discount,
      status,
      paymentMethod,
      notes,
      createdBy,
      companyId,
    } = req.body;

    const existingSale = await pool.query('SELECT * FROM sales WHERE id = $1', [parseInt(id)]);
    if (existingSale.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Validate customer and product existence
    const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [parseInt(customerId)]);
    if (customer.rows.length === 0) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const product = await pool.query('SELECT id, quantity FROM products WHERE id = $1', [parseInt(productId)]);
    if (product.rows.length === 0) {
      return res.status(400).json({ error: 'Product not found' });
    }

    // Adjust product quantity: restore old quantity, check new quantity
    const oldQuantity = existingSale.rows[0].quantity;
    const availableQuantity = product.rows[0].quantity + oldQuantity;
    if (availableQuantity < parseFloat(quantity)) {
      return res.status(400).json({ error: 'Insufficient product quantity' });
    }

    const discountPercentage = getDiscountPercentage(discount);
    const amount = parseFloat(quantity) * parseFloat(unitPrice) * (1 - discountPercentage);

    await pool.query('BEGIN');
    try {
      // Restore old quantity
      await pool.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [
        oldQuantity,
        existingSale.rows[0].productId,
      ]);

      // Deduct new quantity
      await pool.query('UPDATE products SET quantity = quantity - $1 WHERE id = $2', [
        parseFloat(quantity),
        parseInt(productId),
      ]);

      // Update sale
      const saleResult = await pool.query(
        `UPDATE sales SET customerId = $1, productId = $2, companyId = $3, date = $4, quantity = $5, unit_price = $6, discount = $7, amount = $8,  payment_method = $10, notes = $11, created_by = $12, updated_at = $13
         WHERE id = $14 RETURNING *`,
        [
          parseInt(customerId),
          parseInt(productId),
          companyId || null,
          new Date(date),
          parseFloat(quantity),
          parseFloat(unitPrice),
          mapDiscountToEnum(discount) || 'NONE',
          amount,
          mapPaymentMethodToEnum(paymentMethod) || existingSale.rows[0].payment_method,
          notes || null,
          createdBy || existingSale.rows[0].created_by,
          new Date(),
          parseInt(id),
        ]
      );

      await pool.query('COMMIT');

      const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);
      const productResult = await pool.query('SELECT name FROM products WHERE id = $1', [parseInt(productId)]);
      const sale = saleResult.rows[0];

      res.json({
        id: sale.id,
        saleId: sale.saleId,
        customerId: sale.customerId,
        customerName: customerResult.rows[0]?.name || sale.customerId.toString(),
        date: sale.date.toISOString().split('T')[0],
        productId: sale.productId,
        productName: productResult.rows[0]?.name || sale.productId.toString(),
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        discount: mapDiscountFromEnum(sale.discount),
        amount: sale.amount,
        paymentMethod: mapPaymentMethodFromEnum(sale.paymentMethod),
        notes: sale.notes || '',
        createdBy: sale.createdBy,
        companyId: sale.companyId || null,
        createdAt: sale.createdAt.toISOString(),
        updatedAt: sale.updatedAt.toISOString(),
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
};

// DELETE sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSale = await pool.query('SELECT * FROM sales WHERE id = $1', [parseInt(id)]);
    if (existingSale.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    await pool.query('BEGIN');
    try {
      // Restore product quantity
      await pool.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [
        existingSale.rows[0].quantity,
        existingSale.rows[0].productId,
      ]);

      await pool.query('DELETE FROM sales WHERE id = $1', [parseInt(id)]);
      await pool.query('COMMIT');

      res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};

// Download sales PDF report
const downloadSalesPDF = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as customer_name, p.name as product_name
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      LEFT JOIN products p ON s."productId" = p.id
      ORDER BY s."createdAt" DESC
    `);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Sales Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalSales = result.rows.length;
    const totalAmount = result.rows.reduce((sum, sale) => sum + sale.amount, 0);
    const completedSales = result.rows.filter(s => s.status === 'COMPLETED').length;
    const pendingSales = result.rows.filter(s => s.status === 'PENDING').length;

    doc.fontSize(12);
    doc.text(`Total Sales: ${totalSales}`, 50, 100);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 50, 120);
    doc.text(`Completed: ${completedSales}`, 50, 140);
    doc.text(`Pending: ${pendingSales}`, 130, 140);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 160);
    doc.moveDown(2);

    // Add sales table header
    let yPosition = 200;
    doc.text('Sale ID', 50, yPosition);
    doc.text('Customer', 100, yPosition);
    doc.text('Product', 180, yPosition);
    doc.text('Date', 260, yPosition);
    doc.text('Amount', 340, yPosition);
    doc.text('Status', 400, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(450, yPosition).stroke();
    yPosition += 10;

    // Add sales data
    result.rows.forEach((sale) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(sale.sale_id, 50, yPosition);
      doc.text(sale.customer_name?.substring(0, 12) || sale.customerId.toString(), 100, yPosition);
      doc.text(sale.product_name?.substring(0, 12) || sale.productId.toString(), 180, yPosition);
      doc.text(new Date(sale.date).toLocaleDateString(), 260, yPosition);
      doc.text(`$${sale.amount.toFixed(2)}`, 340, yPosition);
      doc.text(mapSalesStatusFromEnum(sale.status), 400, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating sales PDF:', error);
    res.status(500).json({ error: 'Failed to generate sales PDF report' });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  downloadSalesPDF,
};