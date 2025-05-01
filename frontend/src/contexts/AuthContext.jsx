import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { jwtDecode } from 'jwt-decode'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check token expiration
  const checkTokenExpiration = useCallback(() => {
    const token = localStorage.getItem('fallbackToken')
    if (token) {
      try {
        const decodedToken = jwtDecode(token)
        const currentTime = Date.now() / 1000
        
        // Check if token is expired or will expire in next 5 minutes
        if (decodedToken.exp < currentTime || (decodedToken.exp - currentTime) < 300) {
          console.log('Token expired or expiring soon')
          logout()
          return false
        }
        return true
      } catch (error) {
        console.error('Token decode error:', error)
        logout()
        return false
      }
    }
    return false
  }, [])

  // Check auth state
  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        // Set up token expiration check
        const token = await authService.getJWTFallbackToken()
        if (token) {
          localStorage.setItem('fallbackToken', token)
        }
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set up periodic token check
  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      if (!checkTokenExpiration()) {
        clearInterval(tokenCheckInterval)
      }
    }, 60000) // Check every minute

    return () => clearInterval(tokenCheckInterval)
  }, [checkTokenExpiration])

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Login function
  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      const userData = await authService.login(email, password)
      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Google login function
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      const userData = await authService.loginWithGoogle()
      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      console.error('Google login failed:', error)
      return { success: false, error: error.message || 'Google login failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Register function
  const register = useCallback(async (userData) => {
    setIsLoading(true)
    try {
      const newUser = await authService.register(userData)
      setUser(newUser)
      return { success: true, user: newUser }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: error.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
      localStorage.removeItem('fallbackToken')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    checkAuth,
    login,
    loginWithGoogle,
    register,
    logout,
    isAuthenticated: !!user,
  }), [user, isLoading, checkAuth, login, loginWithGoogle, register, logout])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}