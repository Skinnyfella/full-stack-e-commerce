const { validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const db = require('../models');
const supabase = require('../config/supabase');
const slugify = require('slugify');

// Initialize cache with 5 minutes standard TTL
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const calculateStatus = (inventory) => {
  if (!inventory || inventory === 0) return 'Out of Stock';
  if (inventory <= 20) return 'Low Stock';
  return 'In Stock';
};

const sanitizeSearchQuery = (query) => {
  // Remove any SQL-injection prone characters
  return query.replace(/[;'"\\]/g, '');
};

// Get products with caching
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      minPrice, 
      maxPrice, 
      search,
      sort = 'newest',
      status
    } = req.query;

    // Sanitize search input
    const sanitizedSearch = search ? sanitizeSearchQuery(search) : null;

    // Generate cache key based on sanitized parameters
    const cacheKey = `products:${JSON.stringify({ 
      page, 
      limit, 
      category, 
      minPrice, 
      maxPrice, 
      search: sanitizedSearch, 
      sort, 
      status 
    })}`;
    
    // Try to get from cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

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
    
    if (sanitizedSearch) {
      whereClause[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${sanitizedSearch}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${sanitizedSearch}%` } },
        { sku: { [db.Sequelize.Op.iLike]: `%${sanitizedSearch}%` } }
      ];
    }

    // Add status filter
    if (status) {
      switch (status) {
        case 'In Stock':
          whereClause.stock_quantity = { [db.Sequelize.Op.gt]: 20 };
          break;
        case 'Low Stock':
          whereClause.stock_quantity = { 
            [db.Sequelize.Op.gt]: 0,
            [db.Sequelize.Op.lte]: 20 
          };
          break;
        case 'Out of Stock':
          whereClause.stock_quantity = { [db.Sequelize.Op.lte]: 0 };
          break;
      }
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
      case 'name_asc':
        order = [['name', 'ASC']];
        break;
      case 'name_desc':
        order = [['name', 'DESC']];
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
    
    // Add virtual status field to each product
    const productsWithStatus = products.map(product => ({
      ...product.toJSON(),
      status: calculateStatus(product.stock_quantity)
    }));
    
    const result = {
      products: productsWithStatus,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
      total: count
    };
    
    // Store in cache
    cache.set(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product with caching
const getProductById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const cacheKey = `product:${identifier}`;
    
    // Try cache first
    const cachedProduct = cache.get(cacheKey);
    if (cachedProduct) {
      return res.json(cachedProduct);
    }
    
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

    // Cache the product
    cache.set(cacheKey, product);
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear product cache when updating
const clearProductCache = (productId) => {
  // Clear specific product cache
  cache.del(`product:${productId}`);
  // Clear all products list caches (they contain this product)
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('products:')) {
      cache.del(key);
    }
  });
};

// Update existing controller methods to clear cache
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
    
    // Clear products list cache after creating
    clearProductCache(product.id);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    
    // Clear cache after updating
    clearProductCache(req.params.id);
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    
    // Clear cache after deleting
    clearProductCache(req.params.id);
    
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` 
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      });
    }

    // Generate safe filename
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to Supabase Storage with additional headers
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
        duplex: 'half'
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
    // Ensure standard categories exist
    await db.Category.ensureStandardCategories();
    
    // Get all categories with product counts
    const categories = await db.Category.findAll({
      attributes: [
        'name',
        'slug',
        [db.sequelize.fn('COUNT', db.sequelize.col('Products.id')), 'productCount']
      ],
      include: [{
        model: db.Product,
        attributes: [],
        required: false
      }],
      group: ['Category.id', 'Category.name', 'Category.slug'],
      order: [['name', 'ASC']]
    });
    
    // Map to simplified format
    const formattedCategories = categories.map(category => category.name);
    
    res.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    // Return empty array instead of error to maintain frontend functionality
    res.json([]);
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