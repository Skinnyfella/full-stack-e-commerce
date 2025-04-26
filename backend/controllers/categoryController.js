const { validationResult } = require('express-validator');
const db = require('../models');
const slugify = require('slugify');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get category by ID or slug
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res) => {
  try {
    const identifier = req.params.id;
    
    // Find by ID or slug
    const whereClause = isNaN(identifier) 
      ? { slug: identifier } 
      : { id: identifier };
    
    const category = await db.Category.findOne({
      where: whereClause,
      include: [{
        model: db.Product,
        limit: 10
      }]
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Generate slug from name
    const slug = slugify(name, { 
      lower: true, 
      strict: true
    });
    
    // Check if slug already exists
    const existingCategory = await db.Category.findOne({ where: { slug } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    // Create category
    const category = await db.Category.create({
      name,
      slug,
      description
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Find category by ID
    const category = await db.Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Update slug if name changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = slugify(name, { 
        lower: true, 
        strict: true
      });
      
      // Check if new slug already exists (but not for this category)
      const existingCategory = await db.Category.findOne({ 
        where: { 
          slug,
          id: { [db.Sequelize.Op.ne]: category.id }
        } 
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }
    
    // Update category
    await category.update({
      name: name || category.name,
      slug,
      description: description !== undefined ? description : category.description,
      updated_at: new Date()
    });
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await db.Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await db.Product.count({
      where: { category_id: category.id }
    });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${productCount} products. Reassign products first.` 
      });
    }
    
    // Delete the category
    await category.destroy();
    
    res.json({ message: 'Category removed' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}; 