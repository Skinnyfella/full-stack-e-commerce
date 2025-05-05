// Mock product service with Supabase integration
import { apiClient } from './api';
import { supabase } from '../utils/supabase';

// Create a function to get the auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
};

// Standard categories
const STANDARD_CATEGORIES = [
  'Electronics',
  'Clothing & Accessories',
  'Home & Kitchen',
  'Books & Media',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Health & Wellness',
  'Toys & Games',
  'Automotive',
  'Pet Supplies',
  'Office Supplies',
  'Food & Beverages',
];

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Add cache for products
let productsCache = {
  data: null,
  timestamp: null,
  expiryTime: 5 * 60 * 1000 // 5 minutes
};

// Utility function to calculate product status based on inventory
const calculateProductStatus = (inventory) => {
  const stock = parseInt(inventory, 10);
  if (!stock || stock === 0) return 'Out of Stock';
  if (stock <= 20) return 'Low Stock';
  return 'In Stock';
};

// Format Supabase product data
const formatSupabaseProduct = (product) => ({
  id: product.id,
  name: product.name || 'Unnamed Product',
  description: product.description || '',
  price: product.price || 0,
  imageUrl: product.image_url || 'https://placehold.co/400x300?text=No+Image',
  inventory: product.stock_quantity || 0,
  sku: product.sku || `SKU-${product.id}`,
  category: product.category || 'Other',
  createdAt: product.created_at,
  status: calculateProductStatus(product.stock_quantity)
});

// Generate sample mock products for fallback
const generateMockProducts = () => {
  return Array.from({ length: 36 }, (_, i) => {
    const inventory = Math.floor(Math.random() * 100);
    return {
      id: (i + 1).toString(),
      name: `Product ${i + 1}`,
      description: `This is a detailed description for product ${i + 1}. It includes all the important features and benefits that customers need to know.`,
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      category: STANDARD_CATEGORIES[Math.floor(Math.random() * STANDARD_CATEGORIES.length)],
      inventory: inventory,
      status: calculateProductStatus(inventory),
      imageUrl: `https://picsum.photos/seed/product${i + 1}/400/300`,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    };
  });
};

// Mock products for fallback
const mockProducts = generateMockProducts();

export const productService = {
  // Get all products with pagination, sorting, and filtering
  async getProducts(params = {}) {
    try {
      // Check cache if no filters are applied
      const noFiltersApplied = !params.category && !params.search && !params.status;
      const cacheValid = productsCache.data && 
        (Date.now() - productsCache.timestamp) < productsCache.expiryTime;
      
      if (noFiltersApplied && cacheValid) {
        return productsCache.data;
      }

      // Try Supabase first
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format and cache the response
      const formattedData = {
        products: products.map(formatSupabaseProduct),
        pagination: {
          page: 1,
          limit: products.length,
          total: products.length,
          totalPages: 1
        }
      };

      if (noFiltersApplied) {
        productsCache.data = formattedData;
        productsCache.timestamp = Date.now();
      }

      return formattedData;
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        products: mockProducts,
        pagination: {
          page: 1,
          limit: mockProducts.length,
          total: mockProducts.length,
          totalPages: 1
        }
      };
    }
  },

  // Get a single product by ID
  async getProductById(id) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!product) throw new Error('Product not found');

      return formatSupabaseProduct(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      const mockProduct = mockProducts.find(p => p.id === id);
      if (mockProduct) return mockProduct;

      return {
        id,
        name: 'Product Not Available',
        description: 'This product is no longer available.',
        price: 0,
        imageUrl: 'https://placehold.co/400x300?text=Not+Available',
        inventory: 0,
        sku: 'UNAVAILABLE',
        status: 'Out of Stock',
        category: 'Other',
      };
    }
  },

  // Create a new product
  async createProduct(productData) {
    try {
      // Ensure the category exists in our standard categories
      const category = STANDARD_CATEGORIES.includes(productData.category) 
        ? productData.category 
        : 'Other';

      // Ensure inventory/stock_quantity is included
      const supabaseProduct = {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
        stock_quantity: parseInt(productData.inventory, 10) || 0,
        image_url: productData.imageUrl || '',
        sku: productData.sku,
        category: category,
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
      };

      const { data, error } = await supabase
        .from('products')
        .insert(supabaseProduct)
        .select()
        .single();

      if (error) throw error;

      return formatSupabaseProduct(data);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update an existing product
  async updateProduct(id, productData) {
    try {
      // Ensure the category exists in our standard categories
      const category = STANDARD_CATEGORIES.includes(productData.category) 
        ? productData.category 
        : 'Other';

      // Only include fields that exist in the database
      const supabaseProduct = {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
        stock_quantity: parseInt(productData.inventory, 10) || 0,
        image_url: productData.imageUrl || '',
        category: category,
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
      };

      const { data, error } = await supabase
        .from('products')
        .update(supabaseProduct)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return formatSupabaseProduct(data);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(id) {
    try {
      // First, delete any cart items that reference this product
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('product_id', id);

      if (cartError) throw cartError;

      // Then delete the product itself
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (productError) throw productError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Get all product categories
  async getCategories() {
    try {
      return STANDARD_CATEGORIES;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return STANDARD_CATEGORIES;
    }
  },

  // Upload product image
  async uploadImage(file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(filePath);

      return { imageUrl: publicUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { imageUrl: `https://placehold.co/400x300?text=No+Image` };
    }
  },

  // Get real products directly from Supabase
  async getSupabaseProducts() {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts = products.map(formatSupabaseProduct);

      return {
        products: formattedProducts,
        pagination: {
          page: 1,
          limit: formattedProducts.length,
          total: formattedProducts.length,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error in getSupabaseProducts:', error);
      return { 
        products: mockProducts,
        pagination: {
          page: 1,
          limit: mockProducts.length,
          total: mockProducts.length,
          totalPages: 1
        }
      };
    }
  }
};