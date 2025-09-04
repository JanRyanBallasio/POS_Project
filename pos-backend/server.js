// ...existing code...
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
const receiptRoutes = require("./src/routes/receiptRoutes");
const authRoutes = require('./src/routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;
// default to 0.0.0.0 so external IPs can connect; set HOST env to override if needed
const HOST = '0.0.0.0';

// Middleware
// app.use(cors());
app.use(customCors);
app.use(express.json());
app.use(cookieParser());

// Public Auth routes
app.use('/api/auth', authRoutes);

// Protect API routes (require valid access token)
app.use('/api/users', auth, userRoutes);
app.use('/api/customers', auth, customerRoutes);
app.use('/api/products', productRoutes); // productRoutes already applies auth at router level
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/positions', auth, positionRoutes);
app.use('/api/sales', auth, salesRoutes);
app.use('/api/sales-items', auth, salesItemsRoutes);
app.use('/api/stock-transactions', auth, stockTransactionRoutes);
app.use('/api', auth, receiptRoutes);

// 404 fallback (optional)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
require('dotenv').config();
console.log('Loaded env - NODE_ENV =', process.env.NODE_ENV);
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
// ...existing code...