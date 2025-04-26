import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { productService } from '../../services/productService'
import PageHeader from '../../components/common/PageHeader'
import ProductGrid from '../../components/products/ProductGrid'
import Pagination from '../../components/common/Pagination'
import { FiGrid, FiList } from 'react-icons/fi'

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
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [filterParams, setFilterParams] = useState({
    search: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [categories, setCategories] = useState([])
  
  // Load products
  const loadProducts = async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      // Try loading from Supabase first
      const supabaseData = await productService.getSupabaseProducts();
      
      if (supabaseData.products.length > 0) {
        console.log('Loaded products from Supabase:', supabaseData.products.length);
        
        // Filter products based on current filters
        let filteredProducts = [...supabaseData.products];
        
        if (filterParams.search) {
          const searchLower = filterParams.search.toLowerCase();
          filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.sku && product.sku.toLowerCase().includes(searchLower))
          );
        }
        
        if (filterParams.category) {
          filteredProducts = filteredProducts.filter(product => 
            product.category === filterParams.category
          );
        }
        
        // Sort products
        filteredProducts.sort((a, b) => {
          const sortField = filterParams.sortBy;
          if (filterParams.sortOrder === 'asc') {
            return a[sortField] > b[sortField] ? 1 : -1;
          } else {
            return a[sortField] < b[sortField] ? 1 : -1;
          }
        });
        
        // Implement pagination
        const startIndex = (page - 1) * pagination.limit;
        const endIndex = page * pagination.limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        setProducts(paginatedProducts);
        setPagination({
          page: parseInt(page),
          limit: pagination.limit,
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / pagination.limit)
        });
        return;
      }
      
      // Fallback to regular API if no Supabase products
      const data = await productService.getProducts({
        page,
        limit: pagination.limit,
        ...filterParams
      })
      
      // Ensure data has expected format
      const safeData = {
        products: Array.isArray(data?.products) ? data.products : [],
        pagination: {
          page: data?.pagination?.page || page,
          limit: data?.pagination?.limit || pagination.limit,
          total: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 1
        }
      };
      
      setProducts(safeData.products)
      setPagination(safeData.pagination)
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
      toast.error('Failed to load products')
      
      // Set empty state to avoid rendering errors
      setProducts([])
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load categories for filter
  const loadCategories = async () => {
    try {
      const data = await productService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading categories:', error)
      // Set default categories if API fails
      setCategories(['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys'])
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
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Handle search and filter changes
  const handleSearchChange = (e) => {
    setFilterParams({
      ...filterParams,
      search: e.target.value
    })
  }
  
  const handleCategoryChange = (e) => {
    setFilterParams({
      ...filterParams,
      category: e.target.value
    })
  }
  
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(':')
    setFilterParams({
      ...filterParams,
      sortBy,
      sortOrder
    })
  }
  
  const handleFilterSubmit = (e) => {
    e.preventDefault()
    loadProducts(1) // Reset to first page when filtering
  }
  
  // View toggle buttons
  const ViewToggle = () => (
    <div className="flex space-x-2">
      <button
        type="button"
        className={`rounded-md p-2 ${
          viewMode === 'grid' 
            ? 'bg-primary-100 text-primary-600' 
            : 'bg-white text-gray-400 hover:bg-gray-50'
        }`}
        onClick={() => setViewMode('grid')}
      >
        <FiGrid className="h-5 w-5" />
        <span className="sr-only">Grid view</span>
      </button>
      <button
        type="button"
        className={`rounded-md p-2 ${
          viewMode === 'list' 
            ? 'bg-primary-100 text-primary-600' 
            : 'bg-white text-gray-400 hover:bg-gray-50'
        }`}
        onClick={() => setViewMode('list')}
      >
        <FiList className="h-5 w-5" />
        <span className="sr-only">List view</span>
      </button>
    </div>
  )
  
  return (
    <div>
      <PageHeader 
        title="Browse Products" 
        subtitle="Find what you need for your business"
        action={<ViewToggle />}
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
                value={filterParams.search}
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
                value={filterParams.category}
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
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="btn-secondary mr-3"
              onClick={() => {
                setFilterParams({
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
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button 
            onClick={() => loadProducts(pagination.page)} 
            className="mt-2 text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {/* Products display */}
      <ProductGrid products={products} loading={isLoading} />
      
      {/* Pagination */}
      {!isLoading && pagination && (
        <div className="mt-8">
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