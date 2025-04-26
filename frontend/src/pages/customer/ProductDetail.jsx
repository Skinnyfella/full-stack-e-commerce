import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { productService } from '../../services/productService'
import { cartService } from '../../services/cartService'
import { FiArrowLeft, FiShoppingCart } from 'react-icons/fi'
import { supabase } from '../../utils/supabase'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  
  // Load product details
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        const data = await productService.getProductById(id)
        setProduct(data)
      } catch (error) {
        console.error('Error loading product:', error)
        toast.error('Failed to load product details')
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProduct()
  }, [id, navigate])
  
  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10)
    if (value > 0 && value <= (product?.inventory || 100)) {
      setQuantity(value)
    }
  }
  
  // Handle increase/decrease quantity
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }
  
  const increaseQuantity = () => {
    if (quantity < (product?.inventory || 100)) {
      setQuantity(quantity + 1)
    }
  }
  
  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      console.log('Attempting to add product with ID:', product.id);
      await cartService.addToCart(product.id, quantity);
      // Toast is handled within cartService
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Toast error is already handled in the service
    }
  }
  
  // Function to get status badge with the right color
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
  
  // Debug function to inspect database tables
  const debugDatabase = async () => {
    try {
      console.log('Debugging database structure...');
      
      // Check products table
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5);
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        console.log('Products table (sample):', products);
        console.log('Product ID format sample:', products.length > 0 ? products[0].id : 'No products found');
      }
      
      // Check cart_items table structure
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .limit(5);
      
      if (cartError) {
        console.error('Error fetching cart items:', cartError);
      } else {
        console.log('Cart items table (sample):', cartItems);
      }
      
      // Log current product details
      console.log('Current product being viewed:', product);
      
    } catch (error) {
      console.error('Debug failed:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-6">
          <div className="h-6 w-6 bg-gray-200 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
          <div className="lg:col-span-1">
            <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-lg h-96"></div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return null
  }
  
  return (
    <div>
      <button
        type="button"
        className="inline-flex items-center mb-6 text-sm font-medium text-gray-700 hover:text-gray-900"
        onClick={() => navigate(-1)}
      >
        <FiArrowLeft className="mr-1 h-5 w-5" />
        Back to products
      </button>
      
      {/* Add debug button */}
      <button
        type="button"
        className="inline-flex items-center mb-6 ml-4 text-sm font-medium text-blue-600 hover:text-blue-800"
        onClick={debugDatabase}
      >
        Debug Database
      </button>
      
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
        {/* Product image */}
        <div className="lg:col-span-1">
          <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
        
        {/* Product details */}
        <div className="lg:col-span-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {product.name}
          </h1>
          
          <div className="mt-4 flex items-center">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-gray-900">
              ${typeof product.price === 'number' 
                ? product.price.toFixed(2) 
                : (parseFloat(product.price) || 0).toFixed(2)}
            </p>
            
            <div className="ml-4">
              {getStatusBadge(product.status)}
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900">SKU:</h3>
              <p className="ml-2 text-sm text-gray-500">{product.sku}</p>
            </div>
            <div className="mt-1 flex items-center">
              <h3 className="text-sm font-medium text-gray-900">Category:</h3>
              <p className="ml-2 text-sm text-gray-500">{product.category}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="text-base text-gray-700 space-y-6">
              <p>{product.description}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900">Quantity:</h3>
              <div className="ml-2 flex rounded-md shadow-sm">
                <button
                  type="button"
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  onClick={decreaseQuantity}
                >
                  <span className="sr-only">Decrease</span>
                  <span className="h-5 w-5 flex items-center justify-center">−</span>
                </button>
                <input
                  type="number"
                  className="block w-16 border-gray-300 px-3 py-2 text-center text-base focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={product.inventory}
                />
                <button
                  type="button"
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  onClick={increaseQuantity}
                >
                  <span className="sr-only">Increase</span>
                  <span className="h-5 w-5 flex items-center justify-center">+</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex">
            <button
              type="button"
              className="btn-primary flex-1 flex items-center justify-center"
              onClick={handleAddToCart}
              disabled={product.status === 'Out of Stock'}
            >
              <FiShoppingCart className="-ml-1 mr-2 h-5 w-5" />
              {product.status === 'Out of Stock' 
                ? 'Out of Stock' 
                : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail