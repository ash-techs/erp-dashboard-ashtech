const { Pool } = require('pg');
const PDFDocument = require('pdfkit');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const validDepartments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales'];
const validStatuses = ['Active', 'Inactive'];

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, employee_id, department, position, salary, hire_date, email, website, status, "created_at", "updated_at" FROM employees ORDER BY created_at DESC'
    );
    res.json(
      result.rows.map((emp) => ({
        id: emp.id,
        name: emp.name,
        employeeId: emp.employee_id,
        department: emp.department,
        position: emp.position,
        salary: parseFloat(emp.salary),
  hireDate: emp.hire_date ,
        email: emp.email,
        website: emp.website || '',
        status: emp.status,
        createdAt: emp.created_at.toISOString(),
        updatedAt: emp.updated_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Search employees
const searchEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, name, employee_id, department, position, salary, "hire_date", email, website, status, "created_at", "updated_at" FROM employees ORDER BY created_at DESC';
    let params = [];

    if (search) {
      query = `
        SELECT id, name, employee_id, department, position, salary, "hire_date", email, website, status, "created_at", "updated_at" 
        FROM employees 
        WHERE name ILIKE $1 OR employee_id ILIKE $1 OR department ILIKE $1 
        ORDER BY "created_at" DESC
      `;
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    res.json(
      result.rows.map((emp) => ({
        id: emp.id,
        name: emp.name,
        employeeId: emp.employee_id,
        department: emp.department,
        position: emp.position,
        salary: parseFloat(emp.salary),
        hireDate: emp.hire_date.toISOString().split('T')[0],
        email: emp.email,
        website: emp.website || '',
        status: emp.status,
        createdAt: emp.created_at.toISOString(),
        updatedAt: emp.updated_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ error: 'Failed to search employees' });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, employee_id, department, position, salary, hire_date, email, website, status, created_at, updated_at FROM employees WHERE id = $1',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const emp = result.rows[0];
    res.json({
      id: emp.id,
      name: emp.name,
      employeeId: emp.employee_id,
      department: emp.department,
      position: emp.position,
      salary: parseFloat(emp.salary),
      hireDate: emp.hire_date,
      email: emp.email,
      website: emp.website || '',
      status: emp.status,
      createdAt: emp.created_at.toISOString(),
      updatedAt: emp.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Create employee
const createEmployee = async (req, res) => {
  try {
    const { name, employeeId, department, position, salary, hireDate, email, website, status } = req.body;

    if (!name || !employeeId || !department || !position || !salary || !hireDate || !email) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: `Department must be one of: ${validDepartments.join(', ')}` });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (salary <= 0) {
      return res.status(400).json({ error: 'Salary must be greater than 0' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (website && !/^https?:\/\/.+\..+/.test(website)) {
      return res.status(400).json({ error: 'Invalid website URL' });
    }

    try {
      const result = await pool.query(
        'INSERT INTO employees (name, employee_id, department, position, salary, hire_date, email, website, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [name, employeeId, department, position, salary, hireDate, email, website || null, status, new Date(), new Date()]
      );

      const emp = result.rows[0];
      res.status(201).json({
        id: emp.id,
        name: emp.name,
        employeeId: emp.employee_id,
        department: emp.department,
        position: emp.position,
        salary: parseFloat(emp.salary),
        hireDate: emp.hire_date,
        email: emp.email,
        website: emp.website || '',
        status: emp.status,
        createdAt: emp.created_at.toISOString(),
        updatedAt: emp.updated_at.toISOString(),
      });
    } catch (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'Employee ID or email already exists' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employeeId, department, position, salary, hireDate, email, website, status } = req.body;

    const existing = await pool.query('SELECT * FROM employees WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (department && !validDepartments.includes(department)) {
      return res.status(400).json({ error: `Department must be one of: ${validDepartments.join(', ')}` });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (salary && salary <= 0) {
      return res.status(400).json({ error: 'Salary must be greater than 0' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (website && !/^https?:\/\/.+\..+/.test(website)) {
      return res.status(400).json({ error: 'Invalid website URL' });
    }

    const data = {
      ...(name && { name }),
      ...(employeeId && { employee_id: employeeId }),
      ...(department && { department }),
      ...(position && { position }),
      ...(salary && { salary }),
      ...(hireDate && { hire_date: hireDate }),
      ...(email && { email }),
      ...(website !== undefined && { website: website || null }),
      ...(status && { status }),
      updated_at: new Date(),
    };

    const fields = Object.keys(data).map((key, index) => `${key} = $${index + 1}`);
    const values = Object.values(data);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    try {
      const result = await pool.query(
        `UPDATE employees SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const emp = result.rows[0];
      res.json({
        id: emp.id,
        name: emp.name,
        employeeId: emp.employee_id,
        department: emp.department,
        position: emp.position,
        salary: parseFloat(emp.salary),
        hireDate: emp.hire_date,
        email: emp.email,
        website: emp.website || '',
        status: emp.status,
        createdAt: emp.created_at.toISOString(),
        updatedAt: emp.updated_at.toISOString(),
      });
    } catch (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'Employee ID or email already exists' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

// Download employees PDF report
const downloadEmployeesPDF = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, employee_id, department, position, salary, hire_date, email, website, status, created_at FROM employees ORDER BY created_at DESC'
    );

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="employees-report.pdf"');

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Employees Report', 50, 50);
    doc.moveDown();

    // Add summary
    const totalEmployees = result.rows.length;
    const activeEmployees = result.rows.filter((e) => e.status === 'Active').length;
    const totalSalary = result.rows.reduce((sum, e) => sum + parseFloat(e.salary), 0);

    doc.fontSize(12);
    doc.text(`Total Employees: ${totalEmployees}`, 50, 100);
    doc.text(`Active Employees: ${activeEmployees}`, 50, 120);
    doc.text(`Total Salary: $${totalSalary.toLocaleString()}`, 50, 140);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 160);
    doc.moveDown(2);

    // Add employees table header
    let yPosition = 220;
    doc.text('ID', 50, yPosition);
    doc.text('Name', 80, yPosition);
    doc.text('Employee ID', 180, yPosition);
    doc.text('Department', 260, yPosition);
    doc.text('Position', 340, yPosition);
    doc.text('Salary', 420, yPosition);
    doc.text('Status', 480, yPosition);

    // Add line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Add employee data
    result.rows.forEach((emp) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(emp.id.toString(), 50, yPosition);
      doc.text(emp.name.substring(0, 20), 80, yPosition);
      doc.text(emp.employee_id.substring(0, 15), 180, yPosition);
      doc.text(emp.department, 260, yPosition);
      doc.text(emp.position.substring(0, 15), 340, yPosition);
      doc.text(`$${parseFloat(emp.salary).toLocaleString()}`, 420, yPosition);
      doc.text(emp.status, 480, yPosition);
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating employees PDF:', error);
    res.status(500).json({ error: 'Failed to generate employees PDF report' });
  }
};

module.exports = {
  getAllEmployees,
  searchEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  downloadEmployeesPDF,
};