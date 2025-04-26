import { useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../common/Pagination'
import EmptyState from '../common/EmptyState'
import { FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi'

function ProductTable({ products, pagination, onPageChange, onDelete, loading = false }) {
  const [selectedProducts, setSelectedProducts] = useState([])
  
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map(product => product.id))
    } else {
      setSelectedProducts([])
    }
  }
  
  const toggleSelect = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }
  
  // Function to show product status with the right color
  const getStatusBadge = (status) => {
    switch(status) {
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
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-10 w-full rounded-lg mb-4"></div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-gray-200 h-16 w-full rounded-lg mb-4"></div>
        ))}
      </div>
    )
  }
  
  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Get started by adding a new product to your inventory."
        icon={FiPackage}
        action="/admin/products/create"
      />
    )
  }
  
  return (
    <div className="flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      onChange={toggleSelectAll}
                      checked={selectedProducts.length === products.length && products.length > 0}
                    />
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    SKU
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Inventory
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product) => (
                  <tr 
                    key={product.id} 
                    className={selectedProducts.includes(product.id) ? 'bg-gray-50' : undefined}
                  >
                    <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.imageUrl}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-gray-500">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${typeof product.price === 'number' 
                        ? product.price.toFixed(2) 
                        : (parseFloat(product.price) || 0).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {product.inventory}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FiEdit2 className="h-5 w-5" />
                          <span className="sr-only">Edit {product.name}</span>
                        </Link>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                          <span className="sr-only">Delete {product.name}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {pagination && (
        <div className="mt-4">
          <Pagination 
            pagination={pagination} 
            onPageChange={onPageChange} 
          />
        </div>
      )}
    </div>
  )
}

export default ProductTable