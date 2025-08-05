const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const {
  mapTypeToEnum,
  mapTypeFromEnum,
  mapTransactionStatusToEnum,
  mapTransactionStatusFromEnum,
  mapCategoryToEnum,
  mapCategoryFromEnum,
} = require('../enumMapper');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all transactions
const getAllTransactions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY "createdAt" DESC');

    const transformedTransactions = result.rows.map((transaction) => ({
      id: transaction.id,
      type: mapTypeFromEnum(transaction.type),
      amount: transaction.amount,
      bank: transaction.bank,
      checkNumber: transaction.checkNumber || '',
      companyId: transaction.companyId || null,
      status: mapTransactionStatusFromEnum(transaction.status),
      category: mapCategoryFromEnum(transaction.category),
      date: transaction.date.toISOString().split('T')[0],
      receivedPayment: transaction.receivedPayment,
      description: transaction.description || '',
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    }));

    res.json(transformedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// GET single transaction
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];
    res.json({
      id: transaction.id,
      type: mapTypeFromEnum(transaction.type),
      amount: transaction.amount,
      bank: transaction.bank,
      checkNumber: transaction.checkNumber || '',
      companyId: transaction.companyId || null,
      status: mapTransactionStatusFromEnum(transaction.status),
      category: mapCategoryFromEnum(transaction.category),
      date: transaction.date.toISOString().split('T')[0],
      receivedPayment: transaction.receivedPayment,
      description: transaction.description || '',
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

// CREATE new transaction
const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      bank,
      checkNumber,
      status,
      category,
      date,
      receivedPayment,
      description,
      createdBy,
      companyId,
    } = req.body;

    if (!type || !amount || !bank || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO transactions (id,type, amount, bank, "checkNumber", status, category, date, "receivedPayment", description, "createdBy", "companyId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,$14) RETURNING *',
      [
        crypto.randomUUID(),
        mapTypeToEnum(type),
        parseFloat(amount),
        bank,
        checkNumber || null,
        mapTransactionStatusToEnum(status) || 'PENDING',
        mapCategoryToEnum(category),
        new Date(date),
        parseFloat(receivedPayment) || 0,
        description || null,
        createdBy || 'Admin',
        companyId,
        new Date(),
        new Date(),
      ]
    );

    const transaction = result.rows[0];
    res.status(201).json({
      id: transaction.id,
      type: mapTypeFromEnum(transaction.type),
      amount: transaction.amount,
      bank: transaction.bank,
      checkNumber: transaction.checkNumber || '',
      status: mapTransactionStatusFromEnum(transaction.status),
      category: mapCategoryFromEnum(transaction.category),
      date: transaction.date.toISOString().split('T')[0],
      receivedPayment: transaction.receivedPayment,
      description: transaction.description || '',
      createdBy: transaction.createdBy,
      companyId: transaction.companyId || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

// UPDATE transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      bank,
      checkNumber,
      status,
      category,
      date,
      receivedPayment,
      description,
      createdBy,
      companyId,
    } = req.body;

    const existingTransaction = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await pool.query(
      'UPDATE transactions SET type = $1, amount = $2, bank = $3, "checkNumber" = $4, status = $5, category = $6, date = $7, "receivedPayment" = $8, description = $9, "createdBy" = $10, "companyId" = $11, "updatedAt" = $12 WHERE id = $13 RETURNING *',
      [
        mapTypeToEnum(type),
        parseFloat(amount),
        bank,
        checkNumber || null,
        mapTransactionStatusToEnum(status),
        mapCategoryToEnum(category),
        new Date(date),
        parseFloat(receivedPayment) || 0,
        description || null,
        createdBy || 'Admin',
        companyId || null,
        new Date(),
        id
      ]
    );

    const transaction = result.rows[0];
    res.json({
      id: transaction.id,
      type: mapTypeFromEnum(transaction.type),
      amount: transaction.amount,
      bank: transaction.bank,
      checkNumber: transaction.checkNumber || '',
      status: mapTransactionStatusFromEnum(transaction.status),
      category: mapCategoryFromEnum(transaction.category),
      date: transaction.date.toISOString().split('T')[0],
      receivedPayment: transaction.receivedPayment,
      description: transaction.description || '',
      createdBy: transaction.createdBy,
      companyId: transaction.companyId || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// DELETE transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTransaction = await pool.query('SELECT * FROM transactions WHERE id = $1', id);
    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', $id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// GET balance calculation
const getBalance = async (req, res) => {
  try {
    const result = await pool.query('SELECT type, amount FROM transactions WHERE status = $1', ['COMPLETED']);
    let balance = 0;
    result.rows.forEach((transaction) => {
      if (transaction.type === 'INCOME') {
        balance += transaction.amount;
      } else if (transaction.type === 'EXPENSE') {
        balance -= transaction.amount;
      }
    });

    res.json({ balance });
  } catch (error) {
    console.error('Error calculating balance:', error);
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
};

// GET transactions by status
const getTransactionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE status = $1 ORDER BY "createdAt" DESC', [mapTransactionStatusToEnum(status)]);

    const transformedTransactions = result.rows.map((transaction) => ({
      id: transaction.id,
      type: mapTypeFromEnum(transaction.type),
      amount: transaction.amount,
      bank: transaction.bank,
      checkNumber: transaction.checkNumber || '',
      status: mapTransactionStatusFromEnum(transaction.status),
      category: mapCategoryFromEnum(transaction.category),
      date: transaction.date.toISOString().split('T')[0],
      receivedPayment: transaction.receivedPayment,
      description: transaction.description || '',
      createdBy: transaction.createdBy,
      companyId: transaction.companyId || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    }));

    res.json(transformedTransactions);
  } catch (error) {
    console.error('Error fetching transactions by status:', error);
    res.status(500).json({ error: 'Failed to fetch transactions by status' });
  }
};

// Download finance PDF report
const downloadFinancePDF = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="finance-report.pdf"');
    
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Finance Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalIncome = result.rows.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + f.amount, 0);
    const totalExpenses = result.rows.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    
    doc.fontSize(12);
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 50, 100);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 50, 120);
    doc.text(`Net Profit: $${netProfit.toFixed(2)}`, 50, 140);
    doc.text(`Total Entries: ${result.rows.length}`, 50, 160);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 180);
    doc.moveDown(2);

    // Add finance table header
    let yPosition = 220;
    doc.text('ID', 50, yPosition);
    doc.text('Type', 80, yPosition);
    doc.text('Category', 130, yPosition);
    doc.text('Description', 200, yPosition);
    doc.text('Date', 300, yPosition);
    doc.text('Amount', 370, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(450, yPosition).stroke();
    yPosition += 10;

    // Add finance data
    result.rows.forEach((finance) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.text(finance.id.toString(), 50, yPosition);
      doc.text(finance.type, 80, yPosition);
      doc.text(finance.category?.substring(0, 12) || 'N/A', 130, yPosition);
      doc.text(finance.description?.substring(0, 20) || 'N/A', 200, yPosition);
      doc.text(new Date(finance.date).toLocaleDateString(), 300, yPosition);
      doc.text(`$${finance.amount.toFixed(2)}`, 370, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating finance PDF:', error);
    res.status(500).json({ error: 'Failed to generate finance PDF report' });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBalance,
  getTransactionsByStatus,
  downloadFinancePDF,
};