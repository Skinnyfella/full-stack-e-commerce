const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', categoryController.getCategories);

// @route   GET /api/categories/:id
// @desc    Get category by ID or slug
// @access  Public
router.get('/:id', categoryController.getCategoryById);

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private/Admin
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  [
    check('name', 'Name is required').notEmpty(),
    check('name', 'Name must be between 2 and 100 characters').isLength({ min: 2, max: 100 }),
    check('description', 'Description cannot exceed 1000 characters').optional().isLength({ max: 1000 })
  ],
  categoryController.createCategory
);

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  [
    check('name', 'Name must be between 2 and 100 characters').optional().isLength({ min: 2, max: 100 }),
    check('description', 'Description cannot exceed 1000 characters').optional().isLength({ max: 1000 })
  ],
  categoryController.updateCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', isAuthenticated, isAdmin, categoryController.deleteCategory);

module.exports = router; 