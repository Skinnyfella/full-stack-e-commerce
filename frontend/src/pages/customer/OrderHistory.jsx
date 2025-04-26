import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { orderService } from '../../services/orderService'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { FiShoppingBag, FiPackage, FiTruck, FiCheck, FiX } from 'react-icons/fi'

function OrderHistory() {
  const { user } = useAuth()
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Get the new order ID from the URL if it exists
  const newOrderId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get('new')
  }, [location.search])
  
  // Load customer orders
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      try {
        if (user) {
          const data = await orderService.getCustomerOrders(user.id, {
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })
          setOrders(data.orders || [])
          
          // Show a success toast if there's a new order in the URL
          if (newOrderId) {
            toast.success('Order placed successfully!')
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error)
        toast.error('Failed to load orders')
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadOrders()
  }, [user, newOrderId])
  
  // Function to get icon based on order status
  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <FiShoppingBag className="h-5 w-5 text-yellow-500" />
      case 'Processing':
        return <FiPackage className="h-5 w-5 text-blue-500" />
      case 'Shipped':
        return <FiTruck className="h-5 w-5 text-purple-500" />
      case 'Delivered':
        return <FiCheck className="h-5 w-5 text-success-500" />
      case 'Cancelled':
        return <FiX className="h-5 w-5 text-error-500" />
      default:
        return <FiShoppingBag className="h-5 w-5 text-gray-500" />
    }
  }
  
  // Function to get class for status badge
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
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-200 rounded-lg mb-4 h-48"></div>
        ))}
      </div>
    )
  }
  
  return (
    <div>
      <PageHeader 
        title="Your Orders" 
        subtitle={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
      />
      
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place orders, they will appear here."
          icon={FiShoppingBag}
          action="/"
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white shadow overflow-hidden sm:rounded-lg ${
                order.id === newOrderId ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Order {order.id}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center">
                  {getOrderStatusIcon(order.status)}
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">${order.total.toFixed(2)}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </dd>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Order Items</h4>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-3 flex items-center">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="ml-3 flex-grow">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Action buttons based on order status */}
                <div className="mt-6 flex justify-end space-x-3">
                  {order.status === 'Pending' && (
                    <button 
                      type="button" 
                      className="btn-danger"
                      onClick={() => toast.error('Cancellation is disabled in this demo')}
                    >
                      Cancel Order
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => toast.success('This would open order details in a real app')}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderHistory