const { supabase } = require('../config/db');

const salesItemsController = {
  getSalesItems: async (req, res) => {
    try {
      const { from, to } = req.query;

      let fromStartIso, toEndIso;
      if (from) {
        const parsedFrom = new Date(from);
        if (!isNaN(parsedFrom)) {
          parsedFrom.setHours(0, 0, 0, 0);
          fromStartIso = parsedFrom.toISOString();
        }
      }
      if (to) {
        const parsedTo = new Date(to);
        if (!isNaN(parsedTo)) {
          parsedTo.setHours(23, 59, 59, 999);
          toEndIso = parsedTo.toISOString();
        }
      }
      if (!fromStartIso) fromStartIso = new Date(0).toISOString();
      if (!toEndIso) {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        toEndIso = now.toISOString();
      }

      const { data, error } = await supabase.rpc('get_sales_items_aggregated', {
        from_date: fromStartIso,
        to_date: toEndIso,
      });

      if (error) throw error;

      return res.json({
        success: true,
        data: data || [],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },
};

module.exports = salesItemsController;
