import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { orderService } from '../../services/orderService'
import { useCart } from '../../contexts/CartContext'
import PageHeader from '../../components/common/PageHeader'

// Payment Status Modal Component
function PaymentStatusModal({ isOpen, status, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'processing' ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Processing Payment</h3>
              <p className="mt-2 text-sm text-gray-500">Please wait while we process your payment...</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
                <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-success-900">Payment Successful</h3>
              <p className="mt-2 text-sm text-gray-500">Your order has been placed successfully!</p>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
                <svg className="h-6 w-6 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-error-900">Payment Failed</h3>
              <p className="mt-2 text-sm text-gray-500">There was an error processing your payment. Please try again.</p>
            </>
          )}
          
          {status !== 'processing' && (
            <button
              type="button"
              className="mt-6 btn-primary w-full"
              onClick={onClose}
            >
              {status === 'success' ? 'View Order' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [modalState, setModalState] = useState({ isOpen: false, status: null })
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
    
    // Only validate payment fields
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required'
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Card number must be 16 digits'
    }
    
    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Name on card is required'
    }
    
    if (!formData.expDate.trim()) {
      newErrors.expDate = 'Expiration date is required'
    }
    
    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setModalState({ isOpen: true, status: 'processing' })
    
    try {
      // Calculate totals (same as in OrderSummary)
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0)
      const shipping = 10
      const tax = subtotal * 0.08
      const total = subtotal + tax + shipping
      
      // Only pass minimal order data
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
        total
      }
      
      const order = await orderService.createOrder(orderData)
      
      // Clear the cart after successful order
      await clearCart()
      
      // Show success modal
      setModalState({ isOpen: true, status: 'success' })
      
      // Store order ID for navigation after modal closes
      setModalState(prev => ({ ...prev, orderId: order.id }))
    } catch (error) {
      console.error('Error placing order:', error)
      setModalState({ isOpen: true, status: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleModalClose = () => {
    if (modalState.status === 'success') {
      navigate(`/orders?new=${modalState.orderId}`)
    }
    setModalState({ isOpen: false, status: null })
  }

  return (
    <div>
      <PageHeader 
        title="Checkout" 
        subtitle="Complete your purchase" 
      />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form method="POST" onSubmit={handleSubmit}>
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
                        className="input"
                      />
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
                        className="input"
                      />
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
                        className="input"
                      />
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
                        className="input"
                      />
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
                        className="input"
                      />
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
                        className="input"
                      />
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

      <PaymentStatusModal 
        isOpen={modalState.isOpen}
        status={modalState.status}
        onClose={handleModalClose}
      />
    </div>
  )
}

export default Checkout