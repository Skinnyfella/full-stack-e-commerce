const { validationResult } = require('express-validator');
const db = require('../models');
const supabase = require('../config/supabase');
const slugify = require('slugify');

/**
 * @desc    Get all products with optional filtering
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      minPrice, 
      maxPrice, 
      search,
      sort = 'newest' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for filtering
    const whereClause = {};
    
    if (category) {
      const categoryRecord = await db.Category.findOne({ where: { slug: category } });
      if (categoryRecord) {
        whereClause.category_id = categoryRecord.id;
      }
    }
    
    if (minPrice) {
      whereClause.price = { ...whereClause.price, [db.Sequelize.Op.gte]: minPrice };
    }
    
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, [db.Sequelize.Op.lte]: maxPrice };
    }
    
    if (search) {
      whereClause[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Set order based on sort parameter
    let order;
    switch (sort) {
      case 'newest':
        order = [['created_at', 'DESC']];
        break;
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      default:
        order = [['created_at', 'DESC']];
    }
    
    // Find products with pagination
    const { count, rows: products } = await db.Product.findAndCountAll({
      where: whereClause,
      order,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: db.Category,
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    res.json({
      products,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
      total: count
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const identifier = req.params.id;
    
    // Find by ID or slug
    const whereClause = isNaN(identifier) 
      ? { slug: identifier } 
      : { id: identifier };
    
    const product = await db.Product.findOne({
      where: whereClause,
      include: [
        {
          model: db.Category,
          attributes: ['id', 'name', 'slug']
        },
        {
          model: db.ProductReview,
          include: [
            {
              model: db.UserProfile,
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      price, 
      category_id, 
      stock_quantity = 0,
      image_url 
    } = req.body;
    
    // Generate slug from name
    const slug = slugify(name, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Check if slug already exists
    const existingProduct = await db.Product.findOne({ where: { slug } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }
    
    // Create product
    const product = await db.Product.create({
      name,
      slug,
      description,
      price,
      stock_quantity,
      category_id,
      image_url
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      price, 
      category_id, 
      stock_quantity,
      image_url 
    } = req.body;
    
    // Find product by ID
    const product = await db.Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update slug if name changed
    let slug = product.slug;
    if (name && name !== product.name) {
      slug = slugify(name, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      // Check if new slug already exists (but not for this product)
      const existingProduct = await db.Product.findOne({ 
        where: { 
          slug,
          id: { [db.Sequelize.Op.ne]: product.id }
        } 
      });
      
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this name already exists' });
      }
    }
    
    // Update product
    await product.update({
      name: name || product.name,
      slug,
      description: description || product.description,
      price: price || product.price,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : product.stock_quantity,
      category_id: category_id || product.category_id,
      image_url: image_url || product.image_url,
      updated_at: new Date()
    });
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if product is in any order
    const orderItem = await db.OrderItem.findOne({
      where: { product_id: product.id }
    });
    
    if (orderItem) {
      // Don't delete, just mark as out of stock
      await product.update({ 
        stock_quantity: 0,
        updated_at: new Date()
      });
      return res.json({ message: 'Product is in orders. Marked as out of stock instead.' });
    }
    
    // Delete the product
    await product.destroy();
    
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Upload product image to Supabase Storage
 * @route   POST /api/products/upload-image
 * @access  Private/Admin
 */
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });
    
    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(500).json({ message: 'Error uploading image' });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    res.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get top rated products
 * @route   GET /api/products/top
 * @access  Public
 */
const getTopProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    
    // Find products with highest average rating
    const products = await db.Product.findAll({
      include: [
        {
          model: db.ProductReview,
          attributes: []
        }
      ],
      attributes: [
        'id', 
        'name', 
        'slug', 
        'price', 
        'image_url',
        [db.sequelize.fn('AVG', db.sequelize.col('ProductReviews.rating')), 'averageRating'],
        [db.sequelize.fn('COUNT', db.sequelize.col('ProductReviews.id')), 'reviewCount']
      ],
      group: ['Product.id'],
      having: db.sequelize.literal('COUNT("ProductReviews"."id") > 0'),
      order: [
        [db.sequelize.literal('averageRating'), 'DESC'],
        [db.sequelize.literal('reviewCount'), 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all unique product categories
 * @route   GET /api/products/categories
 * @access  Public
 */
const getProductCategories = async (req, res) => {
  try {
    // Get all categories
    const categories = await db.Category.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']]
    });
    
    // Extract category names and send as array
    const categoryNames = categories.map(category => category.name);
    
    res.json(categoryNames);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getTopProducts,
  getProductCategories
}; 