const { supabase } = require('../config/db');

const salesItemsController = {
    getSalesItems: async (req, res) => {
        try {
            const { data, error } = await supabase.from("SaleItems").select("*");
            if (error) throw error;
            res.json({
                success: true,
                data: data,
                count: data.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
}

module.exports = salesItemsController;
