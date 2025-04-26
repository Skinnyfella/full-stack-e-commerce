const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');

const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', productController.getProducts);

// @route   GET /api/products/top
// @desc    Get top rated products
// @access  Public
router.get('/top', productController.getTopProducts);

// @route   GET /api/products/categories
// @desc    Get all unique product categories
// @access  Public
router.get('/categories', productController.getProductCategories);

// @route   GET /api/products/:id
// @desc    Get product by ID or slug
// @access  Public
router.get('/:id', productController.getProductById);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  [
    check('name', 'Name is required').notEmpty(),
    check('price', 'Price must be a positive number').isFloat({ min: 0.01 }),
    check('category_id', 'Category ID is required').notEmpty(),
    check('description', 'Description cannot exceed 2000 characters').optional().isLength({ max: 2000 })
  ],
  productController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  [
    check('name', 'Name must be between 3 and 100 characters').optional().isLength({ min: 3, max: 100 }),
    check('price', 'Price must be a positive number').optional().isFloat({ min: 0.01 }),
    check('description', 'Description cannot exceed 2000 characters').optional().isLength({ max: 2000 }),
    check('stock_quantity', 'Stock quantity must be a non-negative integer').optional().isInt({ min: 0 })
  ],
  productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', isAuthenticated, isAdmin, productController.deleteProduct);

// @route   POST /api/products/upload-image
// @desc    Upload product image
// @access  Private/Admin
router.post(
  '/upload-image',
  isAuthenticated,
  isAdmin,
  upload.single('image'),
  productController.uploadProductImage
);

module.exports = router; 