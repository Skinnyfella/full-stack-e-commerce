import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiTrash2 } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { cartService } from '../../services/cartService'

function CartItem({ item, updateQuantity, removeItem }) {
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10)
    if (value > 0 && value <= 100) {
      updateQuantity(item.id, value)
    }
  }
  
  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1)
    }
  }
  
  const increaseQuantity = () => {
    if (item.quantity < 100) {
      updateQuantity(item.id, item.quantity + 1)
    }
  }
  
  return (
    <li className="flex py-6 border-b border-gray-200">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.name}</h3>
            <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} each</p>
        </div>
        
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center">
            <label htmlFor={`quantity-${item.id}`} className="sr-only">
              Quantity, {item.name}
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                onClick={decreaseQuantity}
              >
                <span className="sr-only">Decrease</span>
                <span className="h-5 w-5 flex items-center justify-center">−</span>
              </button>
              <input
                id={`quantity-${item.id}`}
                type="number"
                className="block w-12 border-gray-300 px-3 py-2 text-center text-base focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={item.quantity}
                onChange={handleQuantityChange}
                min="1"
                max="100"
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

          <div className="flex">
            <button
              type="button"
              className="text-error-600 hover:text-error-700 font-medium flex items-center"
              onClick={() => removeItem(item.id)}
            >
              <FiTrash2 className="h-4 w-4 mr-1" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

function CartSummary({ cartItems }) {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0)
  const shipping = 10 // Fixed shipping cost for demo
  const tax = subtotal * 0.08 // 8% tax rate for demo
  const total = subtotal + tax + shipping
  
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
      
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-base font-medium text-gray-900">Subtotal</div>
          <div className="text-base font-medium text-gray-900">${subtotal.toFixed(2)}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Shipping</div>
          <div className="text-sm font-medium text-gray-900">${shipping.toFixed(2)}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Tax (8%)</div>
          <div className="text-sm font-medium text-gray-900">${tax.toFixed(2)}</div>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-base font-medium text-gray-900">Order total</div>
          <div className="text-base font-medium text-gray-900">${total.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="mt-6">
        <Link
          to="/checkout"
          className="btn-primary w-full"
        >
          Proceed to Checkout
        </Link>
      </div>
      
      <div className="mt-4 text-center">
        <Link
          to="/"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load cart items from Supabase
  useEffect(() => {
    async function loadCartItems() {
      try {
        setIsLoading(true)
        const cart = await cartService.getCartItems()
        setCartItems(cart.items)
      } catch (error) {
        console.error('Error loading cart:', error)
        toast.error('Failed to load cart items')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCartItems()
  }, [])
  
  // Update quantity of an item
  const updateQuantity = async (id, quantity) => {
    try {
      setIsLoading(true)
      const cart = await cartService.updateCartItem(id, quantity)
      setCartItems(cart.items)
    } catch (error) {
      console.error('Error updating cart:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Remove an item from cart
  const removeItem = async (id) => {
    try {
      setIsLoading(true)
      const cart = await cartService.removeFromCart(id)
      setCartItems(cart.items)
    } catch (error) {
      console.error('Error removing item from cart:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Clear entire cart
  const clearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        setIsLoading(true)
        const cart = await cartService.clearCart()
        setCartItems(cart.items)
      } catch (error) {
        console.error('Error clearing cart:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-200 rounded-lg h-72"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <PageHeader 
        title="Your Cart" 
        subtitle={`${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`}
      />
      
      {cartItems.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add items to your cart to see them here."
          icon={FiShoppingBag}
          action="/"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white overflow-hidden shadow sm:rounded-lg p-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
                <button
                  type="button"
                  className="text-sm font-medium text-error-600 hover:text-error-700"
                  onClick={clearCart}
                >
                  Clear cart
                </button>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {cartItems.map(item => (
                  <CartItem
                    key={item.id}
                    item={{
                      id: item.id,
                      name: item.product.name,
                      price: parseFloat(item.product.price),
                      quantity: item.quantity,
                      imageUrl: item.product.imageUrl
                    }}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))}
              </ul>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <CartSummary cartItems={cartItems} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart