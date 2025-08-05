const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const {
  mapClientToEnum,
  mapClientFromEnum,
  mapPaymentModeToEnum,
  mapPaymentModeFromEnum,
  mapPaymentStatusToEnum,
  mapPaymentStatusFromEnum
} = require("../enumMapper");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/payments - Get all payments
const getAllPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as customerName
      FROM payments p
      LEFT JOIN customers c ON p."customerId" = c.id
      ORDER BY p."createdAt" DESC
    `);
    const transformedPayments = result.rows.map((payment) => ({
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      client: mapClientFromEnum(payment.customerId.toString()), 
      amount: payment.amount,
      date: payment.date.toISOString().split("T")[0],
      number: payment.number,
      transactionDate: payment.transactionDate.toISOString().split("T")[0],
      paymentMode: mapPaymentModeFromEnum(payment.paymentMode),
      paymentTransaction: payment.paymentTransaction || "",
      status: mapPaymentStatusFromEnum(payment.status),
      companyId: payment.companyId || null,
      notes: payment.notes || "",
      createdBy: payment.createdBy,
    }));

    res.json(transformedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// GET /api/payments/:id - Get single payment
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, c.name as customerName
      FROM payments p
      LEFT JOIN customers c ON p."customerId" = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = result.rows[0];
    const transformedPayment = {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      client: mapClientFromEnum(payment.customerId.toString()), 
      amount: payment.amount,
      date: payment.date.toISOString().split("T")[0],
      number: payment.number,
      transactionDate: payment.transactionDate.toISOString().split("T")[0],
      paymentMode: mapPaymentModeFromEnum(payment.paymentMode),
      paymentTransaction: payment.paymentTransaction || "",
      status: mapPaymentStatusFromEnum(payment.status),
      companyId: payment.companyId || null,
      notes: payment.notes || "",
      createdBy: payment.createdBy,
    };

    res.json(transformedPayment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};

// POST /api/payments - Create new payment
const createPayment = async (req, res) => {
  try {
     const { client,receiptNumber,customerId, amount, paymentMode, status,notes,date,number, transactionDate,paymentTransaction,companyId,createdBy} = req.body;
  if (!customerId || !amount || !paymentMode || !status) {
    return res.status(400).json({ error: 'All payment fields are required.' });
  }

    // Check if receipt number already exists
    const existingPayment = await pool.query('SELECT * FROM payments WHERE "receiptNumber" = $1', [receiptNumber]);
    if (existingPayment.rows.length > 0) {
      return res.status(400).json({ error: "Receipt number already exists" });
    }

    // Create payment
    const result = await pool.query(
      `INSERT INTO payments (
"receiptNumber", "customerId", amount, date, number, 
        "transactionDate", "paymentMode", "paymentTransaction", status, "companyId", notes, "createdBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        receiptNumber,
        parseInt(mapClientToEnum(client)),
        parseFloat(amount),
        new Date(date),
        number,
        new Date(transactionDate),
        mapPaymentModeToEnum(paymentMode),
        paymentTransaction || null,
        'RECEIVED',
        notes || null,
        companyId || null,
        createdBy || 'Admin'
      ]
    );

    const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(mapClientToEnum(client))]);
    const payment = result.rows[0];
    const transformedPayment = {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      client: mapClientFromEnum(payment.customerId.toString()), 
      amount: payment.amount,
      date: payment.date.toISOString().split("T")[0],
      number: payment.number,
      transactionDate: payment.transactionDate.toISOString().split("T")[0],
      paymentMode: mapPaymentModeFromEnum(payment.paymentMode),
      paymentTransaction: payment.paymentTransaction || "",
      status: mapPaymentStatusFromEnum(payment.status),
      companyId: payment.companyId || null,
      notes: payment.notes || "",
      createdBy: payment.createdBy,
    };

    res.status(201).json(transformedPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
};

// PUT /api/payments/:id - Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      receiptNumber,
      client,
      amount,
      date,
      number,
      transactionDate,
      paymentMode,
      paymentTransaction,
      status,
      notes,
      createdBy,
      companyId
    } = req.body;

    // Check if payment exists
    const existingPayment = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (existingPayment.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Check if new receipt number conflicts with another payment
    if (receiptNumber !== existingPayment.rows[0].receiptNumber) {
      const conflictingPayment = await pool.query('SELECT * FROM payments WHERE "receiptNumber" = $1 AND id != $2', [receiptNumber, id]);
      if (conflictingPayment.rows.length > 0) {
        return res.status(400).json({ error: "Receipt number already exists" });
      }
    }

    // Update payment
    const result = await pool.query(
      `UPDATE payments SET 
        "receiptNumber" = $1, "customerId" = $2, amount = $3, date = $4, number = $5, 
        "transactionDate" = $6, "paymentMode" = $7, "paymentTransaction" = $8, status = $9,  "companyId" = $10,notes = $11, 
        "createdBy" = $12, "updatedAt" = $13
      WHERE id = $14 RETURNING *`,
      [
        receiptNumber,
        parseInt(mapClientToEnum(client)),
        parseFloat(amount),
        new Date(date),
        number,
        new Date(transactionDate),
        mapPaymentModeToEnum(paymentMode),
        paymentTransaction || null,
        mapPaymentStatusToEnum(status),
        companyId || null,
        notes || null,
        createdBy || 'Admin',
        new Date(),
        id
      ]
    );

    const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(mapClientToEnum(client))]);
    const payment = result.rows[0];
    const transformedPayment = {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      client: mapClientFromEnum(payment.customerId.toString()),
      amount: payment.amount,
      date: payment.date.toISOString().split("T")[0],
      number: payment.number,
      transactionDate: payment.transactionDate.toISOString().split("T")[0],
      paymentMode: mapPaymentModeFromEnum(payment.paymentMode),
      paymentTransaction: payment.paymentTransaction || "",
      status: mapPaymentStatusFromEnum(payment.status),
      companyId: payment.companyId || null,
      notes: payment.notes || "",
      createdBy: payment.createdBy,
    };

    res.json(transformedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
};

// DELETE /api/payments/:id - Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const existingPayment = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (existingPayment.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
};

// GET /api/payments/total-received - Get total payments received
const getTotalReceived = async (req, res) => {
  try {
    const result = await pool.query('SELECT amount FROM payments WHERE status = $1', ['RECEIVED']);
    const totalReceived = result.rows.reduce((sum, payment) => sum + payment.amount, 0);
    res.json({ totalReceived });
  } catch (error) {
    console.error("Error calculating total payments received:", error);
    res.status(500).json({ error: "Failed to calculate total payments received" });
  }
};

// GET /api/payments/client/:client - Get payments by client
const getPaymentsByClient = async (req, res) => {
  try {
    const { client } = req.params;
    const result = await pool.query(`
      SELECT p.*, c.name as customerName
      FROM payments p
      LEFT JOIN customers c ON p."customerId" = c.id
      WHERE p."customerId" = $1
      ORDER BY p."createdAt" DESC
    `, [parseInt(mapClientToEnum(client))]);
    const transformedPayments = result.rows.map((payment) => ({
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      client: mapClientFromEnum(payment.customerId.toString()), 
      amount: payment.amount,
      date: payment.date.toISOString().split("T")[0],
      number: payment.number,
      transactionDate: payment.transactionDate.toISOString().split("T")[0],
      paymentMode: mapPaymentModeFromEnum(payment.paymentMode),
      paymentTransaction: payment.paymentTransaction || "",
      status: mapPaymentStatusFromEnum(payment.status),
      companyId: payment.companyId || null,
      notes: payment.notes || "",
      createdBy: payment.createdBy,
    }));

    res.json(transformedPayments);
  } catch (error) {
    console.error("Error fetching payments by client:", error);
    res.status(500).json({ error: "Failed to fetch payments by client" });
  }
};

// Download payments PDF report
const downloadPaymentsPDF = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as customerName
      FROM payments p
      LEFT JOIN customers c ON p."customerId" = c.id
      ORDER BY p."createdAt" DESC
    `);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="payments-report.pdf"');

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Payments Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalPayments = result.rows.reduce((sum, payment) => sum + payment.amount, 0);
    const successfulPayments = result.rows.filter(p => p.status === 'COMPLETED').length;
    const pendingPayments = result.rows.filter(p => p.status === 'PENDING').length;
    const failedPayments = result.rows.filter(p => p.status === 'FAILED').length;

    doc.fontSize(12);
    doc.text(`Total Payments: ${result.rows.length}`, 50, 100);
    doc.text(`Total Amount: $${totalPayments.toFixed(2)}`, 50, 120);
    doc.text(`Successful: ${successfulPayments}`, 50, 140);
    doc.text(`Pending: ${pendingPayments}`, 200, 140);
    doc.text(`Failed: ${failedPayments}`, 300, 140);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 160);
    doc.moveDown(2);

    // Add payments table header
    let yPosition = 200;
    doc.text('ID', 50, yPosition);
    doc.text('Customer', 80, yPosition);
    doc.text('Method', 160, yPosition);
    doc.text('Status', 220, yPosition);
    doc.text('Date', 270, yPosition);
    doc.text('Amount', 350, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;

    // Add payments data
    result.rows.forEach((payment) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(payment.id.toString(), 50, yPosition);
      doc.text(payment.customerName?.substring(0, 12) || 'N/A', 80, yPosition);
      doc.text(payment.paymentMode?.substring(0, 8) || 'N/A', 160, yPosition);
      doc.text(payment.status, 220, yPosition);
      doc.text(new Date(payment.createdAt).toLocaleDateString(), 270, yPosition);
      doc.text(`$${payment.amount.toFixed(2)}`, 350, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating payments PDF:', error);
    res.status(500).json({ error: 'Failed to generate payments PDF report' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getTotalReceived,
  getPaymentsByClient,
  downloadPaymentsPDF
};