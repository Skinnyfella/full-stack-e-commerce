import ProductCard from './ProductCard'
import EmptyState from '../common/EmptyState'
import { FiPackage } from 'react-icons/fi'

function ProductGrid({ products = [], loading = false }) {
  // Filter out any null or undefined products
  const validProducts = Array.isArray(products) 
    ? products.filter(product => product != null)
    : [];
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-5 w-3/4 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 w-1/2 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 w-full rounded mb-4"></div>
            <div className="bg-gray-200 h-10 w-full rounded"></div>
          </div>
        ))}
      </div>
    )
  }
  
  if (validProducts.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="There are no products available with the current filters."
        icon={FiPackage}
      />
    )
  }
  
  return (
    <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
      {validProducts.map((product) => (
        <ProductCard 
          key={product.id || `product-${Math.random().toString(36).substr(2, 9)}`} 
          product={product} 
        />
      ))}
    </div>
  )
}

export default ProductGrid