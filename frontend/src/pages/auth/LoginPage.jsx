import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
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
    
    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        toast.success('Login successful')
        // Redirect based on user role
        navigate(result.user.role === 'admin' ? '/admin' : '/')
      } else {
        toast.error(result.error || 'Login failed')
        setErrors({ general: result.error || 'Invalid email or password' })
      }
    } catch (error) {
      toast.error('An error occurred during login')
      setErrors({ general: error.message || 'Login failed' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper info for demo
  const demoAccounts = [
    { role: 'Admin', email: 'admin@example.com', password: 'admin123' },
    { role: 'Customer', email: 'customer@example.com', password: 'customer123' }
  ]
  
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
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            className={`input ${errors.password ? 'border-error-300' : ''}`}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-error-600">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      {/* Demo account information */}
      <div className="mt-8 rounded-md bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700">Demo Accounts</h3>
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          {demoAccounts.map((account, index) => (
            <div key={index}>
              <strong>{account.role}:</strong> {account.email} / {account.password}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoginPage