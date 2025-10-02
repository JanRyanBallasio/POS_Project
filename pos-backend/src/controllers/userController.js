const { supabase } = require("../config/db");

const userController = {
  // Simple user listing (no auth)
  getAllUsers: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("Users")
        .select("id, name, username, created_at") // Don't select password
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        count: (data || []).length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // Simple user creation (no auth, no password hashing)
  createUser: async (req, res) => {
    try {
      const { name, username } = req.body;

      if (!name || !username) {
        return res.status(400).json({ 
          success: false, 
          message: 'name and username are required' 
        });
      }

      // Check for existing username
      const { data: existing, error: existsErr } = await supabase
        .from('Users')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (existsErr) throw existsErr;
      if (existing && existing.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }

      // Create user (no password needed)
      const { data, error } = await supabase
        .from('Users')
        .insert([{ name, username }])
        .select('id, name, username, created_at');

      if (error) throw error;

      res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = userController;