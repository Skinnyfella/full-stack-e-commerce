import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'

// Import icons
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiUsers,
  FiList,
  FiBarChart2,
  FiSettings,
  FiHelpCircle
} from 'react-icons/fi'

function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  
  // Determine if a nav item is active
  const isActive = (path) => {
    if (path === '/admin' || path === '/') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }
  
  // Define navigation items based on user role
  const navigation = user?.role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/admin', icon: FiBarChart2 },
        { name: 'Products', path: '/admin/products', icon: FiPackage },
        { name: 'Orders', path: '/admin/orders', icon: FiShoppingCart },
      ]
    : [
        { name: 'Browse Products', path: '/', icon: FiHome },
        { name: 'My Cart', path: '/cart', icon: FiShoppingCart },
        { name: 'My Orders', path: '/orders', icon: FiList },
      ]
  
  // Optional navigation items (could be shown for both roles or customized)
  const secondaryNavigation = [
    { name: 'Help', path: '/help', icon: FiHelpCircle },
  ]
  
  return (
    <div className="flex flex-col flex-grow bg-primary-700 pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <span className="text-white text-xl font-bold">Inventory Pro</span>
      </div>
      <div className="mt-5 flex-grow flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {/* Main navigation items */}
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive(item.path)
                  ? 'bg-primary-800 text-white'
                  : 'text-primary-100 hover:bg-primary-600 hover:text-white'
              )}
            >
              <item.icon 
                className={cn(
                  'mr-3 flex-shrink-0 h-6 w-6',
                  isActive(item.path)
                    ? 'text-primary-300'
                    : 'text-primary-300 group-hover:text-primary-200'
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Secondary navigation */}
        <div className="mt-6 pt-6 border-t border-primary-600">
          <nav className="px-2 space-y-1">
            {secondaryNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-primary-100 hover:bg-primary-600 hover:text-white"
              >
                <item.icon 
                  className="mr-3 flex-shrink-0 h-6 w-6 text-primary-300 group-hover:text-primary-200"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Sidebar