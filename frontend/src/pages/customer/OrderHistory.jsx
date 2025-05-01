import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { FiPackage } from 'react-icons/fi'

function OrderHistory() {
  const [orders, setOrders] = useState([])
  const location = useLocation()

  useEffect(() => {
    // Load orders from localStorage
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    setOrders(savedOrders)

    // Check for new order from URL parameter
    const params = new URLSearchParams(location.search)
    const newOrderId = params.get('new')
    if (newOrderId) {
      // Scroll to the new order if it exists
      setTimeout(() => {
        const element = document.getElementById(newOrderId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
          element.classList.add('highlight-order')
        }
      }, 100)
    }
  }, [location])

  if (orders.length === 0) {
    return (
      <div>
        <PageHeader 
          title="Order History" 
          subtitle="View your past orders"
        />
        <EmptyState
          title="No orders yet"
          description="Your ordered items will appear here"
          icon={FiPackage}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title="Order History" 
        subtitle={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
      />

      <div className="space-y-6">
        {orders.map((order) => (
          <div 
            key={order.id}
            id={order.id}
            className="bg-white shadow overflow-hidden sm:rounded-lg transition-all duration-300"
          >
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Order {order.id}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {order.status}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Order Total</dt>
                  <dd className="mt-1 text-sm text-gray-900">${order.total.toFixed(2)}</dd>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Order Items</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item.productId} className="py-3 flex items-center">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Subtotal</p>
                  <p className="text-gray-900">${order.subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Tax</p>
                  <p className="text-gray-900">${order.tax.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Shipping</p>
                  <p className="text-gray-900">${order.shipping.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
                  <p className="text-gray-900">Total</p>
                  <p className="text-gray-900">${order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderHistory