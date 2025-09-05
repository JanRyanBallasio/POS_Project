const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const cookieOptions = (req) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const origin = req.get('origin') || req.get('referer') || '';
  
  return {
    ...defaultCookieOptions,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  };
};

module.exports = {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRES_DAYS,
  cookieOptions,
  defaultCookieOptions,
};