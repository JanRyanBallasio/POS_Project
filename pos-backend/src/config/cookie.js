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

  // default secure: env true OR production OR request is https
  let secure = FORCE_COOKIE_SECURE || process.env.NODE_ENV === 'production' || isReqHttps;

  // ensure dev uses non-secure cookies so browser will send them over http
  if (process.env.NODE_ENV === 'development') secure = false;

  // choose sameSite: if cookie is secure we use 'none' for cross-site; dev uses 'lax'
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

module.exports = {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRES_DAYS,
  cookieOptions,
};