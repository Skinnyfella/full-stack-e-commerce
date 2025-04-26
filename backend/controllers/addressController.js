const { validationResult } = require('express-validator');
const db = require('../models');

/**
 * @desc    Get all addresses for a user
 * @route   GET /api/addresses
 * @access  Private
 */
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const addresses = await db.Address.findAll({
      where: { user_id: userId },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });
    
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get address by ID
 * @route   GET /api/addresses/:id
 * @access  Private
 */
const getAddressById = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    
    const address = await db.Address.findOne({
      where: {
        id: addressId,
        user_id: userId
      }
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create new address
 * @route   POST /api/addresses
 * @access  Private
 */
const createAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const {
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default = false
    } = req.body;
    
    // If setting as default, unset any existing default
    if (is_default) {
      await db.Address.update(
        { is_default: false },
        { where: { user_id: userId, is_default: true } }
      );
    }
    
    // Create new address
    const address = await db.Address.create({
      user_id: userId,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default
    });
    
    res.status(201).json(address);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
const updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const addressId = req.params.id;
    
    const {
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default
    } = req.body;
    
    // Find address
    const address = await db.Address.findOne({
      where: {
        id: addressId,
        user_id: userId
      }
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // If setting as default, unset any existing default
    if (is_default && !address.is_default) {
      await db.Address.update(
        { is_default: false },
        { where: { user_id: userId, is_default: true } }
      );
    }
    
    // Update address
    await address.update({
      address_line1: address_line1 || address.address_line1,
      address_line2: address_line2 !== undefined ? address_line2 : address.address_line2,
      city: city || address.city,
      state: state !== undefined ? state : address.state,
      postal_code: postal_code || address.postal_code,
      country: country || address.country,
      is_default: is_default !== undefined ? is_default : address.is_default,
      updated_at: new Date()
    });
    
    res.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    
    // Find address
    const address = await db.Address.findOne({
      where: {
        id: addressId,
        user_id: userId
      }
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // Check if address is used in any orders
    const order = await db.Order.findOne({
      where: { shipping_address_id: addressId }
    });
    
    if (order) {
      return res.status(400).json({ 
        message: 'Cannot delete address that is used in orders' 
      });
    }
    
    // Delete address
    await address.destroy();
    
    res.json({ message: 'Address removed' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Set address as default
 * @route   PUT /api/addresses/:id/default
 * @access  Private
 */
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    
    // Find address
    const address = await db.Address.findOne({
      where: {
        id: addressId,
        user_id: userId
      }
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // Unset any existing default
    await db.Address.update(
      { is_default: false },
      { where: { user_id: userId, is_default: true } }
    );
    
    // Set new default
    await address.update({
      is_default: true,
      updated_at: new Date()
    });
    
    res.json(address);
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
}; 