const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const addressController = require('../controllers/addressController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(isAuthenticated);

// @route   GET /api/addresses
// @desc    Get all addresses for a user
// @access  Private
router.get('/', addressController.getAddresses);

// @route   GET /api/addresses/:id
// @desc    Get address by ID
// @access  Private
router.get('/:id', addressController.getAddressById);

// @route   POST /api/addresses
// @desc    Create new address
// @access  Private
router.post(
  '/',
  [
    check('address_line1', 'Address line 1 is required').notEmpty(),
    check('city', 'City is required').notEmpty(),
    check('postal_code', 'Postal code is required').notEmpty(),
    check('country', 'Country is required').notEmpty()
  ],
  addressController.createAddress
);

// @route   PUT /api/addresses/:id
// @desc    Update address
// @access  Private
router.put(
  '/:id',
  [
    check('address_line1', 'Address line 1 cannot be empty').optional().notEmpty(),
    check('city', 'City cannot be empty').optional().notEmpty(),
    check('postal_code', 'Postal code cannot be empty').optional().notEmpty(),
    check('country', 'Country cannot be empty').optional().notEmpty()
  ],
  addressController.updateAddress
);

// @route   DELETE /api/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/:id', addressController.deleteAddress);

// @route   PUT /api/addresses/:id/default
// @desc    Set address as default
// @access  Private
router.put('/:id/default', addressController.setDefaultAddress);

module.exports = router; 