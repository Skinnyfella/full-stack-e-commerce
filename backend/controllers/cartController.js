const { validationResult } = require('express-validator');
const db = require('../models');

/**
 * @desc    Get cart items for authenticated user
 * @route   GET /api/cart
 * @access  Private
 */
const getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cartItems = await db.CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Product,
          include: [{ model: db.Category }]
        }
      ]
    });
    
    // Calculate totals
    const itemCount = cartItems.length;
    let total = 0;
    
    const items = cartItems.map(item => {
      const subtotal = parseFloat(item.Product.price) * item.quantity;
      total += subtotal;
      
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.Product,
        price: parseFloat(item.Product.price),
        subtotal
      };
    });
    
    res.json({
      items,
      itemCount,
      total
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;
    
    // Check if product exists and is in stock
    const product = await db.Product.findByPk(product_id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stock_quantity < 1) {
      return res.status(400).json({ message: 'Product is out of stock' });
    }
    
    if (quantity > product.stock_quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock_quantity} items available` 
      });
    }
    
    // Check if item already in cart
    let cartItem = await db.CartItem.findOne({
      where: { 
        user_id: userId,
        product_id
      }
    });
    
    if (cartItem) {
      // Update quantity
      const newQuantity = cartItem.quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({ 
          message: `Cannot add more. Only ${product.stock_quantity} items available` 
        });
      }
      
      await cartItem.update({ 
        quantity: newQuantity,
        updated_at: new Date()
      });
    } else {
      // Create new cart item
      cartItem = await db.CartItem.create({
        user_id: userId,
        product_id,
        quantity
      });
    }
    
    // Return updated cart
    await getCartItems(req, res);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:id
 * @access  Private
 */
const updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;
    
    // Find cart item
    const cartItem = await db.CartItem.findOne({
      where: { 
        id: cartItemId,
        user_id: userId
      },
      include: [{ model: db.Product }]
    });
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    // Check stock
    if (quantity > cartItem.Product.stock_quantity) {
      return res.status(400).json({ 
        message: `Only ${cartItem.Product.stock_quantity} items available` 
      });
    }
    
    // Update quantity
    await cartItem.update({
      quantity,
      updated_at: new Date()
    });
    
    // Return updated cart
    await getCartItems(req, res);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:id
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    
    // Find and delete cart item
    const cartItem = await db.CartItem.findOne({
      where: { 
        id: cartItemId,
        user_id: userId
      }
    });
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    await cartItem.destroy();
    
    // Return updated cart
    await getCartItems(req, res);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete all user's cart items
    await db.CartItem.destroy({
      where: { user_id: userId }
    });
    
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 