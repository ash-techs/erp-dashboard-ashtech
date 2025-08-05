const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const { mapQuoteStatusToEnum, mapQuoteStatusFromEnum } = require('../enumMapper');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all quotes
exports.getAllQuotes = async (req, res) => {
  try {
    const quotesResult = await pool.query(`
      SELECT q.*, c.name as customerName
      FROM quotes q
      LEFT JOIN customers c ON q."customerId" = c.id
      ORDER BY q."createdAt" DESC
    `);
    const itemsResult = await pool.query('SELECT * FROM quote_items WHERE "quoteId" = ANY($1)', [quotesResult.rows.map(q => q.id)]);

    const transformedQuotes = quotesResult.rows.map((quote) => ({
      id: quote.id,
      number: quote.number,
      client: quote.customerName || quote.customerId.toString(),
      date: quote.date.toISOString().split('T')[0],
      expireDate: quote.expireDate.toISOString().split('T')[0],
      year: quote.year,
      currency: quote.currency,
      status: mapQuoteStatusFromEnum(quote.status),
      paid: quote.paid,
      note: quote.note || '',
      tax: quote.tax || 0,
      createdBy: quote.createdBy,
      items: itemsResult.rows
        .filter(item => item.quoteId === quote.id)
        .map(item => ({
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
        })),
    }));

    res.json(transformedQuotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
};

// GET single quote
exports.getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const quoteResult = await pool.query(
      'SELECT q.*, c.name as customerName FROM quotes q LEFT JOIN customers c ON q."customerId" = c.id WHERE q.id = $1',
      [id]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const itemsResult = await pool.query('SELECT * FROM quote_items WHERE "quoteId" = $1', [id]);
    const quote = quoteResult.rows[0];

    const transformedQuote = {
      id: quote.id,
      number: quote.number,
      client: quote.customerName || quote.customerId.toString(),
      date: quote.date.toISOString().split('T')[0],
      expireDate: quote.expireDate.toISOString().split('T')[0],
      year: quote.year,
      currency: quote.currency,
      status: mapQuoteStatusFromEnum(quote.status),
      paid: quote.paid,
      note: quote.note || '',
      tax: quote.tax || 0,
      createdBy: quote.createdBy,
      items: itemsResult.rows.map(item => ({
        item: item.item,
        description: item.description || '',
        quantity: item.quantity,
        price: item.price,
      })),
    };

    res.json(transformedQuote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
};

// CREATE new quote
exports.createQuote = async (req, res) => {
  try {
    const {
      number,
      customerId, // Changed from client to match schema
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
      companyId
    } = req.body;

    if (!number || !customerId || !date || !expireDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await pool.query('SELECT * FROM quotes WHERE number = $1', [number]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Quote number already exists' });
    }

    const clientTx = await pool.query('BEGIN');
    try {
      const quoteResult = await pool.query(
        `INSERT INTO quotes (
          id, number, "customerId", "companyId", date, "expireDate", year, currency, status, 
          paid, note, tax, "createdBy", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [
          crypto.randomUUID(),
          number,
          parseInt(customerId),
          companyId || null,
          new Date(date),
          new Date(expireDate),
          year,
          currency || 'PKR',
          mapQuoteStatusToEnum(status) || 'DRAFT',
          parseFloat(paid) || 0,
          note || null,
          parseFloat(tax) || 0,
          createdBy || 'Admin',
          new Date(),
          new Date()
        ]
      );

      const quoteId = quoteResult.rows[0].id;
      for (const item of items) {
        await pool.query(
          'INSERT INTO quote_items (id, "quoteId", item, description, quantity, price) VALUES ($1, $2, $3, $4, $5, $6)',
          [crypto.randomUUID(), quoteId, item.item, item.description || '', parseFloat(item.quantity), parseFloat(item.price)]
        );
      }

      await pool.query('COMMIT');

      const itemsResult = await pool.query('SELECT * FROM quote_items WHERE "quoteId" = $1', [quoteId]);
      const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);

      const transformedQuote = {
        id: quoteResult.rows[0].id,
        number: quoteResult.rows[0].number,
        client: customerResult.rows[0]?.name || customerId.toString(),
        date: quoteResult.rows[0].date.toISOString().split('T')[0],
        expireDate: quoteResult.rows[0].expireDate.toISOString().split('T')[0],
        year: quoteResult.rows[0].year,
        currency: quoteResult.rows[0].currency,
        status: mapQuoteStatusFromEnum(quoteResult.rows[0].status),
        paid: quoteResult.rows[0].paid,
        note: quoteResult.rows[0].note || '',
        tax: quoteResult.rows[0].tax || 0,
        createdBy: quoteResult.rows[0].createdBy,
        items: itemsResult.rows.map(item => ({
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
        })),
      };

      res.status(201).json(transformedQuote);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
};

// UPDATE quote
exports.updateQuote = async (req, res) => {
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
      companyId
    } = req.body;

    const existingQuote = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
    if (existingQuote.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (number !== existingQuote.rows[0].number) {
      const conflict = await pool.query('SELECT * FROM quotes WHERE number = $1', [number]);
      if (conflict.rows.length > 0) {
        return res.status(400).json({ error: 'Quote number already exists' });
      }
    }

    const clientTx = await pool.query('BEGIN');
    try {
      const quoteResult = await pool.query(
        `UPDATE quotes SET 
          number = $1, "customerId" = $2, "companyId" = $3, date = $4, "expireDate" = $5, year = $6, 
          currency = $7, status = $8, paid = $9, note = $10, tax = $11, "createdBy" = $12, "updatedAt" = $13
        WHERE id = $14 RETURNING *`,
        [
          number,
          parseInt(customerId),
          companyId || null,
          new Date(date),
          new Date(expireDate),
          year,
          currency || 'PKR',
          mapQuoteStatusToEnum(status),
          parseFloat(paid) || 0,
          note || null,
          parseFloat(tax) || 0,
          createdBy || 'Admin',
          new Date(),
          id
        ]
      );

      await pool.query('DELETE FROM quote_items WHERE "quoteId" = $1', [id]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO quote_items (id, item, description, quantity, price,"quoteId") VALUES ($1, $2, $3, $4, $5, $6)',
          [crypto.randomUUID(), item.item, item.description || '', parseFloat(item.quantity), parseFloat(item.price),id]
        );
      }

      await pool.query('COMMIT');

      const itemsResult = await pool.query('SELECT * FROM quote_items WHERE "quoteId" = $1', [id]);
      const customerResult = await pool.query('SELECT name FROM customers WHERE id = $1', [parseInt(customerId)]);

      const transformedQuote = {
        id: quoteResult.rows[0].id,
        number: quoteResult.rows[0].number,
        client: customerResult.rows[0]?.name || customerId.toString(),
        date: quoteResult.rows[0].date.toISOString().split('T')[0],
        expireDate: quoteResult.rows[0].expireDate.toISOString().split('T')[0],
        year: quoteResult.rows[0].year,
        currency: quoteResult.rows[0].currency,
        status: mapQuoteStatusFromEnum(quoteResult.rows[0].status),
        paid: quoteResult.rows[0].paid,
        note: quoteResult.rows[0].note || '',
        tax: quoteResult.rows[0].tax || 0,
        createdBy: quoteResult.rows[0].createdBy,
        items: itemsResult.rows.map(item => ({
          item: item.item,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
        })),
      };

      res.json(transformedQuote);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
};

// DELETE quote
exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
    if (quote.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    await pool.query('BEGIN');
    await pool.query('DELETE FROM quote_items WHERE "quoteId" = $1', [id]);
    await pool.query('DELETE FROM quotes WHERE id = $1', [id]);
    await pool.query('COMMIT');

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
};

// Download quotes PDF report
exports.downloadQuotesPDF = async (req, res) => {
  try {
    const quotesResult = await pool.query(`
      SELECT q.*, c.name as customerName,
             (SELECT SUM(quantity * price) FROM quote_items qi WHERE qi."quoteId" = q.id) as totalAmount
      FROM quotes q
      LEFT JOIN customers c ON q."customerId" = c.id
      ORDER BY q."createdAt" DESC
    `);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="quotes-report.pdf"');
    
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Quotes Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalQuotes = quotesResult.rows.length;
    const totalValue = quotesResult.rows.reduce((sum, quote) => sum + (quote.totalAmount || 0), 0);
    const acceptedQuotes = quotesResult.rows.filter(q => q.status === 'ACCEPTED').length;
    const pendingQuotes = quotesResult.rows.filter(q => q.status === 'PENDING').length;
    const declinedQuotes = quotesResult.rows.filter(q => q.status === 'DECLINED').length;
    
    doc.fontSize(12);
    doc.text(`Total Quotes: ${totalQuotes}`, 50, 100);
    doc.text(`Total Value: $${totalValue.toFixed(2)}`, 50, 120);
    doc.text(`Accepted: ${acceptedQuotes}`, 50, 140);
    doc.text(`Pending: ${pendingQuotes}`, 150, 140);
    doc.text(`Declined: ${declinedQuotes}`, 230, 140);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 160);
    doc.moveDown(2);

    // Add quotes table header
    let yPosition = 200;
    doc.text('Quote ID', 50, yPosition);
    doc.text('Customer', 110, yPosition);
    doc.text('Status', 190, yPosition);
    doc.text('Valid Until', 240, yPosition);
    doc.text('Items', 310, yPosition);
    doc.text('Total', 360, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(450, yPosition).stroke();
    yPosition += 10;

    // Add quotes data
    const itemsCountResult = await pool.query(`
      SELECT "quoteId", COUNT(*) as itemCount
      FROM quote_items
      WHERE "quoteId" = ANY($1)
      GROUP BY "quoteId"
    `, [quotesResult.rows.map(q => q.id)]);

    quotesResult.rows.forEach((quote) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }
      
      const itemCount = itemsCountResult.rows.find(ic => ic.quoteId === quote.id)?.itemCount || 0;
      doc.text(quote.id.toString(), 50, yPosition);
      doc.text(quote.customerName?.substring(0, 12) || quote.customerId.toString(), 110, yPosition);
      doc.text(quote.status, 190, yPosition);
      doc.text(new Date(quote.expireDate).toLocaleDateString(), 240, yPosition);
      doc.text(itemCount.toString(), 310, yPosition);
      doc.text(`$${(quote.totalAmount || 0).toFixed(2)}`, 360, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating quotes PDF:', error);
    res.status(500).json({ error: 'Failed to generate quotes PDF report' });
  }
};