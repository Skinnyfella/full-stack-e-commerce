import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { orderService } from '../../services/orderService'
import PageHeader from '../../components/common/PageHeader'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import { FiShoppingBag } from 'react-icons/fi'

function OrderList() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filterParams, setFilterParams] = useState({
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // Load orders
  const loadOrders = async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await orderService.getOrders({
        page,
        limit: pagination.limit,
        ...filterParams
      })
      
      setOrders(data.orders || [])
      setPagination({
        page: page,
        limit: pagination.limit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      })
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initial load
  useEffect(() => {
    loadOrders()
  }, [])
  
  // Handle pagination change
  const handlePageChange = (page) => {
    loadOrders(page)
  }
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilterParams({
      ...filterParams,
      [name]: value
    })
  }
  
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(':')
    setFilterParams({
      ...filterParams,
      sortBy,
      sortOrder
    })
  }
  
  const handleFilterSubmit = (e) => {
    e.preventDefault()
    loadOrders(1) // Reset to first page when filtering
  }
  
  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success(`Order status updated to ${newStatus}`)
      // Refresh the orders list
      loadOrders(pagination.page)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }
  
  // Function to get style for status badge
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Processing':
        return 'bg-blue-100 text-blue-800'
      case 'Shipped':
        return 'bg-purple-100 text-purple-800'
      case 'Delivered':
        return 'bg-success-100 text-success-800'
      case 'Cancelled':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="bg-gray-200 h-20 w-full rounded-lg mb-4"></div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-gray-200 h-16 w-full rounded-lg mb-4"></div>
        ))}
      </div>
    )
  }
  
  return (
    <div>
      <PageHeader 
        title="Orders" 
        subtitle={`${pagination?.total || 0} total orders`}
      />
      
      {/* Filters */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="status" className="label">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="input"
                value={filterParams.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="startDate" className="label">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="input"
                value={filterParams.startDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="endDate" className="label">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="input"
                value={filterParams.endDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="sort" className="label">
                Sort By
              </label>
              <select
                id="sort"
                name="sort"
                className="input"
                value={`${filterParams.sortBy}:${filterParams.sortOrder}`}
                onChange={handleSortChange}
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="total:desc">Amount (High to Low)</option>
                <option value="total:asc">Amount (Low to High)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="btn-secondary mr-3"
              onClick={() => {
                setFilterParams({
                  status: '',
                  startDate: '',
                  endDate: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })
              }}
            >
              Reset
            </button>
            <button type="submit" className="btn-primary">
              Filter
            </button>
          </div>
        </form>
      </div>
      
      {/* Order list */}
      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="No orders match your current filters."
          icon={FiShoppingBag}
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {order.id}
                      </p>
                      <p className="ml-4 text-sm text-gray-500 truncate">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <select
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${getStatusBadgeClass(order.status)}`}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Customer: {order.customerName}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p className="font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Order items */}
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Order Items</h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="px-4 py-3 border-t border-gray-200">
            <Pagination 
              pagination={pagination} 
              onPageChange={handlePageChange} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderList