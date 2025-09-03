// ...existing code...
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Only set SameSite='none' when cookie is secure (required by browsers).
    sameSite: secure ? 'none' : 'lax',
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
// ...existing code...