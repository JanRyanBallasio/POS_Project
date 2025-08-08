const { supabase } = require("../config/db");

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("Users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        count: data.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};

module.exports = userController;
