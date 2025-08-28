const express = require('express');
const cors = require('cors');

// Routes
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const positionRoutes = require('./src/routes/positionRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const salesItemsRoutes = require('./src/routes/salesItemsRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const stockTransactionRoutes = require('./src/routes/stockTransactionRoutes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/stock-transactions', stockTransactionRoutes)
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sales-items', salesItemsRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});