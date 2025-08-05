const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const { mapStatusToEnum, mapStatusFromEnum } = require('../enumMapper');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all invoices
const getAllInvoices = async (req, res) => {
  try {
    const invoicesResult = await pool.query(`
      SELECT i.*, c.name as customerName
      FROM invoices i
      LEFT JOIN customers c ON i."customerId" = c.id
      ORDER BY i."createdAt" DESC
    `);
    
    const invoiceIds = invoicesResult.rows.map(i => i.id);
    const itemsResult = await pool.query('SELECT * FROM invoice_items WHERE "invoiceId" = ANY($1)', [invoiceIds]);

    const transformedInvoices = invoicesResult.rows.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      customerId: invoice.customerId,
      customerName: invoice.customerName || invoice.customerId.toString(),
      date: invoice.date.toISOString().split('T')[0],
      expireDate: invoice.expireDate.toISOString().split('T')[0],
      year: invoice.year,
      currency: invoice.currency,
      status: mapStatusFromEnum(invoice.status),
      paid: invoice.paid,
      note: invoice.note || '',
      tax: invoice.tax || 0,
      createdBy: invoice.createdBy,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      items: itemsResult.rows
        .filter(item => item.invoiceId === invoice.id)
        .map(item => ({
          id: item.id,
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
        })),
    }));

    res.json(transformedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// GET single invoice
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceResult = await pool.query(
      'SELECT i.*, c.name as customerName FROM invoices i LEFT JOIN customers c ON i."customerId" = c.id WHERE i.id = $1',
      [parseInt(id)]
    );
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const itemsResult = await pool.query('SELECT * FROM invoice_items WHERE "invoiceId" = $1', [parseInt(id)]);
    const invoice = invoiceResult.rows[0];
    res.json({
      id: invoice.id,
      number: invoice.number,
      customerId: invoice.customerId,
      customerName: invoice.customerName || invoice.customerId.toString(),
      date: invoice.date.toISOString().split('T')[0],
      expireDate: invoice.expireDate.toISOString().split('T')[0],
      year: invoice.year,
      currency: invoice.currency,
      status: mapStatusFromEnum(invoice.status),
      paid: invoice.paid,
      note: invoice.note || '',
      tax: invoice.tax || 0,
      createdBy: invoice.createdBy,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      items: itemsResult.rows.map(item => ({
        id: item.id,
        item: item.item,
        description: item.description || '',
        quantity: item.quantity,
        price: item.price,
      })),
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// CREATE new invoice
const createInvoice = async (req, res) => {
  try {
    const {
      number,
      customerId,
      date,
      expireDate,
      year,
      currency,
      status,
      paid,
      note,
      tax,
      createdBy,
      items,
    } = req.body;

    if (!number || !customerId || !date || !expireDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingInvoice = await pool.query('SELECT * FROM invoices WHERE number = $1', [number]);
    if (existingInvoice.rows.length > 0) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    await pool.query('BEGIN');
    try {
      const invoiceResult = await pool.query(
        'INSERT INTO invoices (number, "customerId", date, "expireDate", year, currency, status, paid, note, tax, "createdBy", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
        [
          number,
          parseInt(customerId),
          new Date(date),
          new Date(expireDate),
          parseInt(year),
          currency || 'PKR',
          mapStatusToEnum(status) || 'DRAFT',
          parseFloat(paid) || 0,
          note || null,
          parseFloat(tax) || 0,
          createdBy || 'Admin',
          new Date(),
          new Date()
        ]
      );

      const invoiceId = invoiceResult.rows[0].id;
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items ("invoiceId", item, description, quantity, price) VALUES ($1, $2, $3, $4, $5)',
          [invoiceId, item.item, item.description || null, parseFloat(item.quantity), parseFloat(item.price)]
        );
      }

      await pool.query('COMMIT');

      const itemsResult = await pool.query('SELECT * FROM invoice_items WHERE "invoiceId" = $1', [invoiceId]);
      const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);
      const invoice = invoiceResult.rows[0];
      res.status(201).json({
        id: invoice.id,
        number: invoice.number,
        customerId: invoice.customerId,
        customerName: customerResult.rows[0]?.name || invoice.customerId.toString(),
        date: invoice.date.toISOString().split('T')[0],
        expireDate: invoice.expireDate.toISOString().split('T')[0],
        year: invoice.year,
        currency: invoice.currency,
        status: mapStatusFromEnum(invoice.status),
        paid: invoice.paid,
        note: invoice.note || '',
        tax: invoice.tax || 0,
        createdBy: invoice.createdBy,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        items: itemsResult.rows.map(item => ({
          id: item.id,
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
        })),
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// UPDATE invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      number,
      customerId,
      date,
      expireDate,
      year,
      currency,
      status,
      paid,
      note,
      tax,
      createdBy,
      items,
    } = req.body;

    const existingInvoice = await pool.query('SELECT * FROM invoices WHERE id = $1', [parseInt(id)]);
    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (number !== existingInvoice.rows[0].number) {
      const conflictingInvoice = await pool.query('SELECT * FROM invoices WHERE number = $1', [number]);
      if (conflictingInvoice.rows.length > 0) {
        return res.status(400).json({ error: 'Invoice number already exists' });
      }
    }

    await pool.query('BEGIN');
    try {
      const invoiceResult = await pool.query(
        'UPDATE invoices SET number = $1, "customerId" = $2, date = $3, "expireDate" = $4, year = $5, currency = $6, status = $7, paid = $8, note = $9, tax = $10, "createdBy" = $11, "updatedAt" = $12 WHERE id = $13 RETURNING *',
        [
          number,
          parseInt(customerId),
          new Date(date),
          new Date(expireDate),
          parseInt(year),
          currency || 'PKR',
          mapStatusToEnum(status),
          parseFloat(paid) || 0,
          note || null,
          parseFloat(tax) || 0,
          createdBy || 'Admin',
          new Date(),
          parseInt(id),
        ]
      );

      await pool.query('DELETE FROM invoice_items WHERE "invoiceId" = $1', [parseInt(id)]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items ("invoiceId", item, description, quantity, price) VALUES ($1, $2, $3, $4, $5)',
          [parseInt(id), item.item, item.description || null, parseFloat(item.quantity), parseFloat(item.price)]
        );
      }

      await pool.query('COMMIT');

      const itemsResult = await pool.query('SELECT * FROM invoice_items WHERE "invoiceId" = $1', [parseInt(id)]);
      const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);
      const invoice = invoiceResult.rows[0];
      res.json({
        id: invoice.id,
        number: invoice.number,
        customerId: invoice.customerId,
        customerName: customerResult.rows[0]?.name || invoice.customerId.toString(),
        date: invoice.date.toISOString().split('T')[0],
        expireDate: invoice.expireDate.toISOString().split('T')[0],
        year: invoice.year,
        currency: invoice.currency,
        status: mapStatusFromEnum(invoice.status),
        paid: invoice.paid,
        note: invoice.note || '',
        tax: invoice.tax || 0,
        createdBy: invoice.createdBy,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        items: itemsResult.rows.map(item => ({
          id: item.id,
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
        })),
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// DELETE invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const existingInvoice = await pool.query('SELECT * FROM invoices WHERE id = $1', [parseInt(id)]);
    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await pool.query('BEGIN');
    await pool.query('DELETE FROM invoice_items WHERE "invoiceId" = $1', [parseInt(id)]);
    await pool.query('DELETE FROM invoices WHERE id = $1', [parseInt(id)]);
    await pool.query('COMMIT');

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Download invoice PDF report - FIXED STATUS MAPPING
const downloadInvoicesPDF = async (req, res) => {
  try {
    const invoicesResult = await pool.query(`
      SELECT i.*, c.name as customerName,
             (SELECT COALESCE(SUM(quantity * price), 0) FROM invoice_items ii WHERE ii."invoiceId" = i.id) as "totalAmount"
      FROM invoices i
      LEFT JOIN customers c ON i."customerId" = c.id
      ORDER BY i."createdAt" DESC
    `);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-report.pdf"');

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Invoices Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalInvoices = invoicesResult.rows.length;
    const totalAmount = invoicesResult.rows.reduce((sum, invoice) => sum + (parseFloat(invoice.totalAmount) || 0), 0);

    // Count statuses using the database enum values directly
    const paidInvoices = invoicesResult.rows.filter(i => i.status === 'PAID').length;
    const unpaidInvoices = invoicesResult.rows.filter(i => i.status === 'UNPAID').length;
    const overdueInvoices = invoicesResult.rows.filter(i => i.status === 'OVERDUE').length;
    const partiallyPaidInvoices = invoicesResult.rows.filter(i => i.status === 'PARTIALLY_PAID').length;
    const draftInvoices = invoicesResult.rows.filter(i => i.status === 'DRAFT').length;
    const pendingInvoices = invoicesResult.rows.filter(i => i.status === 'PENDING').length;

    doc.fontSize(12);
    doc.text(`Total Invoices: ${totalInvoices}`, 50, 100);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 50, 120);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 140);
    doc.moveDown();

    // Status breakdown
    doc.text('Status Breakdown:', 50, 170);
    doc.text(`Paid Invoices: ${paidInvoices}`, 60, 190);
    doc.text(`Unpaid Invoices: ${unpaidInvoices}`, 200, 190);
    doc.text(`Overdue Invoices: ${overdueInvoices}`, 340, 190);
    doc.text(`Partially Paid Invoices: ${partiallyPaidInvoices}`, 60, 210);
    doc.text(`Draft Invoices: ${draftInvoices}`, 200, 210);
    doc.text(`Pending Invoices: ${pendingInvoices}`, 340, 210);

    // Add invoices table header
    let yPosition = 250;
    doc.fontSize(10);
    doc.text('ID', 50, yPosition);
    doc.text('Number', 80, yPosition);
    doc.text('Customer', 140, yPosition);
    doc.text('Status', 220, yPosition);
    doc.text('Due Date', 280, yPosition);
    doc.text('Amount', 360, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(420, yPosition).stroke();
    yPosition += 10;

    // Add invoices data
    invoicesResult.rows.forEach((invoice) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
        
        // Repeat header on new page
        doc.fontSize(10);
        doc.text('ID', 50, yPosition);
        doc.text('Number', 80, yPosition);
        doc.text('Customer', 140, yPosition);
        doc.text('Status', 220, yPosition);
        doc.text('Due Date', 280, yPosition);
        doc.text('Amount', 360, yPosition);
        yPosition += 15;
        doc.moveTo(50, yPosition).lineTo(420, yPosition).stroke();
        yPosition += 10;
      }

      doc.text(invoice.id.toString(), 50, yPosition);
      doc.text((invoice.number || '').substring(0, 10), 80, yPosition);
      doc.text((invoice.customerName || invoice.customerId.toString()).substring(0, 15), 140, yPosition);
      // Use the mapped status for display
      doc.text(mapStatusFromEnum(invoice.status), 220, yPosition);
      doc.text(new Date(invoice.expireDate).toLocaleDateString(), 280, yPosition);
      doc.text(`$${(parseFloat(invoice.totalAmount) || 0).toFixed(2)}`, 360, yPosition);
      yPosition += 18;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating invoices PDF:', error);
    res.status(500).json({ error: 'Failed to generate invoices PDF report' });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicesPDF,
};