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

      console.log('🔎 [getSalesItems] Params:', { from, to });

      // Unified RPC for category aggregation (includes 'Uncategorized')
      const { data, error } = await supabase.rpc('get_sales_items_analytics', {
        from_date: from,
        to_date: to,
        group_by: 'category',
        category_name: null
      });
      if (error) throw error;

      console.log('📦 [getSalesItems] RPC rows:', data?.length || 0);
      if ((data || []).length > 0) {
        console.log('📦 [getSalesItems] First 3 rows:', (data || []).slice(0, 3));
      }

      const result = (data || []).map(row => ({
        category: row.key,
        quantity: Number(row.qty) || 0,
        total_sales: Number(row.total) || 0,
        last_purchase: row.last_purchase
      }));

      // Authoritative total for the chart footer
      const grand_total = (data || []).reduce((sum, row) => sum + (Number(row.total) || 0), 0);
      console.log('🧮 [getSalesItems] grand_total:', grand_total);

      return res.json({ success: true, data: result, grand_total });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },

  // New endpoint for getting products by category
  getProductsByCategory: async (req, res) => {
    try {
      const { category_name, from_date, to_date } = req.query;

      if (!category_name) {
        return res.status(400).json({
          success: false,
          error: "category_name is required"
        });
      }

      // Default to Manila calendar day if not provided
      let from = from_date;
      let to = to_date;
      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      // Try RPC first, fallback to direct query if it fails
      try {
        const { data, error } = await supabase.rpc('get_products_by_category', {
          category_name: category_name,
          from_date: from,
          to_date: to,
        });

        if (error) throw error;

        return res.json({ success: true, data: data || [] });
      } catch (rpcError) {
        console.log('RPC failed, falling back to direct query:', rpcError.message);
        
        // Fallback: Direct SQL query to get products by category
        const { data, error } = await supabase
          .from('SaleItems')
          .select(`
            quantity,
            price,
            created_at,
            Products!inner(
              name,
              unit,
              Categories!inner(name)
            ),
            Sales!inner(created_at)
          `)
          .eq('Products.Categories.name', category_name)
          .gte('Sales.created_at', from)
          .lt('Sales.created_at', to);

        if (error) throw error;

        // Aggregate the data by product
        const aggregatedData = {};
        
        data.forEach(item => {
          const productName = item.Products.name;
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const total = quantity * price;
          const unit = item.Products.unit || 'pcs';
          const lastPurchase = item.Sales.created_at;

          if (!aggregatedData[productName]) {
            aggregatedData[productName] = {
              product_name: productName,
              qty: 0,
              price: price,
              total: 0,
              unit: unit,
              last_purchase: lastPurchase
            };
          }

          aggregatedData[productName].qty += quantity;
          aggregatedData[productName].total += total;
          
          // Keep the most recent purchase date
          if (new Date(lastPurchase) > new Date(aggregatedData[productName].last_purchase)) {
            aggregatedData[productName].last_purchase = lastPurchase;
          }
        });

        const result = Object.values(aggregatedData);
        return res.json({ success: true, data: result });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },

  // NEW: Get individual product sales data for Product Analytics
  getProductSales: async (req, res) => {
    try {
      let { from, to } = req.query;

      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      console.log('🚀 getProductSales called with SQL function!');
      console.log('📅 Exact SQL inputs:', { from, to });
      console.log('📅 Human readable:', {
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString()
      });

      // Use the enhanced SQL function for aggregated totals
      const { data, error } = await supabase.rpc('get_product_sales_totals', {
        from_date: from,
        to_date: to
      });

      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }

      console.log('✅ SQL function result count:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📊 First 3 raw results from SQL:');
        data.slice(0, 3).forEach((item, i) => {
          console.log(`${i + 1}. ${item.product_name}: total_sales=${item.total_sales}, qty=${item.total_quantity}`);
        });
      } else {
        console.log('⚠️ No data returned from SQL function - checking date range...');
        
        // Test with a wider date range to see if it's a timezone issue
        const testResult = await supabase.rpc('get_product_sales_totals', {
          from_date: '2025-08-01T00:00:00.000Z',
          to_date: '2025-11-01T00:00:00.000Z'
        });
        console.log('🧪 Test with wider range returned:', testResult.data?.length || 0, 'products');
      }

      if (!data || data.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Transform to match frontend expectations - FIX field mapping
      const transformedData = data.map(item => ({
        product_id: null,
        product_name: item.product_name,
        category_name: item.category_name,
        quantity: Number(item.total_quantity) || 0,  // ← Fixed mapping
        price: Number(item.average_price) || 0,      // ← Fixed mapping  
        total: Number(item.total_sales) || 0,        // ← Fixed mapping
        unit: item.unit || 'pcs',
        last_purchase: item.last_purchase,
        sale_count: Number(item.sale_count) || 0
      }));

      console.log('🔍 TOP 5 PRODUCTS BY TOTAL SALES (after transform):');
      transformedData.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name}: ₱${product.total.toLocaleString()} (${product.quantity} ${product.unit}, ${product.sale_count} transactions)`);
      });
      
      return res.json({ success: true, data: transformedData });
    } catch (error) {
      console.error('❌ Product sales SQL function error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
      });
    }
  },

  // Get raw sales details for a single product
  getProductDetails: async (req, res) => {
    try {
      const { product_name, from, to } = req.query;
      if (!product_name) {
        return res.status(400).json({ success: false, error: "product_name is required" });
      }

      if (!from || !to) {
        const range = getManilaDayRangeAsUTC();
        from = range.from;
        to = range.to;
      }

      console.log(`Getting details for product: ${product_name}`);

      const { data, error } = await supabase
        .from("SaleItems")
        .select(`
          quantity,
          price,
          created_at,
          Products!inner(name, unit),
          Sales!inner(created_at)
        `)
        .eq("Products.name", product_name)
        .gte("Sales.created_at", from)
        .lt("Sales.created_at", to)
        .order('Sales.created_at', { ascending: false }); // Most recent first

      if (error) throw error;

      const details = data.map(item => ({
        name: item.Products.name,
        qty: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        total: (Number(item.quantity) || 0) * (Number(item.price) || 0),
        unit: item.Products.unit || "pcs",
        last_purchase: item.Sales.created_at
      }));

      console.log(`Found ${details.length} transactions for ${product_name}`);
      return res.json({ success: true, data: details });
    } catch (err) {
      console.error("getProductDetails error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};

module.exports = salesItemsController;