import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function NotFoundPage() {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md rounded-lg sm:px-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-medium text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-500 mb-8">
            We couldn't find the page you were looking for.
          </p>
          <Link
            to={user?.role === 'admin' ? '/admin' : '/'}
            className="btn-primary inline-block"
          >
            Go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage