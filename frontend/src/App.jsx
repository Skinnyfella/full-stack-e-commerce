import { useEffect, useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { toast, Toaster } from 'react-hot-toast'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy-loaded route components
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))
const ProductCatalog = lazy(() => import('./pages/customer/ProductCatalog'))
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'))
const Cart = lazy(() => import('./pages/customer/Cart'))
const Checkout = lazy(() => import('./pages/customer/Checkout'))
const OrderHistory = lazy(() => import('./pages/customer/OrderHistory'))

// Admin routes lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ProductList = lazy(() => import('./pages/admin/ProductList'))
const OrderList = lazy(() => import('./pages/admin/OrderList'))
const ProductForm = lazy(() => import('./pages/admin/ProductForm'))

// Utility/Error Pages
import NotFoundPage from './pages/NotFoundPage'

// Error Boundary component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white shadow rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-700 mb-4">{error.message || 'An unexpected error occurred'}</p>
        <div className="bg-gray-50 p-4 rounded mb-4 overflow-auto max-h-48">
          <pre className="text-xs text-gray-600">{error.stack}</pre>
        </div>
        <button 
          onClick={resetErrorBoundary} 
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Error boundary wrapper
function withErrorBoundary(Component) {
  return function WithErrorBoundary(props) {
    const [error, setError] = useState(null);

    if (error) {
      return <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />;
    }

    try {
      return <Component {...props} />;
    } catch (err) {
      console.error('Error in component:', err);
      setError(err);
      return null;
    }
  };
}

function RequireAuth({ children, allowedRoles }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // If user doesn't have the required role, redirect based on their role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }
  
  // User is authenticated and has the right role
  return children
}

function App() {
  const { checkAuth } = useAuth()
  
  useEffect(() => {
    // Set up error handling for async errors
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      toast.error('Something went wrong. Please try again later.');
      event.preventDefault(); // Prevents the default error handling
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    checkAuth();
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [checkAuth])
  
  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        <div className="min-h-full">
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Route>
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route index element={withErrorBoundary(AdminDashboard)()} />
              <Route path="products" element={withErrorBoundary(ProductList)()} />
              <Route path="products/create" element={withErrorBoundary(ProductForm)()} />
              <Route path="products/edit/:id" element={withErrorBoundary(ProductForm)()} />
              <Route path="orders" element={withErrorBoundary(OrderList)()} />
            </Route>
            
            {/* Customer Routes */}
            <Route 
              path="/" 
              element={
                <RequireAuth allowedRoles={['customer']}>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route index element={withErrorBoundary(ProductCatalog)()} />
              <Route path="products/:id" element={withErrorBoundary(ProductDetail)()} />
              <Route path="cart" element={withErrorBoundary(Cart)()} />
              <Route path="checkout" element={withErrorBoundary(Checkout)()} />
              <Route path="orders" element={withErrorBoundary(OrderHistory)()} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Suspense>

      <Toaster position="top-right" />
    </>
  )
}

export default App