import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' // Default role
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined,
      })
    }
  }
  
  const validate = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    setIsSubmitting(true)
    
    // Remove confirmPassword from data sent to backend
    const { confirmPassword, ...userData } = formData
    
    try {
      const result = await register(userData)
      
      if (result.success) {
        toast.success('Registration successful')
        // Redirect based on user role
        navigate(result.user.role === 'admin' ? '/admin' : '/')
      } else {
        // Check for specific "Email already in use" error
        if (result.error && result.error.includes('Email already in use')) {
          toast.error('This email is already registered')
          setErrors({
            ...errors,
            email: 'Email already in use'
          })
        } else {
          toast.error(result.error || 'Registration failed')
          setErrors({ general: result.error || 'Could not complete registration' })
        }
      }
    } catch (error) {
      toast.error('An error occurred during registration')
      setErrors({ general: error.message || 'Registration failed' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="rounded-md bg-error-50 p-4">
            <div className="flex">
              <div className="text-sm text-error-700">
                {errors.general}
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className={`input ${errors.name ? 'border-error-300' : ''}`}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-error-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={`input ${errors.email ? 'border-error-300' : ''}`}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-error-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            className={`input ${errors.password ? 'border-error-300' : ''}`}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-error-600">{errors.password}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`input ${errors.confirmPassword ? 'border-error-300' : ''}`}
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-error-600">{errors.confirmPassword}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="role" className="label">
            Account Type
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="input"
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Select "Admin" for inventory management or "Customer" for shopping.
          </p>
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <a href="#terms" className="font-medium text-primary-600 hover:text-primary-500">
              Terms and Conditions
            </a>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage