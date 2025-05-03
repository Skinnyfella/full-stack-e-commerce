const { validationResult } = require('express-validator');
const db = require('../models');
const mockPaymentService = require('../services/mockPaymentService');
const consoleEmailService = require('../services/consoleEmailService');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  let transaction;
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const { shipping_address_id } = req.body;
    
    // Start transaction
    transaction = await db.sequelize.transaction();
    
    // Get cart items
    const cartItems = await db.CartItem.findAll({
      where: { user_id: userId },
      include: [{ model: db.Product }],
      transaction
    });
    
    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Verify address exists
    const address = await db.Address.findOne({
      where: { 
        id: shipping_address_id,
        user_id: userId
      },
      transaction
    });
    
    if (!address) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid shipping address' });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];
    const stockUpdates = [];
    
    for (const item of cartItems) {
      const { Product, quantity } = item;
      const subtotal = parseFloat(Product.price) * quantity;
      totalAmount += subtotal;
      
      // Check stock
      if (Product.stock_quantity < quantity) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Only ${Product.stock_quantity} items available for ${Product.name}` 
        });
      }
      
      // Prepare order items
      orderItems.push({
        product_id: Product.id,
        quantity,
        unit_price: Product.price
      });
      
      // Prepare stock updates
      stockUpdates.push({
        id: Product.id,
        stock_quantity: Product.stock_quantity - quantity
      });
    }
    
    // Process payment with mock data (no real card details needed)
    const mockCardDetails = { number: '4242424242424242', expiry: '12/25', cvc: '123' };
    const paymentResult = await mockPaymentService.processPayment(totalAmount, mockCardDetails);
    
    // Remove sensitive payment details from logs
    if (!paymentResult.success) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Payment failed' });
    }
    
    // Create order
    const order = await db.Order.create({
      user_id: userId,
      shipping_address_id,
      total_amount: totalAmount,
      status: 'pending',
      payment_intent_id: paymentResult.transactionId
    }, { transaction });
    
    // Create order items
    await Promise.all(orderItems.map(item => 
      db.OrderItem.create({
        order_id: order.id,
        ...item
      }, { transaction })
    ));
    
    // Update product stock
    await Promise.all(stockUpdates.map(update => 
      db.Product.update(
        { 
          stock_quantity: update.stock_quantity,
          updated_at: new Date()
        },
        { 
          where: { id: update.id },
          transaction
        }
      )
    ));
    
    // Clear cart
    await db.CartItem.destroy({
      where: { user_id: userId },
      transaction
    });
    
    // Commit transaction
    await transaction.commit();
    transaction = null; // Mark as committed
    
    try {
      // Send order confirmation email - outside transaction
      const user = await db.UserProfile.findByPk(userId);
      await consoleEmailService.sendOrderConfirmation(user, order);
    } catch (emailError) {
      console.error('Error sending order confirmation:', emailError);
      // Continue processing - don't fail the order if email fails
    }
    
    // Return order details
    const createdOrder = await db.Order.findByPk(order.id, {
      include: [
        {
          model: db.OrderItem,
          include: [{ model: db.Product }]
        },
        {
          model: db.Address,
          as: 'shippingAddress'
        }
      ]
    });
    
    res.status(201).json(createdOrder);
  } catch (error) {
    // Only roll back if transaction exists and is not committed
    if (transaction) await transaction.rollback();
    console.error('Order processing error occurred');
    res.status(500).json({ message: 'Error processing your order. Please try again.' });
  }
};

/**
 * @desc    Get all orders for authenticated user
 * @route   GET /api/orders
 * @access  Private
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await db.Order.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: db.OrderItem,
          include: [{ model: db.Product }]
        }
      ]
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    // Find order
    const order = await db.Order.findOne({
      where: { 
        id: orderId,
        user_id: userId
      },
      include: [
        {
          model: db.OrderItem,
          include: [{ model: db.Product }]
        },
        {
          model: db.Address,
          as: 'shippingAddress'
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update order to paid
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
const updateOrderToPaid = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    // Find order
    const order = await db.Order.findOne({
      where: { 
        id: orderId,
        user_id: userId
      }
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }
    
    // Update order status
    await order.update({
      status: 'paid',
      updated_at: new Date()
    });
    
    // Send confirmation email
    const user = await db.UserProfile.findByPk(userId);
    await consoleEmailService.sendOrderConfirmation(user, order);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/orders/admin
 * @access  Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: orders } = await db.Order.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: db.UserProfile,
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ]
    });
    
    res.json({
      orders,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
      total: count
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update order status (admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Find order
    const order = await db.Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status
    await order.update({
      status,
      updated_at: new Date()
    });
    
    // Notify customer
    const user = await db.UserProfile.findByPk(order.user_id);
    await consoleEmailService.sendOrderConfirmation(user, order);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  getAllOrders,
  updateOrderStatus
};