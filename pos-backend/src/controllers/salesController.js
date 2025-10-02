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

      // 4. AWARD CUSTOMER POINTS (₱100 = 0.01 points)
      if (customer_id && total_purchase > 0) {
        console.log("🎯 Awarding customer points...");

        // 100 pesos = 0.01 points
        // Allow decimals: points = total_purchase / 10000
        const pointsToAwardRaw = Number(parseFloat(total_purchase));
        const pointsToAward = Number.isFinite(pointsToAwardRaw) ? pointsToAwardRaw / 10000 : 0;
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
      
      console.log('�� BACKEND DEBUGGING:')
      console.log('Received query params:', req.query)

      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      console.log('Final query range:', { from, to })
      console.log('Using BATCH FETCHING to get ALL records')
      
      // Batch fetching to get ALL records
      let allSalesData = [];
      let start = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching batch starting at ${start}...`)
        
        const { data: batch, error } = await supabase
          .from('Sales')
          .select('created_at, total_purchase')
          .gte('created_at', from)
          .lt('created_at', to)
          .range(start, start + batchSize - 1)
          .order('created_at', { ascending: true }); // Consistent ordering

        if (error) throw error;

        if (batch && batch.length > 0) {
          allSalesData = allSalesData.concat(batch);
          hasMore = batch.length === batchSize; // Continue if we got a full batch
          start += batchSize;
          console.log(`Got ${batch.length} records, total so far: ${allSalesData.length}`)
        } else {
          hasMore = false;
        }
      }

      console.log('🎉 TOTAL records fetched:', allSalesData.length)

      // Group by Manila date manually
      const grouped = {};
      allSalesData.forEach(sale => {
        const manilaDate = new Date(new Date(sale.created_at).getTime() + 8 * 60 * 60 * 1000);
        const dateKey = manilaDate.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = 0;
        }
        grouped[dateKey] += sale.total_purchase || 0;
      });

      const aggregatedData = Object.entries(grouped)
        .map(([date, total]) => ({
          sale_date: date,
          total_sales: total
        }))
        .sort((a, b) => a.sale_date.localeCompare(b.sale_date));

      console.log('�� Final aggregation:')
      console.log('- Total unique dates:', aggregatedData.length)
      console.log('- Date range:', aggregatedData[0]?.sale_date, 'to', aggregatedData[aggregatedData.length - 1]?.sale_date)
      
      return res.json({ success: true, data: aggregatedData });
    } catch (error) {
      console.error('❌ Sales query error:', error)
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },

  getTodaysStats: async (req, res) => {
    try {
      console.log('📊 Getting today\'s stats...')
      
      // Get Manila day range
      const range = getManilaDayRangeAsUTC();
      const { from, to } = range;
      
      console.log('📊 Stats date range:', { from, to })
      console.log('📊 Current time:', new Date().toISOString())
      console.log('📊 Manila time equivalent:', new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString())

      // 1. Today's Sales Total
      const { data: salesData, error: salesError } = await supabase
        .from('Sales')
        .select('total_purchase, created_at')  // Add created_at to see the actual timestamps
        .gte('created_at', from)
        .lt('created_at', to);

      if (salesError) throw salesError;

      console.log('📊 Raw sales data:', salesData.length, 'records')
      console.log('📊 Sample sales records:', salesData.slice(0, 3))

      const todaysSales = salesData.reduce((sum, sale) => sum + (sale.total_purchase || 0), 0);
      const todaysTransactions = salesData.length;

      // 2. Items Sold Today (total quantity from all sale items)
      const { data: itemsData, error: itemsError } = await supabase
        .from('SaleItems')
        .select(`
          quantity,
          Sales!inner(created_at)
        `)
        .gte('Sales.created_at', from)
        .lt('Sales.created_at', to);

      if (itemsError) throw itemsError;

      const itemsSoldToday = itemsData.reduce((sum, item) => sum + (item.quantity || 0), 0);

      const stats = {
        todaysSales,
        todaysTransactions, 
        itemsSoldToday
      };

      console.log('📊 Stats result:', stats);

      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ Stats error:', error)
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },

  validateDailySalesConsistency: async (req, res) => {
    try {
      let { from, to } = req.query;
      
      // Default to Manila calendar day if not provided
      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      console.log('🔍 Validating sales consistency for range:', { from, to });

      // Get daily total from Sales table (cached values)
      const { data: salesData, error: salesError } = await supabase
        .from('Sales')
        .select('total_purchase, created_at')
        .gte('created_at', from)
        .lt('created_at', to);

      if (salesError) throw salesError;

      const salesTableTotal = salesData.reduce((sum, sale) => 
        sum + (Number(sale.total_purchase) || 0), 0
      );

      // Get total from SaleItems (real calculation)
      const { data: itemsData, error: itemsError } = await supabase
        .from('SaleItems')
        .select(`
          quantity,
          price,
          Sales!inner(created_at)
        `)
        .gte('Sales.created_at', from)
        .lt('Sales.created_at', to);

      if (itemsError) throw itemsError;

      const saleItemsTotal = itemsData.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.price)), 0
      );

      // Get category total (should match saleItemsTotal)
      const { data: categoryData, error: categoryError } = await supabase
        .from('SaleItems')
        .select(`
          quantity,
          price,
          Products!inner(
            category_id,
            Categories!inner(name)
          ),
          Sales!inner(created_at)
        `)
        .gte('Sales.created_at', from)
        .lt('Sales.created_at', to);

      if (categoryError) throw categoryError;

      const categoryTotal = categoryData.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.price)), 0
      );

      const result = {
        sales_table_total: salesTableTotal,
        sale_items_total: saleItemsTotal,
        category_total: categoryTotal,
        sales_vs_items_diff: salesTableTotal - saleItemsTotal,
        items_vs_category_diff: saleItemsTotal - categoryTotal,
        date_range: { from, to },
        validation_timestamp: new Date().toISOString(),
        sales_count: salesData.length,
        items_count: itemsData.length,
        category_items_count: categoryData.length
      };

      console.log('📊 Sales consistency result:', result);
      
      return res.json({ success: true, data: result });

    } catch (error) {
      console.error('❌ Sales consistency validation error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },
};

module.exports = salesController;