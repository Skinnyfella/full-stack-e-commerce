import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { productService } from '../../services/productService'
import PageHeader from '../../components/common/PageHeader'
import ProductTable from '../../components/products/ProductTable'

function ProductList() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    search: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [categories, setCategories] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  
  // Load products
  const loadProducts = async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await productService.getProducts({
        page,
        limit: pagination.limit,
        ...searchParams
      })
      
      setProducts(data.products || [])
      setPagination({
        page: page,
        limit: pagination.limit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      })
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load categories for filter
  const loadCategories = async () => {
    try {
      const data = await productService.getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    }
  }
  
  // Initial load
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])
  
  // Handle pagination change
  const handlePageChange = (page) => {
    loadProducts(page)
  }
  
  // Handle search and filter changes
  const handleSearchChange = (e) => {
    setSearchParams({
      ...searchParams,
      search: e.target.value
    })
  }
  
  const handleCategoryChange = (e) => {
    setSearchParams({
      ...searchParams,
      category: e.target.value
    })
  }
  
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(':')
    setSearchParams({
      ...searchParams,
      sortBy,
      sortOrder
    })
  }
  
  const handleFilterSubmit = (e) => {
    e.preventDefault()
    loadProducts(1) // Reset to first page when filtering
  }
  
  // Handle product deletion
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId)
        toast.success('Product deleted successfully')
        // Reload products
        loadProducts(pagination.page)
      } catch (error) {
        console.error('Error deleting product:', error)
        toast.error('Failed to delete product')
      }
    }
  }
  
  // Action button for header
  const actionButton = (
    <Link to="/admin/products/create" className="btn-primary inline-flex items-center">
      <FiPlus className="-ml-1 mr-2 h-5 w-5" />
      Add Product
    </Link>
  )
  
  return (
    <div>
      <PageHeader 
        title="Products" 
        subtitle={`${pagination?.total || 0} total products`}
        action={actionButton}
      />
      
      {/* Filters */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="search" className="label">
                Search
              </label>
              <input
                type="text"
                name="search"
                id="search"
                className="input"
                placeholder="Search products..."
                value={searchParams.search}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="category" className="label">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="input"
                value={searchParams.category}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="sort" className="label">
                Sort By
              </label>
              <select
                id="sort"
                name="sort"
                className="input"
                value={`${searchParams.sortBy}:${searchParams.sortOrder}`}
                onChange={handleSortChange}
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="price:asc">Price (Low to High)</option>
                <option value="price:desc">Price (High to Low)</option>
                <option value="inventory:asc">Inventory (Low to High)</option>
                <option value="inventory:desc">Inventory (High to Low)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="btn-secondary mr-3"
              onClick={() => {
                setSearchParams({
                  search: '',
                  category: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })
              }}
            >
              Reset
            </button>
            <button type="submit" className="btn-primary">
              Filter
            </button>
          </div>
        </form>
      </div>
      
      {/* Product table */}
      <div className="mt-6">
        <ProductTable 
          products={products}
          isLoading={isLoading}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={(newLimit) => {
            setPagination({
              ...pagination,
              limit: newLimit,
              page: 1
            })
            loadProducts(1)
          }}
        />
      </div>
    </div>
  )
}

export default ProductList