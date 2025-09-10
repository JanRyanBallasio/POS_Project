const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.FORCE_COOKIE_SECURE === 'true'
    ? true
    : process.env.FORCE_COOKIE_SECURE === 'false'
    ? false
    : process.env.NODE_ENV === 'production',
  sameSite: process.env.FORCE_COOKIE_SAMESITE_NONE === 'true'
    ? 'none'
    : process.env.NODE_ENV === 'production'
    ? 'none'
    : 'lax',
  maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const cookieOptions = (req) => {
  return {
    ...defaultCookieOptions,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
};

module.exports = {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRES_DAYS,
  cookieOptions,
  defaultCookieOptions,
};
