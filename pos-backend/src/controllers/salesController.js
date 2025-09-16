const { supabase } = require('../config/db');

/**
 * Compute UTC ISO range that corresponds to "today" in Asia/Manila (UTC+8).
 * Returns { from, to } where:
 *  - from is inclusive (Manila 00:00:00.000 -> converted to UTC)
 *  - to is exclusive (Manila next day 00:00:00.000 -> converted to UTC)
 */
const getManilaDayRangeAsUTC = () => {
  const OFFSET_MS = 8 * 60 * 60 * 1000; // Manila is UTC+8

  // shift now to Manila local time
  const manilaNow = new Date(Date.now() + OFFSET_MS);

  const y = manilaNow.getUTCFullYear();
  const m = manilaNow.getUTCMonth();
  const d = manilaNow.getUTCDate();

  // Manila midnight in UTC ms:
  // Date.UTC(y,m,d,0,0,0) is the epoch for that date at 00:00 UTC,
  // subtract OFFSET_MS to get the UTC time that corresponds to Manila 00:00.
  const manilaMidnightUTCms = Date.UTC(y, m, d, 0, 0, 0) - OFFSET_MS;
  const nextMidnightUTCms = manilaMidnightUTCms + 24 * 60 * 60 * 1000;

  return {
    from: new Date(manilaMidnightUTCms).toISOString(), // inclusive
    to: new Date(nextMidnightUTCms).toISOString(),     // exclusive
  };
};

const salesController = {
  createSale: async (req, res) => {
    try {
      console.log("=== SALES CREATION STARTED ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const { customer_id, total_purchase, items } = req.body;

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        console.log("❌ No items provided or items is not an array");
        return res.status(400).json({ success: false, error: "Items array is required" });
      }

      console.log("📝 Items to process:", items.length);

      // 1. Insert the sale
      // IMPORTANT: don't set created_at here — let DB default now() (UTC) handle timestamp
      console.log("🔄 Creating sale record...");
      const { data: saleData, error: saleError } = await supabase
        .from("Sales")
        .insert([{ customer_id, total_purchase }])
        .select("id")
        .single();

      if (saleError) {
        console.log("❌ Sale creation error:", saleError);
        throw saleError;
      }

      const sale_id = saleData.id;
      console.log("✅ Sale created with ID:", sale_id);

      // 2. Insert sale items
      console.log("🔄 Creating sale items...");
      const saleItems = items.map(item => ({
        sale_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      console.log("📝 Sale items to insert:", JSON.stringify(saleItems, null, 2));

      const { error: itemsError } = await supabase
        .from("SaleItems")
        .insert(saleItems);

      if (itemsError) {
        console.log("❌ Sale items creation error:", itemsError);
        throw itemsError;
      }

      console.log("✅ Sale items created successfully");

      // 3. UPDATE PRODUCT QUANTITIES
      console.log("🔄 Starting product quantity updates...");

      // OPTIMIZATION: Batch update instead of individual queries
      const productUpdates = items.map(item => ({
        id: item.product_id,
        quantity_to_subtract: item.quantity
      }));

      // Use a single query with CASE statements or batch update
      const updatePromises = productUpdates.map(async (update) => {
        const { data: currentProduct, error: fetchError } = await supabase
          .from("Products")
          .select("quantity")
          .eq("id", update.id)
          .single();

        if (!fetchError) {
          const currentQuantity = Number(currentProduct.quantity) || 0;
          const newQuantity = Math.max(0, currentQuantity - update.quantity_to_subtract);

          await supabase
            .from("Products")
            .update({ quantity: newQuantity })
            .eq("id", update.id);
        }
      });

      // Execute all updates in parallel
      await Promise.all(updatePromises);


      // 4. AWARD CUSTOMER POINTS (₱1000 = 10 points)
      let updatedCustomer = null;
      if (customer_id && total_purchase > 0) {
        console.log("🎯 Awarding customer points...");

        const pointsToAward = Number.isFinite(total_purchase) ? total_purchase / 100 : 0;

        // OPTIMIZATION: Use RPC function for atomic update
        const { error: pointsUpdateError } = await supabase
          .rpc('add_customer_points', {
            customer_id_param: customer_id,
            points_to_add: pointsToAward
          });

        if (pointsUpdateError) {
          console.log("❌ Failed to update customer points:", pointsUpdateError);
        } else {
          console.log(`✅ Customer points updated: +${pointsToAward}`);

          // Fetch updated customer data
          const { data: customerData, error: customerFetchError } = await supabase
            .from("Customer")
            .select("*")
            .eq("id", customer_id)
            .single();

          if (!customerFetchError) {
            updatedCustomer = customerData;
          }
        }
      }

      console.log("=== SALES CREATION COMPLETED ===");
      res.json({
        success: true,
        sale_id,
        data: {
          customer: updatedCustomer
        }
      });
    } catch (error) {
      console.log("❌ SALES CREATION FAILED:", error && error.message ? error.message : error);
      console.log("Error details:", error);
      res.status(500).json({ success: false, error: (error && error.message) || String(error) });
    }
  },

  getSales: async (req, res) => {
    try {
      let { from, to } = req.query;

      // Default to Manila calendar day (converted to UTC) if not provided
      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      // Query using UTC timestamps that correspond to Manila's 00:00 - 24:00 range.
      // Use >= from and < to (exclusive upper bound) to avoid ms-precision edge cases.
      const { data, error } = await supabase
        .from('Sales')
        .select('*')
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: false });

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

module.exports = salesController;