import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function ProductCard({ product }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  // Ensure product has expected properties with fallbacks
  const safeProduct = {
    id: product?.id || 'not-found',
    name: product?.name || 'Product Not Available',
    price: product?.price || 0,
    inventory: product?.inventory || 0,
    description: product?.description || 'No description available',
    imageUrl: product?.imageUrl || 'https://placehold.co/400x300?text=No+Image',
    status: product?.status || 'Out of Stock',
    ...product
  }

  const handleClick = () => {
    if (isAdmin) {
      navigate(`/admin/products/edit/${safeProduct.id}`)
    } else {
      navigate(`/products/${safeProduct.id}`)
    }
  }
  
  // Function to show product status with the right color
  const getStatusBadge = () => {
    switch(safeProduct.status) {
      case 'In Stock':
        return <span className="badge badge-success">In Stock ({safeProduct.inventory})</span>
      case 'Low Stock':
        return <span className="badge badge-warning">Low Stock ({safeProduct.inventory} left)</span>
      case 'Out of Stock':
        return <span className="badge badge-error">Out of Stock</span>
      default:
        return null
    }
  }
  
  // Format price safely
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    } else if (typeof price === 'string' && !isNaN(parseFloat(price))) {
      return parseFloat(price).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="aspect-w-4 aspect-h-3">
        <img
          src={safeProduct.imageUrl}
          alt={safeProduct.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">
          {safeProduct.name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">
          {safeProduct.description}
        </p>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xl font-bold text-gray-900">
              ${formatPrice(safeProduct.price)}
            </p>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              safeProduct.status === 'In Stock' 
                ? 'bg-green-100 text-green-800'
                : safeProduct.status === 'Low Stock'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {safeProduct.status}
            </span>
          </div>
          
          <Link
            to={`/products/${safeProduct.id}`}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              safeProduct.status === 'Out of Stock'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
            disabled={safeProduct.status === 'Out of Stock'}
          >
            {safeProduct.status === 'Out of Stock' ? 'Out of Stock' : 'View Full Details'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProductCard