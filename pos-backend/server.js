// pos-backend/server.js
require('dotenv').config();
console.log('Loaded env - NODE_ENV =', process.env.NODE_ENV);

const express = require('express');
const customCors = require('./src/middleware/cors');
const cookieParser = require('cookie-parser');

// Routes (remove auth-related imports)
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const positionRoutes = require('./src/routes/positionRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const salesItemsRoutes = require('./src/routes/salesItemsRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const stockTransactionRoutes = require('./src/routes/stockTransactionRoutes');
const printRoutes = require('./src/routes/printRoutes'); 
const professionalPrintRoutes = require('./src/routes/professionalPrintRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(customCors);
app.use(express.json());
app.use(cookieParser());

// Debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// All routes are now public (no auth required)
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sales-items', salesItemsRoutes);
app.use('/api/stock-transactions', stockTransactionRoutes);

// Printing endpoints
app.use('/print', printRoutes);
app.use('/api/print', professionalPrintRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Enhanced printing available at: http://${HOST}:${PORT}/api/print/enhanced`);
});