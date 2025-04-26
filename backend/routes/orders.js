const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const orderController = require('../controllers/orderController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// All order routes require authentication
router.use(isAuthenticated);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post(
  '/',
  [
    check('shipping_address_id', 'Shipping address is required').notEmpty()
  ],
  orderController.createOrder
);

// @route   GET /api/orders
// @desc    Get all orders for authenticated user
// @access  Private
router.get('/', orderController.getMyOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', orderController.getOrderById);

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.put('/:id/pay', orderController.updateOrderToPaid);

// Admin Routes
// @route   GET /api/orders/admin
// @desc    Get all orders (admin)
// @access  Private/Admin
router.get('/admin/all', isAdmin, orderController.getAllOrders);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put(
  '/:id/status',
  isAdmin,
  [
    check('status', 'Status is required').notEmpty()
  ],
  orderController.updateOrderStatus
);

module.exports = router; 