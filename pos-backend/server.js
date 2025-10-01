// pos-backend/server.js
require('dotenv').config();
console.log('Loaded env - NODE_ENV =', process.env.NODE_ENV);

const express = require('express');
// const cors = require('cors');
const customCors = require('./src/middleware/cors');
const cookieParser = require('cookie-parser');
const auth = require('./src/middleware/auth');

// Routes
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const positionRoutes = require('./src/routes/positionRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const salesItemsRoutes = require('./src/routes/salesItemsRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const stockTransactionRoutes = require('./src/routes/stockTransactionRoutes');
const authRoutes = require('./src/routes/auth.routes');
const directPrintRoutes = require("./src/routes/directPrintRoutes");
const printRoutes = require('./src/routes/printRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
// app.use(cors());
app.use(customCors);
app.use(express.json());
app.use(cookieParser());

// Debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin} - Auth: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  next();
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api', directPrintRoutes);

// Protected routes
app.use('/api/users', auth, userRoutes);
app.use('/api/customers', auth, customerRoutes);
app.use('/api/products', productRoutes); // already protects inside
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/positions', auth, positionRoutes);
app.use('/api/sales', auth, salesRoutes);
app.use('/api/sales-items', auth, salesItemsRoutes);
app.use('/api/stock-transactions', auth, stockTransactionRoutes);

// NEW: printing endpoint (no auth or add auth if required)
app.use('/print', printRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});