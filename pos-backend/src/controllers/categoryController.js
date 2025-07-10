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
  }
};

module.exports = categoryController;