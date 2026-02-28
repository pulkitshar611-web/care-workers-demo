const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Verify JWT token and attach user info to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Authorization denied.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Authorization denied.' 
    });
  }
};

/**
 * Middleware to check if user is Admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin role required.' 
    });
  }

  next();
};

/**
 * Middleware to check if user is Kiaan Technology
 */
const requireCareWorker = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'care_worker') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Kiaan Technology role required.' 
    });
  }

  next();
};

// Alias for backward compatibility
const authenticateToken = authenticate;
const adminOnly = requireAdmin;

module.exports = {
  authenticate,
  authenticateToken,
  requireAdmin,
  adminOnly,
  requireCareWorker
};

