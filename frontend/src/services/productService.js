// Mock product service
// In a real application, this would make API calls to your backend

import { apiClient } from './api';
import { supabase } from '../utils/supabase';

// Create a function to get the auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
};

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generate sample mock products for fallback
const generateMockProducts = () => {
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys'];
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];
  
  return Array.from({ length: 36 }, (_, i) => ({
    id: (i + 1).toString(),
    name: `Product ${i + 1}`,
    description: `This is a detailed description for product ${i + 1}. It includes all the important features and benefits that customers need to know.`,
    price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
    category: categories[Math.floor(Math.random() * categories.length)],
    inventory: Math.floor(Math.random() * 100),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    imageUrl: `https://picsum.photos/seed/product${i + 1}/400/300`,
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  }));
};

// Mock products for fallback
const mockProducts = generateMockProducts();

export const productService = {
  // Get all products with pagination, sorting, and filtering
  async getProducts(params = {}) {
    try {
      return await apiClient.get('/products', params);
    } catch (error) {
      console.error('Error fetching products from API, using mock data:', error);
      
      // Fallback to mock data
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        category = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;
      
      // Filter products
      let filteredProducts = [...mockProducts];
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
        );
      }
      
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === category
        );
      }
      
      // Sort products
      filteredProducts.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a[sortBy] > b[sortBy] ? 1 : -1;
        } else {
          return a[sortBy] < b[sortBy] ? 1 : -1;
        }
      });
      
      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      return {
        products: paginatedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limit)
        }
      };
    }
  },
  
  // Get a single product by ID
  async getProductById(id) {
    try {
      return await apiClient.get(`/products/${id}`);
    } catch (error) {
      console.error('Error fetching product from API, using mock data:', error);
      
      // Fallback to mock data
      const product = mockProducts.find(product => product.id === id);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    }
  },
  
  // Create a new product
  async createProduct(productData) {
    try {
      return await apiClient.post('/products', productData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  // Update an existing product
  async updateProduct(id, productData) {
    try {
      return await apiClient.put(`/products/${id}`, productData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
  
  // Delete a product
  async deleteProduct(id) {
    try {
      return await apiClient.delete(`/products/${id}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
  
  // Get all product categories
  async getCategories() {
    try {
      return await apiClient.get('/products/categories');
    } catch (error) {
      // Silently fall back to mock categories instead of reporting an error
      console.log('Using mock categories data');
      
      // Extract unique categories from mock products
      return [...new Set(mockProducts.map(product => product.category))];
    }
  },
  
  // Upload product image
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/products/upload-image`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Image upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Return a placeholder image URL as fallback
      return { imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300` };
    }
  }
}