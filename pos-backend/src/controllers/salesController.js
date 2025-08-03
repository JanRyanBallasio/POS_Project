const { supabase } = require("../config/db");

const salesController = {
  createSale: async (req, res) => {
    try {
      const { customer_id, total_purchase, items } = req.body;

      // 1. Insert the sale
      const { data: saleData, error: saleError } = await supabase
        .from("Sales")
        .insert([{ customer_id, total_purchase }])
        .select("id") // Get the inserted sale's id
        .single();

      if (saleError) throw saleError;
      const sale_id = saleData.id;

      // 2. Insert sale items
      if (Array.isArray(items) && items.length > 0) {
        const saleItems = items.map(item => ({
          sale_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("SaleItems")
          .insert(saleItems);

        if (itemsError) throw itemsError;
      }

      res.json({ success: true, sale_id });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = salesController;