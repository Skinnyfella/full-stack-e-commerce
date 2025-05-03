import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { productService } from '../../services/productService'
import PageHeader from '../../components/common/PageHeader'
import ProductGrid from '../../components/products/ProductGrid'
import Pagination from '../../components/common/Pagination'
import { FiGrid, FiList, FiFilter } from 'react-icons/fi'

function ProductCatalog() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterParams, setFilterParams] = useState({
    search: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    priceRange: { min: '', max: '' }
  })
  const [categories, setCategories] = useState([])

  // Memoized filter function
  const filterProducts = useCallback((products, filters) => {
    return products.filter(product => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false
      }

      // Price range filter
      if (filters.priceRange.min && parseFloat(product.price) < parseFloat(filters.priceRange.min)) {
        return false
      }
      if (filters.priceRange.max && parseFloat(product.price) > parseFloat(filters.priceRange.max)) {
        return false
      }

      return true
    })
  }, [])

  // Sort function
  const sortProducts = useCallback((products, sortBy, sortOrder) => {
    return [...products].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'price':
          comparison = parseFloat(a.price) - parseFloat(b.price)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        default:
          comparison = new Date(b.createdAt) - new Date(a.createdAt)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [])

  const loadProducts = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const supabaseData = await productService.getSupabaseProducts()
      
      if (supabaseData.products.length > 0) {
        const filteredProducts = filterProducts(supabaseData.products, filterParams)
        const sortedProducts = sortProducts(filteredProducts, filterParams.sortBy, filterParams.sortOrder)
        
        const startIndex = (page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        const paginatedProducts = sortedProducts.slice(startIndex, endIndex)
        
        setProducts(paginatedProducts)
        setPagination({
          page: parseInt(page),
          limit: pagination.limit,
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / pagination.limit)
        })
      } else {
        const data = await productService.getProducts({
          page,
          limit: pagination.limit,
          ...filterParams
        })
        setProducts(data.products || [])
        setPagination({
          page: data?.pagination?.page || page,
          limit: data?.pagination?.limit || pagination.limit,
          total: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 1
        })
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
      toast.error('Failed to load products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [filterParams, pagination.limit, filterProducts, sortProducts])

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts])

  const loadCategories = async () => {
    try {
      const data = await productService.getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories(['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys'])
    }
  }

  const handlePageChange = (page) => {
    loadProducts(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (e) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFilterParams(prev => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          [name]: value
        }
      }))
    } else {
      setFilterParams(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(':')
    setFilterParams(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }))
  }

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    loadProducts(1)
    setIsFilterOpen(false)
  }

  const resetFilters = () => {
    setFilterParams({
      search: '',
      category: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      priceRange: { min: '', max: '' }
    })
    loadProducts(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Browse Products" 
        subtitle="Find what you need for your business"
        action={
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <FiFilter className="-ml-1 mr-2 h-5 w-5" />
            Filters
          </button>
        }
      />
      
      {/* Filters panel */}
      <div className={`${isFilterOpen ? 'block' : 'hidden'} bg-white shadow-lg rounded-lg mb-6 p-6`}>
        <form onSubmit={handleFilterSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                name="search"
                id="search"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Search products..."
                value={filterParams.search}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={filterParams.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="min" className="block text-sm font-medium text-gray-700">
                Min Price
              </label>
              <input
                type="number"
                name="min"
                id="min"
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={filterParams.priceRange.min}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label htmlFor="max" className="block text-sm font-medium text-gray-700">
                Max Price
              </label>
              <input
                type="number"
                name="max"
                id="max"
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={filterParams.priceRange.max}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                id="sort"
                name="sort"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={`${filterParams.sortBy}:${filterParams.sortOrder}`}
                onChange={handleSortChange}
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="price:asc">Price (Low to High)</option>
                <option value="price:desc">Price (High to Low)</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                onClick={resetFilters}
              >
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button 
                onClick={() => loadProducts(pagination.page)} 
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="bg-white shadow-sm rounded-lg min-h-[400px]">
        <ProductGrid products={products} loading={isLoading} />
      </div>

      {/* Pagination */}
      {!isLoading && products.length > 0 && (
        <div className="mt-6 pb-6">
          <Pagination 
            pagination={pagination} 
            onPageChange={handlePageChange} 
          />
        </div>
      )}
    </div>
  )
}

export default ProductCatalog