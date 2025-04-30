import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function ProductCard({ product }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  // Ensure product has expected properties with fallbacks
  const safeProduct = {
    id: product?.id || 'unknown',
    name: product?.name || 'Unnamed Product',
    price: product?.price || 0,
    inventory: product?.inventory || 0,
    description: product?.description || 'No description available',
    imageUrl: product?.imageUrl || 'https://placehold.co/400x300?text=No+Image',
    ...product
  }

  // Calculate status based on inventory
  const calculateStatus = (inventory) => {
    if (!inventory || inventory === 0) return 'Out of Stock';
    if (inventory <= 20) return 'Low Stock';
    return 'In Stock';
  };
  
  const status = calculateStatus(safeProduct.inventory);
  
  const handleClick = () => {
    if (isAdmin) {
      navigate(`/admin/products/edit/${safeProduct.id}`)
    } else {
      navigate(`/products/${safeProduct.id}`)
    }
  }
  
  // Function to show product status with the right color
  const getStatusBadge = () => {
    switch(status) {
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
    <div 
      className="card transition-transform duration-200 hover:shadow-lg cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="aspect-w-3 aspect-h-2 w-full overflow-hidden bg-gray-200">
        <img 
          src={safeProduct.imageUrl} 
          alt={safeProduct.name}
          className="h-48 w-full object-cover transition-transform hover:scale-105 duration-200"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x300?text=No+Image';
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {safeProduct.name}
        </h3>
        <div className="mt-1 flex justify-between items-center">
          <p className="text-lg font-medium text-gray-900">${formatPrice(safeProduct.price)}</p>
          {getStatusBadge()}
        </div>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {safeProduct.description}
        </p>
        <div className="mt-4">
          {isAdmin ? (
            <button className="btn-secondary w-full">
              Edit Product
            </button>
          ) : (
            <button 
              className={`btn-primary w-full ${status === 'Out of Stock' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={status === 'Out of Stock'}
            >
              {status === 'Out of Stock' ? 'Out of Stock' : 'View Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard