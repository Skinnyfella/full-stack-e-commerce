const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// @route   POST /api/users/profile
// @desc    Create a user profile
// @access  Private
router.post(
  '/profile',
  isAuthenticated,
  [
    check('id', 'User ID is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail()
  ],
  userController.createUserProfile
);

// @route   GET /api/users/profile
// @desc    Get authenticated user's profile
// @access  Private
router.get('/profile', isAuthenticated, userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  isAuthenticated,
  [
    check('first_name', 'First name cannot exceed 100 characters').optional().isLength({ max: 100 }),
    check('last_name', 'Last name cannot exceed 100 characters').optional().isLength({ max: 100 })
  ],
  userController.updateUserProfile
);

module.exports = router; 