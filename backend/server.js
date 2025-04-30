require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import database models
const db = require('./models');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const addressRoutes = require('./routes/addresses');
const categoryRoutes = require('./routes/categories');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourproductiondomain.com' 
    : 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection and initialize categories
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Ensure standard categories exist
    await db.Category.ensureStandardCategories();
    console.log('Standard categories initialized.');
    
  } catch (error) {
    console.error('Unable to connect to the database or initialize categories:', error);
  }
})();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/categories', categoryRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API running successfully!' });
});

// Add a root API route
app.get('/api', (req, res) => {
  res.json({ message: 'E-commerce API is available' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});