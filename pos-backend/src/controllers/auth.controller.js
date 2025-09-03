// ...existing code...
const bcrypt = require('bcryptjs');
const jwtUtils = require('../utils/jwt');
const { supabase } = require('../config/db');
const { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_EXPIRES_DAYS, cookieOptions } = require('../config/cookie');

/**
 * Helpers
 */
async function storeRefreshToken(token, userId, expiresAtIso) {
  const { error } = await supabase
    .from('RefreshTokens')
    .insert([{ token, user_id: userId, expires_at: expiresAtIso }]);
  if (error) throw error;
}

async function removeRefreshToken(token) {
  const { error } = await supabase
    .from('RefreshTokens')
    .delete()
    .eq('token', token);
  if (error) throw error;
}

async function findRefreshToken(token) {
  const { data, error } = await supabase
    .from('RefreshTokens')
    .select('*')
    .eq('token', token)
    .limit(1);
  if (error) throw error;
  return (data && data[0]) || null;
}

/**
 * Controllers
 */
async function register(req, res) {
  try {
    const { name, username, password, position_id } = req.body;
    console.log('Register attempt:', { name, username });

    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // check existing user
    const { data: existing, error: existsErr } = await supabase
      .from('Users')
      .select('id')
      .eq('username', username)
      .limit(1);

    if (existsErr) throw existsErr;
    if (existing && existing.length > 0) {
      console.log('Register failed - username exists:', username, existing);
    }
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // hash password and create user
    const hashed = await bcrypt.hash(password, 10);

    const { data: createdArr, error: createErr } = await supabase
      .from('Users')
      .insert([{ name, username, password: hashed, position_id }])
      .select('*');

    if (createErr) throw createErr;

    const created = createdArr[0]

    // // prepare tokens
    // const userPayload = { id: created.id, username: created.username, position_id: created.position_id || null };
    // const accessToken = jwtUtils.generateToken(userPayload, '8h');
    // const refreshToken = jwtUtils.generateToken({ id: created.id }, `${REFRESH_TOKEN_EXPIRES_DAYS}d`);
    // const expiresAt = new Date(Date.now() + cookieOptions().maxAge).toISOString();

    // // store refresh token
    // await storeRefreshToken(refreshToken, created.id, expiresAt);

    // // set refresh token cookie
    // res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions());

    return res.status(201).json({
      success: true,
      user: { id: created.id, name: created.name, username: created.username, position_id: created.position_id },
      message: 'User created. Please log in.'
    });
  } catch (err) {
    console.error('Register error', err && (err.stack || err.message || err));
    // Return the error message in dev to aid debugging (remove or sanitize in production)
    const msg = (err && (err.message || String(err))) || 'Registration failed';
    return res.status(500).json({ success: false, message: msg });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }

    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = data[0];
    const stored = user.password || '';

    // Try bcrypt compare first (normal case)
    const isMatchBcrypt = await bcrypt.compare(password, stored).catch(() => false);
    let matched = isMatchBcrypt;

    // If bcrypt fails, allow direct plaintext match (migration safety),
    // then upgrade the stored password to a bcrypt hash.
    if (!matched && password === stored) {
      matched = true;
      try {
        const hashed = await bcrypt.hash(password, 10);
        await supabase.from('Users').update({ password: hashed }).eq('id', user.id);
        console.log(`Upgraded password to hashed for user ${user.id}`);
      } catch (upgradeErr) {
        console.warn('Failed to upgrade plaintext password for user', user.id, upgradeErr.message || upgradeErr);
      }
    }

    if (!matched) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = { id: user.id, username: user.username, position_id: user.position_id || null };
    const accessToken = jwtUtils.generateToken(payload, '8h');
    const refreshToken = jwtUtils.generateToken({ id: user.id }, `${REFRESH_TOKEN_EXPIRES_DAYS}d`);
    const expiresAt = new Date(Date.now() + cookieOptions().maxAge).toISOString();

    // store refresh token
    await storeRefreshToken(refreshToken, user.id, expiresAt);

    // set cookie
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions());

    // don't leak password
    delete user.password;

    return res.json({ success: true, accessToken, data: user });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
}

async function refreshToken(req, res) {
  try {
    let token = null;
    if (req.cookies && req.cookies[REFRESH_TOKEN_COOKIE]) token = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!token && req.body && req.body.refreshToken) token = req.body.refreshToken;

    if (!token) return res.status(401).json({ success: false, message: 'No refresh token provided' });

    // verify signature
    let decoded;
    try {
      decoded = jwtUtils.verifyToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // check stored token exists and not expired
    const stored = await findRefreshToken(token);
    if (!stored) return res.status(401).json({ success: false, message: 'Refresh token not found' });

    const now = new Date();
    if (new Date(stored.expires_at) < now) {
      // remove expired token
      try { await removeRefreshToken(token); } catch (_) { }
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }

    // generate new access token
    const userId = decoded.id;
    // fetch latest user info
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const user = data[0];
    const payload = { id: user.id, username: user.username, position_id: user.position_id || null };
    const accessToken = jwtUtils.generateToken(payload, '8h');

    return res.json({ success: true, accessToken });
  } catch (err) {
    console.error('Refresh token error', err);
    return res.status(500).json({ success: false, message: 'Could not refresh token' });
  }
}

async function logout(req, res) {
  try {
    let token = null;
    if (req.cookies && req.cookies[REFRESH_TOKEN_COOKIE]) token = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!token && req.body && req.body.refreshToken) token = req.body.refreshToken;
    if (!token) {
      // still clear cookie client-side
      res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions());
      return res.json({ success: true, message: 'Logged out' });
    }

    try {
      await removeRefreshToken(token);
    } catch (err) {
      console.warn('Failed to remove refresh token:', err.message || err);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions());
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
// ...existing code...