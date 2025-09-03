// ...existing code...
const jwtUtils = require('../utils/jwt');

const auth = (req, res, next) => {
  try {
    let token = null;

    // 1) Bearer token from Authorization header
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }

    // 2) Fallback to custom header
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];

    // 3) Optional cookie where frontend might store access token (not the refresh token)
    if (!token && req.cookies && req.cookies.accessToken) token = req.cookies.accessToken;

    // Do not accept refreshToken cookie here (refresh token should only be used to obtain new access token)

    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
      const decoded = jwtUtils.verifyToken(token);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(500).json({ success: false, message: 'Auth error' });
  }
};

module.exports = auth;
// ...existing code...