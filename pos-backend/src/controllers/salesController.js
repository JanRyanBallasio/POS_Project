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

      const updatePromises = items.map(async (item) => {
        // Get current quantity and update in single query using RPC
        // const { error: updateError } = await supabase
        //   .rpc('decrease_product_quantity', {
        //     product_id_param: item.product_id,
        //     quantity_to_subtract: item.quantity
        //   });

        // if (updateError) {
        // Fallback to manual update if RPC fails
        const { data: currentProduct, error: fetchError } = await supabase
          .from("Products")
          .select("quantity")
          .eq("id", item.product_id)
          .single();

        if (!fetchError) {
          const currentQuantity = Number(currentProduct.quantity) || 0;
          const newQuantity = Math.max(0, currentQuantity - item.quantity);

          await supabase
            .from("Products")
            .update({ quantity: newQuantity })
            .eq("id", item.product_id);
        }
        // }
      });

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      // 4. AWARD CUSTOMER POINTS (₱1000 = 10 points)
      if (customer_id && total_purchase > 0) {
        console.log("🎯 Awarding customer points...");

        // 1000 = 10 points → 1 point = 100.
        // Allow decimals: points = total_purchase / 100
        const pointsToAwardRaw = Number(parseFloat(total_purchase));
        const pointsToAward = Number.isFinite(pointsToAwardRaw) ? pointsToAwardRaw / 100 : 0;
        // Keep a reasonable number of decimals (optional) — store raw float to DB
        console.log(`ℹ️ Points to award (raw): ${pointsToAward}`);

        // Get current customer points
        const { data: currentCustomer, error: customerFetchError } = await supabase
          .from("Customer")
          .select("points")
          .eq("id", customer_id)
          .single();

        if (customerFetchError) {
          console.log("⚠️ Could not fetch customer points:", customerFetchError);
        } else {
          const currentPoints = Number(currentCustomer.points) || 0;
          const newPoints = currentPoints + pointsToAward;

          const { error: pointsUpdateError } = await supabase
            .from("Customer")
            .update({ points: newPoints })
            .eq("id", customer_id);

          if (pointsUpdateError) {
            console.log("❌ Failed to update customer points:", pointsUpdateError);
          } else {
            console.log(`✅ Customer points updated: ${currentPoints} + ${pointsToAward} = ${newPoints}`);
          }
        }
      }

      console.log("=== SALES CREATION COMPLETED ===");
      res.json({ success: true, sale_id });
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

  // New endpoint for sales totals using the get_sales_totals function
  getSalesTotals: async (req, res) => {
    try {
      let { from, to } = req.query;

      // Default to Manila calendar day (converted to UTC) if not provided
      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      // Call the get_sales_totals function
      const { data, error } = await supabase.rpc('get_sales_totals', {
        from_date: from,
        to_date: to
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

  // Fixed endpoint for category analytics using get_sales_totals
  getCategoryAnalytics: async (req, res) => {
    try {
      let { from, to } = req.query;

      // Default to Manila calendar day (converted to UTC) if not provided
      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      // Get sales totals first - this is the correct total that matches Sales Chart
      const { data: salesTotals, error: salesError } = await supabase.rpc('get_sales_totals', {
        from_date: from,
        to_date: to
      });

      if (salesError) throw salesError;

      // Get category breakdown for the same period - FIXED: Use LEFT JOIN to include ALL items
      const { data: categoryData, error: categoryError } = await supabase
        .from('SaleItems')
        .select(`
          quantity,
          price,
          Products!left(category_id, Categories!left(name)),
          Sales!inner(created_at)
        `)
        .gte('Sales.created_at', from)
        .lt('Sales.created_at', to);

      if (categoryError) throw categoryError;

      // Group by category and calculate totals
      const categoryMap = new Map();
      categoryData.forEach(item => {
        // Handle missing category data - group as "Uncategorized"
        const category = item.Products?.Categories?.name || 'Uncategorized';
        const total = (item.quantity || 0) * (item.price || 0);
        
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            total_sales: 0,
            total_items: 0
          });
        }
        
        const existing = categoryMap.get(category);
        existing.total_sales += total;
        existing.total_items += item.quantity || 0;
      });

      const result = Array.from(categoryMap.values());

      return res.json({ 
        success: true, 
        data: {
          salesTotals: salesTotals || [], // This contains the correct total from get_sales_totals
          categoryAnalytics: result
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },
};

module.exports = salesController;