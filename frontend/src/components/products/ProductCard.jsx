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
    <div 
      className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
      onClick={handleClick}
    >
      <div className="aspect-h-4 aspect-w-3 bg-gray-200 sm:aspect-none group-hover:opacity-75 sm:h-96">
        <img
          src={safeProduct.imageUrl}
          alt={safeProduct.name}
          className="h-full w-full object-cover object-center sm:h-full sm:w-full"
        />
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-sm font-medium text-gray-900">
          {safeProduct.name}
        </h3>
        <p className="text-base font-medium text-gray-900">
          ${formatPrice(safeProduct.price)}
        </p>
        {getStatusBadge()}
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
              className={`btn-primary w-full ${safeProduct.status === 'Out of Stock' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={safeProduct.status === 'Out of Stock'}
            >
              {safeProduct.status === 'Out of Stock' ? 'Out of Stock' : 'View Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard