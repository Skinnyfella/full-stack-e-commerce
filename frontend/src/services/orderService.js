// Mock order service
// In a real application, this would make API calls to your backend

import { apiClient } from './api';

// Generate sample orders
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

// Mock order data
let mockOrders = generateMockOrders()

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const orderService = {
  // Get all orders with pagination, sorting, and filtering
  async getOrders(params = {}) {
    try {
      return await apiClient.get('/orders', params);
    } catch (error) {
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
  },
  
  // Get a single order by ID
  async getOrderById(id) {
    try {
      return await apiClient.get(`/orders/${id}`);
    } catch (error) {
      console.log('Error fetching order from API, using mock data');
      
      // Fallback to mock data
      const order = mockOrders.find(order => order.id === id);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    }
  },
  
  // Get orders for a specific customer
  async getCustomerOrders(customerId, params = {}) {
    try {
      const allParams = {
        ...params,
        customerId
      };
      
      return await apiClient.get('/orders', allParams);
    } catch (error) {
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
  },
  
  // Create a new order
  async createOrder(orderData) {
    try {
      return await apiClient.post('/orders', orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  // Update an order's status
  async updateOrderStatus(id, status) {
    try {
      return await apiClient.put(`/orders/${id}/status`, { status });
    } catch (error) {
      console.log('Error updating order status, simulating success');
      
      // Update mock order
      const orderIndex = mockOrders.findIndex(order => order.id === id);
      if (orderIndex !== -1) {
        mockOrders[orderIndex].status = status;
      }
      
      return { success: true };
    }
  },
  
  // Get order statistics (for admin dashboard)
  async getOrderStats() {
    try {
      return await apiClient.get('/orders/stats');
    } catch (error) {
      console.log('Error fetching order stats, using mock data');
      
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