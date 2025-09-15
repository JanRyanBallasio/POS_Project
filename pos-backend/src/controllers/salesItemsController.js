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

      console.log('Sales items query params:', { from, to });

      // TEMPORARY FIX: Skip RPC and use direct query to ensure consistency
      // TODO: Fix the RPC function get_sales_items_aggregated
      console.log('Using direct query instead of RPC for consistency');
      
      // Direct SQL query to aggregate sales items by category
      const { data, error } = await supabase
        .from('SaleItems')
        .select(`
          quantity,
          price,
          created_at,
          Products!inner(
            category_id,
            Categories!inner(name)
          ),
          Sales!inner(created_at)
        `)
        .gte('Sales.created_at', from)
        .lte('Sales.created_at', to);

      if (error) throw error;

      console.log('Direct query result count:', data.length);

      // Aggregate the data by category
      const aggregatedData = {};
      
      data.forEach(item => {
        const categoryName = item.Products.Categories.name;
        const quantity = Number(item.quantity) || 0;
        const totalSales = quantity * (Number(item.price) || 0);
        const lastPurchase = item.Sales.created_at;

        // ADD: Debug logging for Lane 3 specifically
        if (categoryName === 'Lane 3') {
          console.log('Lane 3 item:', {
            product: item.Products?.name || 'Unknown',
            quantity,
            price: item.price,
            totalSales,
            lastPurchase
          });
        }

        if (!aggregatedData[categoryName]) {
          aggregatedData[categoryName] = {
            category: categoryName,
            quantity: 0,
            total_sales: 0,
            last_purchase: lastPurchase
          };
        }

        aggregatedData[categoryName].quantity += quantity;
        aggregatedData[categoryName].total_sales += totalSales;
        
        // Keep the most recent purchase date
        if (new Date(lastPurchase) > new Date(aggregatedData[categoryName].last_purchase)) {
          aggregatedData[categoryName].last_purchase = lastPurchase;
        }
      });

      const result = Object.values(aggregatedData);
      console.log('Aggregated result:', result);

      // ADD: Debug Lane 3 specifically
      const lane3Result = result.find(r => r.category === 'Lane 3');
      if (lane3Result) {
        console.log('Lane 3 final result:', lane3Result);
      } else {
        console.log('Lane 3 not found in results');
      }
      
      // Debug: Log each category's total
      result.forEach(item => {
        console.log(`Category: ${item.category}, Total Sales: ₱${item.total_sales.toLocaleString()}`);
      });
      
      return res.json({ success: true, data: result });
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
          .lte('Sales.created_at', to);

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
};

module.exports = salesItemsController;