// ...existing code...
const jwtUtils = require('../utils/jwt');
// const { REFRESH_TOKEN_COOKIE } = require('../config/cookie');

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

    // NOTE: DO NOT treat the refresh token cookie as an access token here.
    // The refresh cookie should be handled by the refresh endpoint (authController.refreshToken)
    // to issue a new access token. If you treat the refresh token as an access token
    // here you'll incorrectly mark the user as already authenticated.
    //
    // if (!token && req.cookies && req.cookies[REFRESH_TOKEN_COOKIE]) token = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!token) return next();

    try {
      jwtUtils.verifyToken(token);
      // previously returned 400; return 200 and let client redirect
      return res.status(200).json({ success: true, message: 'Already authenticated' });
    } catch (err) {
      return next(); // token invalid/expired -> allow access to login/register
    }
  } catch (err) {
    return next();
  }
};
// ...existing code...