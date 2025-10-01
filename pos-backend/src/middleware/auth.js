const jwtUtils = require('../utils/jwt');

// TEMPORARY: Development auth bypass for local testing (e.g., Tauri .exe)
// This makes all routes behave as PUBLIC and not require a token.
// IMPORTANT: To re-enable authentication, switch `module.exports` at the bottom
// to export the real `auth` function instead of `devBypass`.
const devBypass = (req, res, next) => {
  return next();
};

const auth = (req, res, next) => {
  try {
    let token = null;

    // 1) Bearer token from Authorization header (PRIMARY METHOD)
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }

    // 2) Fallback to custom header
    if (!token && req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    // REMOVED: Access token from cookies (security risk)
    // Access tokens should only be in memory/Authorization header

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwtUtils.verifyToken(token);
      // Add token expiry validation
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      req.user = decoded;
      return next();
    } catch (err) {
      const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      
      return res.status(401).json({ 
        success: false, 
        message,
        code
      });
    }
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Auth error',
      code: 'AUTH_ERROR'
    });
  }
};

// DEVELOPMENT MODE: export the bypass so all routes are public
module.exports = process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true' ? devBypass : auth;

// To RE-ENABLE authentication later, change the line above to:
// module.exports = auth;