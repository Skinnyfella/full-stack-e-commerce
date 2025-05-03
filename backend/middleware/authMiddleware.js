const supabase = require('../config/supabase');
const db = require('../models');
const rateLimit = require('express-rate-limit');

// Create specific limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

/**
 * Middleware to verify Supabase token and attach user to request
 */
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // First try to check local database (for development/testing)
    try {
      const userProfile = await db.UserProfile.findByPk(req.user.id);
      
      if (userProfile && userProfile.role === 'admin') {
        return next();
      }
    } catch (dbErr) {
      console.log('Using Supabase for admin check as local DB check failed');
    }
    
    // Fallback to Supabase check
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    if (error || !userProfile) {
      return res.status(401).json({ message: 'User profile not found' });
    }
    
    if (userProfile.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    // Generic error for security
    return res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  authLimiter,
  apiLimiter
};