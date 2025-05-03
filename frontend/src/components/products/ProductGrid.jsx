import ProductCard from './ProductCard'
import EmptyState from '../common/EmptyState'
import { FiPackage } from 'react-icons/fi'

function ProductGrid({ products = [], loading = false }) {
  // Filter out any invalid products
  const validProducts = Array.isArray(products) 
    ? products.filter(product => product != null)
    : []

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse bg-white rounded-lg p-4 shadow">
            <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="bg-gray-200 h-5 w-3/4 rounded"></div>
              <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
              <div className="bg-gray-200 h-4 w-full rounded"></div>
              <div className="bg-gray-200 h-10 w-full rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (validProducts.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your filters or search terms."
        icon={FiPackage}
      />
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {validProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default ProductGrid