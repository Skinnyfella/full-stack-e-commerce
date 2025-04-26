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
    status: product?.status || 'Unknown',
    description: product?.description || 'No description available',
    imageUrl: product?.imageUrl || 'https://placehold.co/400x300?text=No+Image',
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
        return <span className="badge badge-success">In Stock</span>
      case 'Low Stock':
        return <span className="badge badge-warning">Low Stock</span>
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
        <div className="mt-1 flex justify-between">
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
            <button className="btn-primary w-full">
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard