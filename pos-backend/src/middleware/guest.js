// ...existing code...
const jwtUtils = require('../utils/jwt');

module.exports = (req, res, next) => {
  try {
    let token = null;

    // Prefer access token (Authorization header)
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1];
    }

    // fallback header
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];

    // fallback to cookie that may contain an accessToken (not refresh token)
    if (!token && req.cookies && req.cookies.accessToken) token = req.cookies.accessToken;

    // Do NOT treat the refresh token cookie as an access token here.
    if (!token) return next();

    try {
      // verify and attach user but do NOT block the request
      const decoded = jwtUtils.verifyToken(token);
      req.user = decoded;
    } catch (err) {
      // invalid/expired token -> ignore and allow access to auth routes
    }

    return next();
  } catch (err) {
    return next();
  }
};
// ...existing code...