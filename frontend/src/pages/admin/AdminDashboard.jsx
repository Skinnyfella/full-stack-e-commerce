import { useState, useEffect } from 'react'
import { FiShoppingBag, FiDollarSign, FiTruck, FiUsers } from 'react-icons/fi'
import { productService } from '../../services/productService'
import { orderService } from '../../services/orderService'
import PageHeader from '../../components/common/PageHeader'

function StatsCard({ title, value, description, icon: Icon, change, changeType }) {
  const changeColor = changeType === 'increase' 
    ? 'text-success-600' 
    : changeType === 'decrease' 
      ? 'text-error-600' 
      : 'text-gray-500'
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className={`font-medium ${changeColor} mr-2`}>
            {change}
          </span>
          <span className="text-gray-500">{description}</span>
        </div>
      </div>
    </div>
  )
}

function RecentOrdersTable({ orders = [] }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
      </div>
      <div className="border-t border-gray-200 overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent orders found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'Delivered' ? 'bg-success-100 text-success-800' : 
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Cancelled' ? 'bg-error-100 text-error-800' :
                        'bg-blue-100 text-blue-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function LowStockProductsTable({ products = [] }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Low Stock Products</h3>
      </div>
      <div className="border-t border-gray-200 overflow-x-auto">
        {products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No low stock products found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl} alt={product.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                      {product.inventory} left
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    lowStockProducts: []
  })

  useEffect(() => {
    // Create an AbortController for cleanup
    const controller = new AbortController();

    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Load all data in parallel
        const [orderStats, orderData, productData] = await Promise.all([
          orderService.getOrderStats(),
          orderService.getOrders({ 
            page: 1, 
            limit: 5, 
            sortBy: 'createdAt', 
            sortOrder: 'desc' 
          }),
          productService.getProducts()
        ]);

        // Process low stock products
        const lowStockProducts = (productData.products || [])
          .filter(product => product.status === 'Low Stock' || product.inventory < 10)
          .slice(0, 5);

        setDashboardData({
          stats: orderStats || { totalOrders: 0, totalRevenue: 0 },
          recentOrders: orderData.orders || [],
          lowStockProducts
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setDashboardData({
          stats: { totalOrders: 0, totalRevenue: 0 },
          recentOrders: [],
          lowStockProducts: []
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    
    loadDashboardData();

    // Cleanup function to cancel ongoing requests
    return () => controller.abort();
  }, [])
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg h-32"></div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg h-96"></div>
          <div className="bg-white shadow rounded-lg h-96"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of your inventory and order statistics" 
      />
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Orders" 
          value={dashboardData.stats?.totalOrders || 0} 
          description="this month" 
          icon={FiShoppingBag}
          change="+4.75%"
          changeType="increase"
        />
        <StatsCard 
          title="Total Revenue" 
          value={formatCurrency(dashboardData.stats?.totalRevenue || 0)} 
          description="this month" 
          icon={FiDollarSign}
          change="+10.2%"
          changeType="increase"
        />
        <StatsCard 
          title="Pending Orders" 
          value={dashboardData.stats?.pending || 0} 
          description="to be processed" 
          icon={FiShoppingBag}
          change={dashboardData.stats?.pending > 5 ? "High" : "Low"}
          changeType={dashboardData.stats?.pending > 5 ? "increase" : "neutral"}
        />
        <StatsCard 
          title="Orders Delivered" 
          value={dashboardData.stats?.delivered || 0} 
          description="this month" 
          icon={FiTruck}
          change="+12.4%"
          changeType="increase"
        />
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentOrdersTable orders={dashboardData.recentOrders} />
        <LowStockProductsTable products={dashboardData.lowStockProducts} />
      </div>
    </div>
  )
}

export default AdminDashboard