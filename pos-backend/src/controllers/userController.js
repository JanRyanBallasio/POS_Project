// ...existing code...
const { supabase } = require("../config/db");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtUtils = require('../utils/jwt');

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("Users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // remove passwords before returning
      const safeData = (data || []).map(u => {
        const { password, ...rest } = u;
        return rest;
      });

      res.json({
        success: true,
        data: safeData,
        count: safeData.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // Create new user (register)
  createUser: async (req, res) => {
    try {
      // accept either `fullname` (frontend) or `name` (db schema)
      const name = req.body.fullname || req.body.name || '';
      const username = req.body.username;
      const password = req.body.password;

      if (!name || !username || !password) {
        return res.status(400).json({ success: false, message: 'name, username and password are required' });
      }

      // check for existing username
      const { data: existing, error: existsErr } = await supabase
        .from('Users')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (existsErr) throw existsErr;
      if (existing && existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }

      // hash password before storing
      const hashed = await bcrypt.hash(password, 10);

      // insert using the DB column name `name`
      const { data, error } = await supabase
        .from('Users')
        .insert([{ name, username, password: hashed }])
        .select('*');

      if (error) throw error;

      const user = data[0];
      // never include password in response
      if (user) delete user.password;

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Login -> returns JWT. Also upgrade plaintext stored passwords to hashed on first successful login.
  loginUser: async (req, res) => {
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

      // If bcrypt fails, allow direct plaintext match (temporary migration safety),
      // then upgrade the stored password to a bcrypt hash.
      if (!matched && password === stored) {
        matched = true;
        try {
          const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 8;
          const hashed = await bcrypt.hash(password, saltRounds);
          await supabase.from('Users').update({ password: hashed }).eq('id', user.id);
          console.log(`Upgraded password to hashed for user ${user.id}`);
        } catch (upgradeErr) {
          console.warn('Failed to upgrade plaintext password for user', user.id, upgradeErr.message || upgradeErr);
        }
      }

      if (!matched) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const payload = { id: user.id, username: user.username };
      const token = jwtUtils.generateToken(payload, '8h');


      // don't leak password
      delete user.password;

      res.json({
        success: true,
        accessToken: token, // renamed for frontend
        data: user
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = userController;
// ...existing code...