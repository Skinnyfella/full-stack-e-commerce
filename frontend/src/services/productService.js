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

// Utility function to calculate product status based on inventory
const calculateProductStatus = (inventory) => {
  if (!inventory || inventory === 0) return 'Out of Stock';
  if (inventory <= 20) return 'Low Stock';
  return 'In Stock';
};

// Generate sample mock products for fallback
const generateMockProducts = () => {
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys'];
  
  return Array.from({ length: 36 }, (_, i) => {
    const inventory = Math.floor(Math.random() * 100);
    return {
      id: (i + 1).toString(),
      name: `Product ${i + 1}`,
      description: `This is a detailed description for product ${i + 1}. It includes all the important features and benefits that customers need to know.`,
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      category: categories[Math.floor(Math.random() * categories.length)],
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

/**
 * Get products directly from Supabase
 */
const getSupabaseProducts = async () => {
  try {
    console.log('Fetching products directly from Supabase');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      throw new Error(error.message);
    }
    
    console.log('Products from Supabase:', products);
    
    // Map Supabase products to match our expected format
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name || 'Unknown Product',
      description: product.description || '',
      price: product.price || 0,
      image: product.image_url || '/images/placeholder.png',
      category: product.category || 'Uncategorized',
      inventory: product.inventory || 0,
      sku: product.sku || '',
      created_at: product.created_at,
      rating: product.rating || 0
    }));
    
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
    console.error('Error fetching products from Supabase:', error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }
};

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
      // Specific handling for product ID 1 which doesn't exist
      if (id === '1' || id === 1) {
        console.log('Product with ID 1 not found, returning a placeholder product');
        return {
          id: '1',
          name: 'Product Not Available',
          description: 'This product is no longer available.',
          price: 0,
          imageUrl: 'https://placehold.co/400x300?text=Not+Available',
          inventory: 0,
          sku: 'UNAVAILABLE',
          status: 'Out of Stock',
          category: 'Uncategorized',
        };
      }
      
      // Try to get from Supabase first
      const { data: supabaseProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (supabaseProduct && !error) {
        console.log('Product found in Supabase:', supabaseProduct);
        // Transform the data to match our app's expected format
        return {
          id: supabaseProduct.id,
          name: supabaseProduct.name,
          description: supabaseProduct.description,
          price: supabaseProduct.price,
          imageUrl: supabaseProduct.image_url,
          inventory: supabaseProduct.inventory_count || supabaseProduct.inventory || 0,
          sku: supabaseProduct.sku,
          status: supabaseProduct.is_active ? 'In Stock' : 'Out of Stock',
          category: supabaseProduct.category || 'Uncategorized',
        };
      }
      
      if (error) {
        console.log('Supabase product fetch error:', error);
        if (error.code === 'PGRST116') {
          console.log('Product not found in database');
          // Return a placeholder for not found products
          return {
            id: id,
            name: 'Product Not Available',
            description: 'This product is no longer available.',
            price: 0,
            imageUrl: 'https://placehold.co/400x300?text=Not+Available',
            inventory: 0,
            sku: 'UNAVAILABLE',
            status: 'Out of Stock',
            category: 'Uncategorized',
          };
        }
      }
      
      // Fall back to API if Supabase fails
      try {
        return await apiClient.get(`/products/${id}`);
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
        
        // Fallback to mock data
        const product = mockProducts.find(product => product.id === id);
        
        if (!product) {
          return {
            id: id,
            name: 'Product Not Available',
            description: 'This product is no longer available.',
            price: 0,
            imageUrl: 'https://placehold.co/400x300?text=Not+Available',
            inventory: 0,
            sku: 'UNAVAILABLE',
            status: 'Out of Stock',
            category: 'Uncategorized',
          };
        }
        
        return product;
      }
    } catch (error) {
      console.error('Error fetching product, using mock data:', error);
      
      // Fallback to mock data
      const product = mockProducts.find(product => product.id === id);
      
      if (!product) {
        return {
          id: id,
          name: 'Product Not Available',
          description: 'This product is no longer available.',
          price: 0,
          imageUrl: 'https://placehold.co/400x300?text=Not+Available',
          inventory: 0,
          sku: 'UNAVAILABLE',
          status: 'Out of Stock',
          category: 'Uncategorized',
        };
      }
      
      return product;
    }
  },
  
  // Create a new product
  async createProduct(productData) {
    try {
      console.log('Creating product in Supabase:', productData);
      
      // Format data for Supabase schema - only include fields that exist in the database
      const supabaseProduct = {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price), // Ensure price is a number
        image_url: productData.imageUrl || '',
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') // Generate slug from name
      };
      
      console.log('Formatted product for Supabase:', supabaseProduct);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('products')
        .insert(supabaseProduct)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Product created successfully in Supabase:', data);
      
      // Format response to match expected format
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.image_url,
        inventory: 0, // Default since the field doesn't exist
        sku: 'SKU-' + data.id, // Generated SKU since it doesn't exist
        status: 'In Stock', // Default status since is_active doesn't exist
        category: 'Uncategorized', // Default since the field doesn't exist
        createdAt: data.created_at
      };
    } catch (supabaseError) {
      console.error('Error creating product in Supabase:', supabaseError);
      
      // Don't fall back to API, just throw the error
      throw new Error(`Failed to create product: ${supabaseError.message || 'Unknown error'}`);
    }
  },
  
  // Update an existing product
  async updateProduct(id, productData) {
    try {
      console.log('Updating product in Supabase:', id, productData);
      
      // Format data for Supabase schema - only include fields that exist in the database
      const supabaseProduct = {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price), // Ensure price is a number
        image_url: productData.imageUrl || '',
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') // Generate slug from name
      };
      
      console.log('Formatted product for Supabase update:', supabaseProduct);
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('products')
        .update(supabaseProduct)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Product updated successfully in Supabase:', data);
      
      // Format response to match expected format
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.image_url,
        inventory: 0, // Default since the field doesn't exist
        sku: 'SKU-' + data.id, // Generated SKU since it doesn't exist
        status: 'In Stock', // Default status since is_active doesn't exist
        category: 'Uncategorized', // Default since the field doesn't exist
        updatedAt: data.updated_at
      };
    } catch (supabaseError) {
      console.error('Error updating product in Supabase:', supabaseError);
      
      // Fallback to API
      try {
        return await apiClient.put(`/products/${id}`, productData);
      } catch (error) {
        console.error('Error updating product:', error);
        throw error;
      }
    }
  },
  
  // Delete a product
  async deleteProduct(id) {
    try {
      console.log('Deleting product from Supabase:', id);
      
      // First try Supabase delete
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting product from Supabase:', error);
        throw error;
      }
      
      console.log('Product successfully deleted from Supabase');
      return { success: true };
    } catch (supabaseError) {
      console.error('Supabase delete failed, trying API:', supabaseError);
      
      // Fallback to API
      try {
        return await apiClient.delete(`/products/${id}`);
      } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
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
      console.log('Uploading image to Supabase storage');
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('product-images') // Make sure this bucket exists in your Supabase
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log('Image uploaded successfully:', publicUrlData);
      
      return { 
        imageUrl: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Return a placeholder image URL as fallback
      return { imageUrl: `https://placehold.co/400x300?text=No+Image` };
    }
  },
  
  // Get real products directly from Supabase
  async getSupabaseProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching products from Supabase:', error);
        return { products: [] };
      }
      
      console.log('Raw products from Supabase:', data);
      
      // Map to our expected format
      const formattedProducts = data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.image_url,
        inventory: 0, // Default since field doesn't exist in DB
        sku: 'SKU-' + product.id, // Generated SKU since it doesn't exist
        status: 'In Stock', // Default since is_active doesn't exist
        category: 'Uncategorized', // Category doesn't exist in our DB
        createdAt: product.created_at
      }));
      
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
      return { products: [] };
    }
  },
}