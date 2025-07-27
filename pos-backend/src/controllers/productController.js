const { supabase } = require('../config/db');

const productController = {
  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .order('created_at', { ascending: false });

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

  createProduct: async (req, res) => {
    try {
      const { name, barcode, category_id, price, quantity } = req.body;
      const { data, error } = await supabase
        .from('Products')
        .insert([
          { name, barcode, category_id, price, quantity }
        ])
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getProductByBarcode: async (req, res) => {
    try {
      const { barcode } = req.params;
      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: `Product with barcode "${barcode}" not found`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = productController;