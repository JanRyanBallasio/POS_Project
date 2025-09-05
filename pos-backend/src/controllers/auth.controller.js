const bcrypt = require('bcryptjs');
const jwtUtils = require('../utils/jwt');
const { supabase } = require('../config/db');
const User = require('../models/user.model');
const { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_EXPIRES_DAYS, cookieOptions, defaultCookieOptions } = require('../config/cookie');

// Optimize bcrypt rounds based on environment
const SALT_ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 8;

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

async function register(req, res) {
  try {
    const { name, username, password, position_id } = req.body;
    console.log('Register attempt:', { name, username });

    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Name, username, and password are required' });
    }

    // Check existing user using model
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const userData = { name, username, password: hashed, position_id };
    const created = await User.create(userData);

    // Clear any existing refresh tokens
    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions(req));

    return res.status(201).json({
      success: true,
      user: {
        id: created.id,
        name: created.name,
        username: created.username,
        position_id: created.position_id
      },
      message: 'User created. Please log in.'
    });
  } catch (err) {
    console.error('Register error', err);
    const msg = err.message || 'Registration failed';
    return res.status(500).json({ success: false, message: msg });
  }
}

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Use correct Supabase model method
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessPayload = {
      id: user.id,
      username: user.username,
      position_id: user.position_id || null
    };
    const accessToken = jwtUtils.generateToken(accessPayload, '8h');
    const refreshToken = jwtUtils.generateToken({ id: user.id }, '7d');

    // Store refresh token
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await storeRefreshToken(refreshToken, user.id, expiresAt.toISOString());

    // Set secure cookie
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(req));

    return res.json({
      success: true,
      accessToken,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        position_id: user.position_id
      }
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

async function refreshToken(req, res) {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    // Verify token
    const decoded = jwtUtils.verifyToken(token);
    const storedToken = await findRefreshToken(token);

    if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
      await removeRefreshToken(token);
      res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions(req));
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      await removeRefreshToken(token);
      res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions(req));
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Generate new access token
    const payload = {
      id: user.id,
      username: user.username,
      position_id: user.position_id || null
    };
    const accessToken = jwtUtils.generateToken(payload, '8h');

    return res.json({ success: true, accessToken });
  } catch (err) {
    console.error('Refresh token error', err);
    return res.status(401).json({ success: false, message: 'Token refresh failed' });
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];
    if (token) {
      await removeRefreshToken(token);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions(req));
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