const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;
const FORCE_COOKIE_SAMESITE_NONE = process.env.FORCE_COOKIE_SAMESITE_NONE === 'true';
const FORCE_COOKIE_SECURE = process.env.FORCE_COOKIE_SECURE === 'true';

function cookieOptions(req) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return {
      httpOnly: true,
      sameSite: 'lax', // Changed back to 'lax' - 'none' requires secure: true
      secure: false,
      maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
      // Remove domain: 'localhost' - can cause issues in development
    };
  }

  // Production mode - detect HTTPS
  const proto = req && (req.headers && (req.headers['x-forwarded-proto'] || req.protocol));
  const isReqHttps = String(proto || '').toLowerCase() === 'https';

  let secure = FORCE_COOKIE_SECURE || isReqHttps;
  let sameSite = secure ? 'none' : 'lax';

  if (FORCE_COOKIE_SAMESITE_NONE) sameSite = 'none';

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

// Fix the default cookie options too
function defaultCookieOptions() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    httpOnly: true,
    sameSite: 'lax', // Changed from conditional to always 'lax' in development
    secure: false, // Always false in development
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

module.exports = {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRES_DAYS,
  cookieOptions,
  defaultCookieOptions,
};