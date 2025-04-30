import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { orderService } from '../../services/orderService'
import { useCart } from '../../contexts/CartContext'
import PageHeader from '../../components/common/PageHeader'

function OrderSummary({ cartItems }) {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0)
  const shipping = 10 // Fixed shipping cost for demo
  const tax = subtotal * 0.08 // 8% tax rate for demo
  const total = subtotal + tax + shipping
  
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
      
      <ul className="mt-6 divide-y divide-gray-200">
        {cartItems.map(item => (
          <li key={item.id} className="flex py-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="ml-4 flex flex-1 flex-col">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <h3>{item.product.name}</h3>
                <p className="ml-4">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="space-y-4 mt-6">
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
    </div>
  )
}

function Checkout() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    cardName: '',
    cardNumber: '',
    expDate: '',
    cvv: ''
  })
  const [errors, setErrors] = useState({})
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    // Required fields
    ;['name', 'email', 'address', 'city', 'state', 'zipCode', 'cardName', 'cardNumber', 'expDate', 'cvv'].forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required'
      }
    })
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    // Card number validation (basic)
    if (formData.cardNumber && !/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number'
    }
    
    // Expiry date validation (MM/YY format)
    if (formData.expDate && !/^\d{2}\/\d{2}$/.test(formData.expDate)) {
      newErrors.expDate = 'Invalid format (MM/YY)'
    }
    
    // CVV validation
    if (formData.cvv && !/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'Invalid CVV'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Calculate totals (same as in OrderSummary)
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0)
      const shipping = 10
      const tax = subtotal * 0.08
      const total = subtotal + tax + shipping
      
      // Create order data
      const orderData = {
        items: cart.items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.product.price),
          imageUrl: item.product.imageUrl,
        })),
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        customerName: formData.name,
        customerEmail: formData.email
      }
      
      const order = await orderService.createOrder(orderData)
      
      // Clear the cart after successful order
      await clearCart()
      
      toast.success('Order placed successfully!')
      
      // Navigate to order confirmation
      navigate(`/orders?new=${order.id}`)
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div>
      <PageHeader 
        title="Checkout" 
        subtitle="Complete your purchase" 
      />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Shipping Information</h3>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="name" className="label">
                        Full Name
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
                      <label htmlFor="email" className="label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`input ${errors.email ? 'border-error-300' : ''}`}
                      />
                      {errors.email && <p className="mt-2 text-sm text-error-600">{errors.email}</p>}
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="address" className="label">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={`input ${errors.address ? 'border-error-300' : ''}`}
                      />
                      {errors.address && <p className="mt-2 text-sm text-error-600">{errors.address}</p>}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="city" className="label">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`input ${errors.city ? 'border-error-300' : ''}`}
                      />
                      {errors.city && <p className="mt-2 text-sm text-error-600">{errors.city}</p>}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="state" className="label">
                        State / Province
                      </label>
                      <input
                        type="text"
                        name="state"
                        id="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`input ${errors.state ? 'border-error-300' : ''}`}
                      />
                      {errors.state && <p className="mt-2 text-sm text-error-600">{errors.state}</p>}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="zipCode" className="label">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className={`input ${errors.zipCode ? 'border-error-300' : ''}`}
                      />
                      {errors.zipCode && <p className="mt-2 text-sm text-error-600">{errors.zipCode}</p>}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="country" className="label">
                        Country
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="USA">United States</option>
                        <option value="CAN">Canada</option>
                        <option value="MEX">Mexico</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Information</h3>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="cardName" className="label">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        id="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        className={`input ${errors.cardName ? 'border-error-300' : ''}`}
                      />
                      {errors.cardName && <p className="mt-2 text-sm text-error-600">{errors.cardName}</p>}
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="cardNumber" className="label">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        id="cardNumber"
                        placeholder="•••• •••• •••• ••••"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className={`input ${errors.cardNumber ? 'border-error-300' : ''}`}
                      />
                      {errors.cardNumber && <p className="mt-2 text-sm text-error-600">{errors.cardNumber}</p>}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="expDate" className="label">
                        Expiration Date (MM/YY)
                      </label>
                      <input
                        type="text"
                        name="expDate"
                        id="expDate"
                        placeholder="MM/YY"
                        value={formData.expDate}
                        onChange={handleChange}
                        className={`input ${errors.expDate ? 'border-error-300' : ''}`}
                      />
                      {errors.expDate && <p className="mt-2 text-sm text-error-600">{errors.expDate}</p>}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="cvv" className="label">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        id="cvv"
                        placeholder="•••"
                        value={formData.cvv}
                        onChange={handleChange}
                        className={`input ${errors.cvv ? 'border-error-300' : ''}`}
                      />
                      {errors.cvv && <p className="mt-2 text-sm text-error-600">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-secondary mr-3"
                  onClick={() => navigate('/cart')}
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || cart.items.length === 0}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary cartItems={cart.items} />
        </div>
      </div>
    </div>
  )
}

export default Checkout