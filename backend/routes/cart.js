const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// All cart routes are protected
router.use(isAuthenticated);

// @route   GET /api/cart
// @desc    Get cart items
// @access  Private
router.get('/', cartController.getCartItems);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post(
  '/',
  [
    check('product_id', 'Product ID is required').notEmpty(),
    check('quantity', 'Quantity must be at least 1').optional().isInt({ min: 1 })
  ],
  cartController.addToCart
);

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put(
  '/:id',
  [
    check('quantity', 'Quantity must be at least 1').isInt({ min: 1 })
  ],
  cartController.updateCartItem
);

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', cartController.removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', cartController.clearCart);

module.exports = router; 