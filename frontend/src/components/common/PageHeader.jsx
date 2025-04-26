import { Link } from 'react-router-dom'

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="md:flex md:items-center md:justify-between mb-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {typeof action === 'string' ? (
            <Link
              to={action}
              className="btn-primary"
            >
              Add New
            </Link>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}

export default PageHeader