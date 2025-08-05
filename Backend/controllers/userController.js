const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const validRoles = ['Admin', 'HR', 'Finance', 'Sales', 'Employee'];
const validStatuses = ['Active', 'Inactive'];

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, email, role, status, user_id, current_challenge, created_at, "updatedAt" FROM users ORDER BY created_at DESC'
    );
    res.json(
      result.rows.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        userId: user.user_id,
        currentChallenge: user.current_challenge || '',
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, name, username, email, role, status, user_id, current_challenge, created_at, "updatedat" FROM users ORDER BY created_at DESC';
    let params = [];

    if (search) {
      query = `
        SELECT id, name, username, email, role, status, user_id, current_challenge, created_at, "updatedAt" 
        FROM users 
        WHERE name ILIKE $1 OR username ILIKE $1 OR email ILIKE $1 
        ORDER BY created_at DESC
      `;
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    res.json(
      result.rows.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        userId: user.user_id,
        currentChallenge: user.current_challenge || '',
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, username, email, role, status, user_id, current_challenge, created_at, "updatedAt" FROM users WHERE id = $1',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      userId: user.user_id,
      currentChallenge: user.current_challenge || '',
      createdAt: user.created_at.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { name, username, email, role, status, currentChallenge, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Name, username, email, and password are required' });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await pool.query(
        'INSERT INTO users (name, username, email, role, status, user_id, current_challenge, created_at, "updatedAt", password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [name, username, email, role, status, userId, currentChallenge || null, new Date(), new Date(), hashedPassword]
      );

      const user = result.rows[0];
      res.status(201).json({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        userId: user.user_id,
        currentChallenge: user.current_challenge || '',
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'Username or email already exists' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, role, status, currentChallenge, password } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const data = {
      ...(name && { name }),
      ...(username && { username }),
      ...(email && { email }),
      ...(role && { role }),
      ...(status && { status }),
      ...(currentChallenge !== undefined && { current_challenge: currentChallenge || null }),
      updatedAt: new Date(),
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const fields = Object.keys(data).map((key, index) => `${key} = $${index + 1}`);
    const values = Object.values(data);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    try {
      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      res.json({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        userId: user.user_id,
        currentChallenge: user.current_challenge || '',
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'Username or email already exists' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Download users PDF report
const downloadUsersPDF = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, email, role, status, created_at FROM users ORDER BY created_at DESC'
    );

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="users-report.pdf"');

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Users Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalUsers = result.rows.length;
    const activeUsers = result.rows.filter((u) => u.status === 'Active').length;
    const adminUsers = result.rows.filter((u) => u.role === 'Admin').length;

    doc.fontSize(12);
    doc.text(`Total Users: ${totalUsers}`, 50, 100);
    doc.text(`Active Users: ${activeUsers}`, 50, 120);
    doc.text(`Admin Users: ${adminUsers}`, 50, 140);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 160);
    doc.moveDown(2);

    // Add users table header
    let yPosition = 220;
    doc.text('ID', 50, yPosition);
    doc.text('Name', 80, yPosition);
    doc.text('Username', 180, yPosition);
    doc.text('Email', 280, yPosition);
    doc.text('Role', 400, yPosition);
    doc.text('Status', 460, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Add user data
    result.rows.forEach((user) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(user.id.toString(), 50, yPosition);
      doc.text(user.name.substring(0, 20), 80, yPosition);
      doc.text(user.username.substring(0, 20), 180, yPosition);
      doc.text(user.email.substring(0, 25), 280, yPosition);
      doc.text(user.role, 400, yPosition);
      doc.text(user.status, 460, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating users PDF:', error);
    res.status(500).json({ error: 'Failed to generate users PDF report' });
  }
};

module.exports = {
  getAllUsers,
  searchUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  downloadUsersPDF,
};