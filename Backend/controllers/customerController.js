const { Pool } = require('pg');
const mapper = require('../enumMapper');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all customers
const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT c.*, co.name as company_name
      FROM customers c
      LEFT JOIN companies co ON c."companyId" = co.id
    `;
    const values = [];

    if (search) {
      query += ' WHERE c.name ILIKE $1 OR c.email ILIKE $1';
      values.push(`%${search}%`);
    }
    query += ' ORDER BY c.name ASC';

    const result = await pool.query(query, values);

    const transformedCustomers = result.rows.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      companyId: customer.companyId || null,
      companyName: customer.company_name || customer.companyId || '',
    }));

    res.json(transformedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};
const getCustomerById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const result = await pool.query(
      `SELECT c.*, co.name as company_name 
       FROM customers c 
       LEFT JOIN companies co ON c."companyId" = co.id 
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      companyId: customer.companyId || null,
      companyName: customer.company_name || customer.companyId || '',
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};


// CREATE new customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, companyId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    if (companyId) {
      const company = await pool.query('SELECT id FROM companies WHERE id = $1', [companyId]);
      if (company.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid companyId' });
      }
    }

    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, address, "companyId") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone || null, address || null, companyId || null]
    );

    const customer = result.rows[0];
    const companyResult = companyId ? await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]) : { rows: [] };
    
    res.status(201).json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      companyId: customer.companyId || null,
      companyName: companyResult.rows[0]?.name || customer.companyId || '',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// UPDATE customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, companyId } = req.body;

    const existing = await pool.query('SELECT * FROM customers WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (email && email !== existing.rows[0].email) {
      const conflict = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      if (conflict.rows.length > 0) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    if (companyId) {
      const company = await pool.query('SELECT id FROM companies WHERE id = $1', [companyId]);
      if (company.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid companyId' });
      }
    }

    const updateData = {
      name: name || existing.rows[0].name,
      email: email || existing.rows[0].email,
      phone: phone !== undefined ? phone : existing.rows[0].phone,
      address: address !== undefined ? address : existing.rows[0].address,
      companyId: companyId !== undefined ? companyId : existing.rows[0].s.companyId,
    };

    const result = await pool.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3, address = $4, "companyId" = $5 WHERE id = $6 RETURNING *',
      [
        updateData.name,
        updateData.email,
        updateData.phone || null,
        updateData.address || null,
        updateData.companyId || null,
        parseInt(id),
      ]
    );

    const customer = result.rows[0];
    const companyResult = customer.companyId ? await pool.query('SELECT name FROM companies WHERE id = $1', [customer.companyId]) : { rows: [] };

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      companyId: customer.companyId || null,
      companyName: companyResult.rows[0]?.name || customer.s.companyId || '',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// DELETE customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM customers WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check for dependent records (e.g., invoices, sales)
    const invoices = await pool.query('SELECT id FROM invoices WHERE id = $1', [parseInt(id)]);
    const sales = await pool.query('SELECT id FROM sales WHERE id = $1', [parseInt(id)]);
    if (invoices.rows.length > 0 || sales.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with associated invoices or sales' });
    }

    await pool.query('DELETE FROM customers WHERE id = $1', [parseInt(id)]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};