import { Link } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'

function EmptyState({ 
  title = 'No items found', 
  description = 'Get started by creating a new item.', 
  icon: Icon = FiPackage,
  action = null 
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && typeof action === 'string' ? (
        <div className="mt-6">
          <Link to={action} className="btn-primary">
            Add New
          </Link>
        </div>
      ) : action ? (
        <div className="mt-6">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export default EmptyState