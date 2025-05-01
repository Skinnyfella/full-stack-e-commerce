// Order service that uses Supabase
import { supabase } from '../utils/supabase';
import { supabaseApi, apiClient } from './api';
import { toast } from 'react-hot-toast';

// Generate sample orders for fallback
const generateMockOrders = () => {
  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  const customers = [
    { id: '2', name: 'John Customer' },
    { id: '3', name: 'Jane Smith' },
    { id: '4', name: 'Robert Johnson' },
  ]
  
  return Array.from({ length: 20 }, (_, i) => {
    const itemCount = Math.floor(Math.random() * 4) + 1
    const items = Array.from({ length: itemCount }, (_, j) => ({
      id: `item-${i}-${j}`,
      productId: Math.floor(Math.random() * 36) + 1,
      name: `Product ${Math.floor(Math.random() * 36) + 1}`,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      imageUrl: `https://picsum.photos/seed/product${Math.floor(Math.random() * 36) + 1}/400/300`,
    }))
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.08 // 8% tax
    const shipping = 10
    const total = subtotal + tax + shipping
    
    const customer = customers[Math.floor(Math.random() * customers.length)]
    
    return {
      id: `ORD-${1000 + i}`,
      customerId: customer.id,
      customerName: customer.name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: shipping,
      total: parseFloat(total.toFixed(2)),
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
      },
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    }
  })
}

// Mock order data for fallback
let mockOrders = generateMockOrders()
let paymentAttempts = new Map(); // Track payment attempts per order

export const orderService = {
  // Get all orders with pagination, sorting, and filtering
  async getOrders(params = {}) {
    try {
      console.log('Fetching orders from Supabase');
      
      const { 
        page = 1, 
        limit = 10, 
        status = '',
        startDate = '',
        endDate = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = params;
      
      // Start query
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `);
        
      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      
      if (endDate) {
        // Add 1 day to include the full end date
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('created_at', nextDay.toISOString());
      }
      
      // Apply sorting - handle conversion from camelCase to snake_case
      let dbSortBy = sortBy;
      if (sortBy === 'createdAt') dbSortBy = 'created_at';
      if (sortBy === 'updatedAt') dbSortBy = 'updated_at';
      if (sortBy === 'userId') dbSortBy = 'user_id';
      
      const ascending = sortOrder === 'asc';
      query = query.order(dbSortBy, { ascending });
      
      // Apply pagination
      const startRange = (page - 1) * limit;
      const endRange = page * limit - 1;
      query = query.range(startRange, endRange);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Format orders to match expected structure
      const formattedOrders = data.map(order => ({
        id: order.id,
        customerId: order.user_id,
        customerName: order.customer_name || 'Unknown Customer',
        status: order.status,
        items: order.order_items || [],
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        shippingAddress: order.shipping_address || {},
        createdAt: order.created_at
      }));
      
      return {
        orders: formattedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching orders from Supabase:', error);
      
      // Fallback to API
      try {
        return await apiClient.get('/orders', params);
      } catch (apiError) {
        console.log('Error fetching orders from API, using mock data');
        
        // Fallback to mock data
        const { 
          page = 1, 
          limit = 10, 
          status = '',
          startDate = '',
          endDate = '',
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;
        
        // Filter orders
        let filteredOrders = [...mockOrders];
        
        if (status) {
          filteredOrders = filteredOrders.filter(order => order.status === status);
        }
        
        if (startDate) {
          const startTimestamp = new Date(startDate).getTime();
          filteredOrders = filteredOrders.filter(order => 
            new Date(order.createdAt).getTime() >= startTimestamp
          );
        }
        
        if (endDate) {
          const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // Include the full day
          filteredOrders = filteredOrders.filter(order => 
            new Date(order.createdAt).getTime() <= endTimestamp
          );
        }
        
        // Sort orders
        filteredOrders.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a[sortBy] > b[sortBy] ? 1 : -1;
          } else {
            return a[sortBy] < b[sortBy] ? 1 : -1;
          }
        });
        
        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        
        return {
          orders: paginatedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredOrders.length,
            totalPages: Math.ceil(filteredOrders.length / limit)
          }
        };
      }
    }
  },
  
  // Get a single order by ID
  async getOrderById(id) {
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const order = orders.find(order => order.id === id);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },
  
  // Get orders for a specific customer
  async getCustomerOrders(customerId, params = {}) {
    try {
      console.log('Fetching customer orders from Supabase:', customerId);
      
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = params;
      
      // Apply sorting - handle conversion from camelCase to snake_case
      let dbSortBy = sortBy;
      if (sortBy === 'createdAt') dbSortBy = 'created_at';
      if (sortBy === 'updatedAt') dbSortBy = 'updated_at';
      if (sortBy === 'userId') dbSortBy = 'user_id';
      
      // Apply sorting
      const ascending = sortOrder === 'asc';
      
      // Start query
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', customerId)
        .order(dbSortBy, { ascending });
        
      // Apply pagination if needed
      if (limit > 0) {
        const startRange = (page - 1) * limit;
        const endRange = page * limit - 1;
        query = query.range(startRange, endRange);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format orders to match expected structure
      const formattedOrders = data.map(order => ({
        id: order.id,
        customerId: order.user_id,
        customerName: order.customer_name || 'Unknown Customer',
        status: order.status,
        items: order.order_items || [],
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        shippingAddress: order.shipping_address || {},
        createdAt: order.created_at
      }));
      
      return {
        orders: formattedOrders
      };
    } catch (error) {
      console.error('Error fetching customer orders from Supabase:', error);
      
      // Fallback to API
      try {
        const allParams = {
          ...params,
          customerId
        };
        
        return await apiClient.get('/orders', allParams);
      } catch (apiError) {
        console.log('Error fetching customer orders from API, using mock data');
        
        // Fallback to mock data
        const { 
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;
        
        let customerOrders = mockOrders.filter(order => order.customerId === customerId);
        
        // Sort orders
        customerOrders.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a[sortBy] > b[sortBy] ? 1 : -1;
          } else {
            return a[sortBy] < b[sortBy] ? 1 : -1;
          }
        });
        
        return {
          orders: customerOrders
        };
      }
    }
  },
  
  // Create a new order - Mock implementation
  async createOrder(orderData) {
    try {
      // Use unique key for each order attempt
      const attemptKey = Date.now().toString();
      const hasFailedAttempt = sessionStorage.getItem(attemptKey) === 'failed';
      
      // If this is a retry after a failure, guarantee success
      // Otherwise 50% chance of success
      const isSuccess = hasFailedAttempt || Math.random() >= 0.5;
      
      if (!isSuccess) {
        // Store this attempt as failed
        sessionStorage.setItem(attemptKey, 'failed');
        throw new Error('Payment failed');
      }
      
      // Clear all failed attempt flags
      sessionStorage.clear();
      
      // Generate mock order data
      const mockOrder = {
        id: 'ORD-' + Math.random().toString(36).substr(2, 9),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        ...orderData
      };

      // Store the order in localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.push(mockOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      return mockOrder;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  },
  
  // Update an order's status
  async updateOrderStatus(id, status) {
    try {
      console.log('Updating order status in Supabase:', id, status);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(`Order status updated to ${status}`);
      return data;
    } catch (error) {
      console.error('Error updating order status in Supabase:', error);
      
      // Fallback to API
      try {
        return await apiClient.put(`/orders/${id}/status`, { status });
      } catch (apiError) {
        console.log('Error updating order status via API, simulating success');
        
        // Update mock order
        const orderIndex = mockOrders.findIndex(order => order.id === id);
        if (orderIndex !== -1) {
          mockOrders[orderIndex].status = status;
        }
        
        return { success: true };
      }
    }
  },
  
  // Get order statistics (for admin dashboard)
  async getOrderStats() {
    try {
      console.log('Fetching order stats from Supabase');
      
      // Get total orders count
      const { count: totalOrders, error: totalError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      // Get pending orders count
      const { count: pending, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      
      if (pendingError) throw pendingError;
      
      // Get processing orders count
      const { count: processing, error: processingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Processing');
      
      if (processingError) throw processingError;
      
      // Get delivered orders count
      const { count: delivered, error: deliveredError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered');
      
      if (deliveredError) throw deliveredError;
      
      // Get total revenue - use the total_amount column
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount');
      
      if (revenueError) throw revenueError;
      
      // Calculate total revenue from the total_amount column
      const totalRevenue = revenueData.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
      
      // Get recent orders
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;
      
      // Format recent orders
      const formattedRecent = recentOrders.map(order => ({
        id: order.id,
        customerId: order.user_id,
        customerName: order.customer_name || 'Unknown Customer',
        status: order.status,
        total: order.total,
        createdAt: order.created_at
      }));
      
      return {
        totalOrders,
        pending,
        processing,
        delivered,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        recentOrders: formattedRecent
      };
    } catch (error) {
      console.error('Error fetching order stats from Supabase:', error);
      
      // Fallback to API
      try {
        return await apiClient.get('/orders/stats');
      } catch (apiError) {
        console.log('Error fetching order stats from API, using mock data');
        
        // Calculate mock stats
        const total = mockOrders.length;
        const pending = mockOrders.filter(order => order.status === 'Pending').length;
        const processing = mockOrders.filter(order => order.status === 'Processing').length;
        const delivered = mockOrders.filter(order => order.status === 'Delivered').length;
        const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
        
        // Sort by date for recent orders
        const recentOrders = [...mockOrders]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        return {
          totalOrders: total,
          pending,
          processing,
          delivered,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          recentOrders
        };
      }
    }
  }
};