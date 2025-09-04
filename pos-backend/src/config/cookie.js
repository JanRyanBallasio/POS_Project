// ...existing code...
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;
const FORCE_COOKIE_SAMESITE_NONE = process.env.FORCE_COOKIE_SAMESITE_NONE === 'true';
const FORCE_COOKIE_SECURE = process.env.FORCE_COOKIE_SECURE === 'true';

// now accept optional req to detect HTTPS via x-forwarded-proto (useful behind proxies)
function cookieOptions(req) {
  // detect if request is secure (https) when behind proxies
  const proto = req && (req.headers && (req.headers['x-forwarded-proto'] || req.protocol));
  const isReqHttps = String(proto || '').toLowerCase() === 'https';

  // secure = explicit env true OR running in production OR request is https
  const secure = FORCE_COOKIE_SECURE || process.env.NODE_ENV === 'production' || isReqHttps;

  const sameSite = FORCE_COOKIE_SAMESITE_NONE || secure ? 'none' : 'lax';

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

module.exports = {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRES_DAYS,
  cookieOptions,
};