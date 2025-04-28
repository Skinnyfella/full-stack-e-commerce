import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // State to store user info and loading state
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check if user is already authenticated
  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      logout() // Clear any invalid auth data
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Check authentication on component mount
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