const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import routes
const invoiceRoutes = require("./routes/invoiceRoutes");
const productRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const salesRoutes = require("./routes/saleRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const customerRoutes = require("./routes/customerRoutes");
const userRoutes = require("./routes/userRoutes");
const analyticsRoutes = require('./routes/analyticsRoutes');

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:3001', 'http://localhost:5173','http://localhost:8080'],
  credentials: true
}));
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes

app.use("/api/users", userRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/companies', companyRoutes); 
app.use("/api/employees", employeeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/customers", customerRoutes);
app.use('/api/analytics', analyticsRoutes);
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port: '${PORT}' `);
});
