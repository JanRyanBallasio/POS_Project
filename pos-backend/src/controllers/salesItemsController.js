const { supabase } = require('../config/db');

/**
 * Compute Manila local-day boundaries as UTC ISO strings.
 */
const getManilaDayRangeAsUTC = () => {
  const OFFSET_MS = 8 * 60 * 60 * 1000;
  const manilaNow = new Date(Date.now() + OFFSET_MS);
  const y = manilaNow.getUTCFullYear();
  const m = manilaNow.getUTCMonth();
  const d = manilaNow.getUTCDate();
  const manilaMidnightUTCms = Date.UTC(y, m, d, 0, 0, 0) - OFFSET_MS;
  const nextMidnightUTCms = manilaMidnightUTCms + 24 * 60 * 60 * 1000;
  return {
    from: new Date(manilaMidnightUTCms).toISOString(),
    to: new Date(nextMidnightUTCms).toISOString(),
  };
};

const salesItemsController = {
  getSalesItems: async (req, res) => {
    try {
      let { from, to } = req.query;

      // Default to Manila calendar day if not provided
      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      // If using RPC that expects from_date/to_date, pass UTC ISO strings
      const { data, error } = await supabase.rpc('get_sales_items_aggregated', {
        from_date: from,
        to_date: to,
      });

      if (error) throw error;

      return res.json({ success: true, data: data || [] });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },
};

module.exports = salesItemsController;
