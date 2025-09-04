const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;

// Allow forcing cross-site cookie behavior via env when needed
const FORCE_COOKIE_SAMESITE_NONE = process.env.FORCE_COOKIE_SAMESITE_NONE === 'true';
const FORCE_COOKIE_SECURE = process.env.FORCE_COOKIE_SECURE === 'true';

function cookieOptions() {
  const secure = FORCE_COOKIE_SECURE || process.env.NODE_ENV === 'production';
  // if forcing SameSite=None or secure is true, use 'none' otherwise keep 'lax'
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