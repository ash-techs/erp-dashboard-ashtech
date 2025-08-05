const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const {
  mapOrderStatusFromEnum,
  mapOrderStatusToEnum,
} = require('../enumMapper');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all orders
async function getAllOrders(req, res) {
  try {
    const result = await pool.query(`
      SELECT o.*, c.name as customerName, p.name as productName
      FROM orders o
      LEFT JOIN customers c ON o."customerId" = c.id
      LEFT JOIN products p ON o."productId" = p.id
      ORDER BY o."createdAt" DESC
    `);
    res.json(result.rows.map((order) => ({
      id: order.id,
      number: order.number,
      price: order.price,
      discount: order.discount,
      total: order.total,
      status: mapOrderStatusFromEnum(order.status),
      phone: order.phone,
      state: order.state,
      city: order.city,
      note: order.note,
      companyId: order.companyId || null,
      productId: order.productId || null,
      customerId: order.customerId || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    })));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

// GET single order
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*, c.name as customerName, p.name as productName
      FROM orders o
      LEFT JOIN customers c ON o."customerId" = c.id
      LEFT JOIN products p ON o."productId" = p.id
      WHERE o.id = $1
    `, [parseInt(id)]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = result.rows[0];
    res.json({
      id: order.id,
      number: order.number,
      price: order.price,
      discount: order.discount,
      total: order.total,
      status: mapOrderStatusFromEnum(order.status),
      phone: order.phone,
      state: order.state,
      city: order.city,
      note: order.note,
      companyId: order.companyId || null,
      productId: order.productId || null,
      customerId: order.customerId || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

// CREATE order
async function createOrder(req, res) {
  try {
    const { number, customerId, productId, quantity, price, discount, status, phone, state, city, note, companyId } = req.body;
    if (!number || !customerId || !productId || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const exists = await pool.query('SELECT * FROM orders WHERE number = $1', [number]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Order number already exists' });

    const total = quantity * price * (1 - (discount || 0) / 100);
    const result = await pool.query(
      `INSERT INTO orders (
        number,quantity, price, discount, total, status, 
        phone, state, city, note, createdAt, updatedAt, "customerId", "productId", companyId
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        number,
        parseInt(quantity),
        parseFloat(price),
        parseFloat(discount) || 0,
        total,
        mapOrderStatusToEnum(status) || 'PENDING',
        phone || '',
        state || '',
        city || '',
        note || '',
        new Date(),
        new Date(),
        parseInt(customerId),
        parseInt(productId),
        companyId || null
      ]
    );

    const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);
    const productResult = await pool.query('SELECT name FROM products WHERE id = $1', [parseInt(productId)]);
    const order = result.rows[0];
    res.status(201).json({
      id: order.id,
      number: order.number,
      price: order.price,
      discount: order.discount,
      total: order.total,
      status: mapOrderStatusFromEnum(order.status),
      phone: order.phone,
      state: order.state,
      city: order.city,
      note: order.note,
      companyId: order.companyId || null,
      productId: order.productId || null,
      customerId: order.customerId || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

// UPDATE order
async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const { number, customerId, productId, quantity, price, discount, status, phone, state, city, note, companyId } = req.body;

    const existing = await pool.query('SELECT * FROM orders WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    if (number !== existing.rows[0].number) {
      const conflict = await pool.query('SELECT * FROM orders WHERE number = $1', [number]);
      if (conflict.rows.length > 0) return res.status(400).json({ error: 'Order number already exists' });
    }

    const total = quantity * price * (1 - (discount || 0) / 100);
    const result = await pool.query(
      `UPDATE orders SET 
        number = $1, quantity = $2, price = $3, 
        discount = $4, total = $5, status = $6, phone = $7, state = $8, city = $9, note = $10, updatedAt = $11, "customerId" = $12, "productId" = $13, companyId = $14
      WHERE id = $15 RETURNING *`,
      [
        number,
        parseInt(quantity),
        parseFloat(price),
        parseFloat(discount) || 0,
        total,
        mapOrderStatusToEnum(status),
        phone || '',
        state || '',
        city || '',
        note || '',
        new Date(),
        parseInt(id),
        parseInt(customerId),
        parseInt(productId),
        companyId || null
      ]
    );

    const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);
    const productResult = await pool.query('SELECT name FROM products WHERE id = $1', [parseInt(productId)]);
    const order = result.rows[0];
    res.json({
      id: order.id,
      number: order.number,
      price: order.price,
      discount: order.discount,
      total: order.total,
      status: mapOrderStatusFromEnum(order.status),
      phone: order.phone,
      state: order.state,
      city: order.city,
      note: order.note,
      companyId: order.companyId || null,
      productId: order.productId || null,
      customerId: order.customerId || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      
      companyId: order.companyId || null,
      productId: order.productId || null,
      customerId: order.customerId || null,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
}

// DELETE order
async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [parseInt(id)]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
}

// Download orders PDF report
async function downloadOrdersPDF(req, res) {
  try {
    const result = await pool.query(`
      SELECT o.*, c.name as customerName, p.name as productName
      FROM orders o
      LEFT JOIN customers c ON o."customerId" = c.id
      LEFT JOIN products p ON o."productId" = p.id
      ORDER BY o."createdAt" DESC
    `);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-report.pdf"');
    
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Orders Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalOrders = result.rows.length;
    const totalValue = result.rows.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingOrders = result.rows.filter(o => o.status === 'PENDING').length;
    const completedOrders = result.rows.filter(o => o.status === 'COMPLETED').length;
    const cancelledOrders = result.rows.filter(o => o.status === 'CANCELLED').length;
    
    doc.fontSize(12);
    doc.text(`Total Orders: ${totalOrders}`, 50, 100);
    doc.text(`Total Value: $${totalValue.toFixed(2)}`, 50, 120);
    doc.text(`Pending: ${pendingOrders}`, 50, 140);
    doc.text(`Completed: ${completedOrders}`, 200, 140);
    doc.text(`Cancelled: ${cancelledOrders}`, 300, 140);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 160);
    doc.moveDown(2);

    // Add orders table header
    let yPosition = 200;
    doc.text('ID', 50, yPosition);
    doc.text('Customer', 80, yPosition);
    doc.text('Product', 160, yPosition);
    doc.text('Status', 240, yPosition);
    doc.text('Quantity', 300, yPosition);
    doc.text('Total', 360, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;

    // Add orders data
    result.rows.forEach((order) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.text(order.id.toString(), 50, yPosition);
      doc.text(order.customerName?.substring(0, 12) || order.customerId.toString(), 80, yPosition);
      doc.text(order.productName?.substring(0, 12) || order.productId.toString(), 160, yPosition);
      doc.text(order.status, 240, yPosition);
      doc.text(order.quantity.toString(), 300, yPosition);
      doc.text(`$${order.total.toFixed(2)}`, 360, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating orders PDF:', error);
    res.status(500).json({ error: 'Failed to generate orders PDF report' });
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  downloadOrdersPDF
};