import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { productService } from '../../services/productService'
import PageHeader from '../../components/common/PageHeader'

function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category: '',
    inventory: '',
    status: 'In Stock',
    imageUrl: '',
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState([])
  
  // Load product data if editing
  useEffect(() => {
    const loadProduct = async () => {
      if (isEditMode) {
        setIsLoading(true)
        try {
          const product = await productService.getProductById(id)
          setFormData({
            ...product,
            price: product.price.toString(),
            inventory: product.inventory.toString(),
          })
        } catch (error) {
          console.error('Error loading product:', error)
          toast.error('Failed to load product')
          navigate('/admin/products')
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    const loadCategories = async () => {
      try {
        const data = await productService.getCategories()
        setCategories(data)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    
    loadProduct()
    loadCategories()
  }, [id, isEditMode, navigate])
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear error when user updates field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }
  
  // Validate form
  const validate = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.sku) {
      newErrors.sku = 'SKU is required'
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required'
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number'
    }
    
    if (!formData.inventory) {
      newErrors.inventory = 'Inventory is required'
    } else if (isNaN(parseInt(formData.inventory)) || parseInt(formData.inventory) < 0) {
      newErrors.inventory = 'Inventory must be a non-negative integer'
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.imageUrl) {
      newErrors.imageUrl = 'Image URL is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    setIsSaving(true)
    
    try {
      // Convert numeric fields to appropriate types
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        inventory: parseInt(formData.inventory, 10),
      }
      
      if (isEditMode) {
        await productService.updateProduct(id, productData)
        toast.success('Product updated successfully')
      } else {
        await productService.createProduct(productData)
        toast.success('Product created successfully')
      }
      
      navigate('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(isEditMode ? 'Failed to update product' : 'Failed to create product')
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="bg-white shadow rounded-lg p-8">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sm:col-span-3">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <PageHeader 
        title={isEditMode ? 'Edit Product' : 'Create Product'} 
        subtitle={isEditMode ? 'Update product information' : 'Add a new product to your inventory'} 
      />
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="label">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input ${errors.name ? 'border-error-300' : ''}`}
                />
                {errors.name && <p className="mt-2 text-sm text-error-600">{errors.name}</p>}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="sku" className="label">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  id="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`input ${errors.sku ? 'border-error-300' : ''}`}
                />
                {errors.sku && <p className="mt-2 text-sm text-error-600">{errors.sku}</p>}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="price" className="label">
                  Price
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`input pl-7 ${errors.price ? 'border-error-300' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="mt-2 text-sm text-error-600">{errors.price}</p>}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="inventory" className="label">
                  Inventory
                </label>
                <input
                  type="number"
                  name="inventory"
                  id="inventory"
                  value={formData.inventory}
                  onChange={handleChange}
                  className={`input ${errors.inventory ? 'border-error-300' : ''}`}
                  min="0"
                />
                {errors.inventory && <p className="mt-2 text-sm text-error-600">{errors.inventory}</p>}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="category" className="label">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`input ${errors.category ? 'border-error-300' : ''}`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="mt-2 text-sm text-error-600">{errors.category}</p>}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="status" className="label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="imageUrl" className="label">
                  Image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className={`input ${errors.imageUrl ? 'border-error-300' : ''}`}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.imageUrl && <p className="mt-2 text-sm text-error-600">{errors.imageUrl}</p>}
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.imageUrl} 
                      alt="Product preview" 
                      className="h-32 w-32 object-cover rounded-md"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL'
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`input ${errors.description ? 'border-error-300' : ''}`}
                />
                {errors.description && <p className="mt-2 text-sm text-error-600">{errors.description}</p>}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              className="btn-secondary mr-3"
              onClick={() => navigate('/admin/products')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProductForm