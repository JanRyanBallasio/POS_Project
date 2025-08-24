const { supabase } = require('../config/db');

const categoryController = {
  // Get all categories
  getAllCategories: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('Categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        count: data.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ success: false, message: "Name is required" });

      const { data, error } = await supabase
        .from("Categories")
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

};

module.exports = categoryController;