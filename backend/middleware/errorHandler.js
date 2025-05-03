const errorHandler = (err, req, res, next) => {
  // Log only non-sensitive parts of the error for debugging
  const sanitizedError = {
    name: err.name,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  // Only log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', sanitizedError, '\nStack:', err.stack);
  } else {
    console.error('Production error:', sanitizedError);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.statusCode === 401) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  // Generic error response for production
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};

module.exports = errorHandler;