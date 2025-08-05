const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all companies
const getAllCompanies = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM companies';
    const values = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR email ILIKE $1';
      values.push(`%${search}%`);
    }
    query += ' ORDER BY name ASC';

    const result = await pool.query(query, values);

    const transformedCompanies = result.rows.map((company) => ({
      id: company.id,
      name: company.name,
      contact: company.contact || '',
      country: company.country || '',
      phone: company.phone || '',
      email: company.email,
      website: company.website || '',
    }));

    res.json(transformedCompanies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

// GET single company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = result.rows[0];
    res.json({
      id: company.id,
      name: company.name,
      contact: company.contact || '',
      country: company.country || '',
      phone: company.phone || '',
      email: company.email,
      website: company.website || '',
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

// CREATE new company
const createCompany = async (req, res) => {
  try {
    const { name, contact, country, phone, email, website } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await pool.query('SELECT * FROM companies WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Company with this email already exists' });
    }

    const id = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO companies (id, name, contact, country, phone, email, website) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, contact || '', country || '', phone || '', email, website || '']
    );

    res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      contact: result.rows[0].contact || '',
      country: result.rows[0].country || '',
      phone: result.rows[0].phone || '',
      email: result.rows[0].email,
      website: result.rows[0].website || '',
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
};

// UPDATE company
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, country, phone, email, website } = req.body;

    const existing = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (email !== existing.rows[0].email) {
      const conflict = await pool.query('SELECT * FROM companies WHERE email = $1', [email]);
      if (conflict.rows.length > 0) {
        return res.status(400).json({ error: 'Company with this email already exists' });
      }
    }

    const result = await pool.query(
      'UPDATE companies SET name = $1, contact = $2, country = $3, phone = $4, email = $5, website = $6 WHERE id = $7 RETURNING *',
      [name, contact || '', country || '', phone || '', email, website || '', id]
    );

    res.json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      contact: result.rows[0].contact || '',
      country: result.rows[0].country || '',
      phone: result.rows[0].phone || '',
      email: result.rows[0].email,
      website: result.rows[0].website || '',
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
};

// DELETE company
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};