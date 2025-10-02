const { supabase } = require('../config/db');

const cleanInput = (v) =>
  v == null ? null : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();

const productController = {
  // Get all products (supports ?barcode= and ?name= filters)
  // Get all products (supports ?barcode=, ?name= filters, and pagination with ?page=&limit=)
  getAllProducts: async (req, res) => {
    try {
      const { barcode, name } = req.query || {};

      // Support limit=all to return every row
      const rawLimit = typeof req.query?.limit === "undefined" ? undefined : String(req.query.limit);
      const isAll = rawLimit?.toLowerCase() === "all";

      // parse pagination params when not asking for all
      let page = 1;
      let limit = 50;
      if (!isAll) {
        page = parseInt(String(req.query?.page ?? "1"), 10) || 1;
        limit = parseInt(String(req.query?.limit ?? "50"), 10) || 50;
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // fast path: single barcode lookup (returns single item)
      if (barcode) {
        const b = cleanInput(barcode);
        const { data, error } = await supabase
          .from('Products')
          .select('*')
          .eq('barcode', b)
          .neq('is_deleted', true)
          .maybeSingle();

        if (error) throw error;
        return res.json({
          success: true,
          data: data ? [data] : [],
          count: data ? 1 : 0,
          page: 1,
          totalPages: data ? 1 : 0
        });
      }

      // helper to fetch all rows in batches of up to 1000
      const fetchAllInBatches = async (baseQueryBuilder, total) => {
        const BATCH_SIZE = 1000; // Supabase/PostgREST limit per range request
        const all = [];
        for (let offset = 0; offset < total; offset += BATCH_SIZE) {
          const start = offset;
          const end = Math.min(offset + BATCH_SIZE - 1, total - 1);
          const { data: chunk, error: chunkErr } = await baseQueryBuilder.range(start, end);
          if (chunkErr) throw chunkErr;
          if (Array.isArray(chunk) && chunk.length > 0) {
            all.push(...chunk);
          }
          // if chunk is empty early-exit (defensive)
          if (!chunk || chunk.length === 0) break;
        }
        return all;
      };

      // filtered by name
      if (name) {
        const n = cleanInput(name);

        // get exact count for filtered set
        const head = await supabase
          .from('Products')
          .select('id', { count: 'exact', head: true })
          .ilike('name', `%${n}%`)
          .neq('is_deleted', true);

        if (head.error) throw head.error;
        const total = head.count ?? 0;
        if (total === 0) return res.json({ success: true, data: [], count: 0 });

        const baseQry = supabase
          .from('Products')
          .select('*')
          .ilike('name', `%${n}%`)
          .neq('is_deleted', true)
          .order('created_at', { ascending: false });

        let data;
        if (isAll) {
          data = await fetchAllInBatches(baseQry, total);
        } else {
          const { data: pageData, error } = await baseQry.range(from, to);
          if (error) throw error;
          data = pageData ?? [];
        }

        const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / limit));
        return res.json({ success: true, data: data, count: total, page: isAll ? 1 : page, totalPages });
      }

      // no filter: count then fetch (all or page)
      const head = await supabase
        .from('Products')
        .select('id', { count: 'exact', head: true })
        .neq('is_deleted', true);

      if (head.error) throw head.error;
      const total = head.count ?? 0;
      if (total === 0) return res.json({ success: true, data: [], count: 0 });

      const baseQry = supabase
        .from('Products')
        .select('*')
        .neq('is_deleted', true)
        .order('created_at', { ascending: false });

      let data;
      if (isAll) {
        data = await fetchAllInBatches(baseQry, total);
      } else {
        // If requested range starts beyond total, return empty page
        if (from >= total) {
          const totalPages = Math.max(1, Math.ceil(total / limit));
          return res.json({ success: true, data: [], count: total, page, totalPages });
        }
        const { data: pageData, error } = await baseQry.range(from, to);
        if (error) throw error;
        data = pageData ?? [];
      }

      const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / limit));
      return res.json({ success: true, data: data, count: total, page: isAll ? 1 : page, totalPages });
    } catch (error) {
      console.error("getAllProducts error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  getProductsByCategory: async (req, res) => {
    try {
      const { category, from, to } = req.query;
      if (!category) {
        return res.status(400).json({ success: false, message: "Category required" });
      }

      // If from/to not provided, default to whole range
      const from_date = from && from !== '' ? from : '1970-01-01T00:00:00Z';
      const to_date = to && to !== '' ? to : new Date().toISOString();

      console.log("RPC Params:", { from_date, to_date, category });

      const { data, error } = await supabase.rpc('get_products_by_category', {
        from_date,
        to_date,
        category_name: category
      });

      if (error) throw error;

      return res.json({ success: true, data: data || [] });
    } catch (err) {
      console.error("getProductsByCategory error:", err);
      return res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  },


  // Create product (normalizes barcode) - DUPLICATE NAMES NOW ALLOWED
  createProduct: async (req, res) => {
    try {
      const { name, barcode, category_id, price, quantity, unit } = req.body;
      const normalizedBarcode = cleanInput(barcode);

      console.log("Creating product:", { name, barcode, category_id, price, quantity });

      if (!name || String(name).trim() === "") {
        return res.status(400).json({ success: false, field: "name", message: "Product name is required" });
      }

      const trimmedName = String(name).trim();

      // ✅ REMOVED: Duplicate name validation - now allowing duplicate names
      // This section has been removed to allow multiple products with the same name
      // Only barcode uniqueness is enforced for inventory management

      if (!barcode || String(barcode).trim() === "") {
        return res.status(400).json({ success: false, field: "barcode", message: "Barcode is required" });
      }

      if (!normalizedBarcode) {
        return res.status(400).json({ success: false, field: "barcode", message: "Barcode is required" });
      }

      // ✅ KEEP: Duplicate barcode validation - barcodes must remain unique
      try {
        const { data: existingBarcode, error: barcodeCheckError } = await supabase
          .from('Products')
          .select('id, barcode')
          .eq('barcode', normalizedBarcode)
          .limit(1);

        if (barcodeCheckError) {
          console.error("Barcode check error:", barcodeCheckError);
          return res.status(500).json({ success: false, message: "Database error while checking barcode" });
        }

        if (existingBarcode && existingBarcode.length > 0) {
          console.log("Duplicate barcode found:", existingBarcode[0]);
          return res.status(400).json({
            success: false,
            field: "barcode",
            message: "A product with this barcode already exists"
          });
        }
      } catch (barcodeError) {
        console.error("Barcode validation error:", barcodeError);
        return res.status(500).json({ success: false, message: "Error validating barcode" });
      }

      // Validate other fields...
      if (category_id === undefined || category_id === null || String(category_id).trim() === "") {
        return res.status(400).json({ success: false, field: "category_id", message: "Category is required" });
      }
      const catNum = Number(category_id);
      if (isNaN(catNum) || catNum <= 0) {
        return res.status(400).json({ success: false, field: "category_id", message: "Please select a valid category" });
      }

      if (price === undefined || price === null || String(price).trim() === "") {
        return res.status(400).json({ success: false, field: "price", message: "Price is required" });
      }
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, field: "price", message: "Price must be 0 or greater" });
      }

      if (quantity === undefined || quantity === null || String(quantity).trim() === "") {
        return res.status(400).json({ success: false, field: "quantity", message: "Quantity is required" });
      }
      const qtyNum = Number(quantity);
      if (isNaN(qtyNum) || qtyNum < 0) {
        return res.status(400).json({ success: false, field: "quantity", message: "Quantity must be 0 or greater" });
      }

      // Create product with unique barcode but allowing duplicate names
      try {
        const { data, error } = await supabase
          .from('Products')
          .insert({
            name,
            barcode: normalizedBarcode ?? null,
            category_id,
            price,
            quantity,
            unit: unit || 'pcs', // Change to lowercase
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error("Supabase insert error:", error);

          // Handle database constraint errors
          if (error.code === '23505') { // PostgreSQL unique constraint violation
            if (error.message.includes('barcode')) {
              return res.status(400).json({
                success: false,
                field: "barcode",
                message: "A product with this barcode already exists"
              });
            }
            // Note: No longer checking for name uniqueness constraint
          }

          // Generic database error
          return res.status(500).json({
            success: false,
            message: "Database error while creating product"
          });
        }

        console.log("Product created successfully:", data);
        res.json({ success: true, data: data });

      } catch (insertError) {
        console.error("Product creation error:", insertError);
        return res.status(500).json({
          success: false,
          message: "Failed to create product in database"
        });
      }

    } catch (error) {
      console.error("createProduct general error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating product"
      });
    }
  },

  // Update product (normalizes barcode)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, barcode, category_id, price, quantity, unit } = req.body;
      const normalizedBarcode = cleanInput(barcode);

      const { data, error } = await supabase
        .from('Products')
        .update({ 
          name, 
          barcode: normalizedBarcode ?? null, 
          category_id, 
          price, 
          quantity,
          unit: unit || 'pcs' // Change to lowercase
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: `Product with id "${id}" not found` });

      res.json({ success: true, data: data });
    } catch (error) {
      console.error("updateProduct error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists first
      const { data: existingProduct, error: checkError } = await supabase
        .from('Products')
        .select('id, name')
        .eq('id', id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: `Product with id "${id}" not found`
        });
      }

      // Check references in StockItems
      const { data: stockRefs, error: stockErr } = await supabase
        .from('StockItems')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (stockErr) {
        console.error('check StockItems error:', stockErr);
        throw stockErr;
      }

      // Check references in SaleItems
      const { data: saleRefs, error: saleErr } = await supabase
        .from('SaleItems')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (saleErr) {
        console.error('check SaleItems error:', saleErr);
        throw saleErr;
      }

      // If has references, add is_deleted flag (soft delete)
      if ((stockRefs && stockRefs.length > 0) || (saleRefs && saleRefs.length > 0)) {
        const { error: updateError } = await supabase
          .from('Products')
          .update({
            quantity: 0, // Set quantity to 0
            is_deleted: true,
            deleted_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) throw updateError;

        return res.json({
          success: true,
          message: `Product "${existingProduct.name}" has been marked as deleted due to existing sales/stock history`,
          soft_deleted: true
        });
      }

      // No references found - safe to permanently delete
      const { error } = await supabase
        .from('Products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: `Product "${existingProduct.name}" has been permanently deleted`,
        hard_deleted: true
      });

    } catch (error) {
      console.error("deleteProduct error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error"
      });
    }
  },

  // Get product by id - also filter deleted products
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .eq('id', id)
        .neq('is_deleted', true) // Add this filter
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: `Product with id "${id}" not found` });

      res.json({ success: true, data: data });
    } catch (error) {
      console.error("getProductById error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Get product by barcode - also filter deleted products
  getProductByBarcode: async (req, res) => {
    try {
      const rawBarcode = req.params?.barcode;
      console.log("🔍 Backend: Raw barcode received:", rawBarcode);

      const barcode = cleanInput(rawBarcode);
      console.log("🧹 Backend: Cleaned barcode:", barcode);

      if (!barcode) {
        console.log("❌ Backend: Empty barcode");
        return res.status(400).json({ success: false, message: "Barcode is required" });
      }

      console.log("🔍 Backend: Searching for barcode:", barcode);

      // Try exact match first
      const { data: exactData, error: exactError } = await supabase
        .from('Products')
        .select('id, name, barcode, price, quantity, category_id, created_at')
        .eq('barcode', barcode)
        .neq('is_deleted', true) // Add this filter
        .maybeSingle();

      if (exactError) {
        console.error("❌ Backend: supabase exact query error:", exactError);
        throw exactError;
      }

      if (exactData) {
        console.log("✅ Backend: Found exact match:", exactData);
        return res.json({ success: true, data: exactData });
      }

      // Try normalized match (remove leading zeros)
      const normalizedBarcode = barcode.replace(/^0+/, '') || '0';
      console.log("🔢 Backend: Trying normalized barcode:", normalizedBarcode);

      if (normalizedBarcode !== barcode) {
        const { data: normalizedData, error: normalizedError } = await supabase
          .from('Products')
          .select('id, name, barcode, price, quantity, category_id, created_at')
          .eq('barcode', normalizedBarcode)
          .neq('is_deleted', true) // Add this filter
          .maybeSingle();

        if (!normalizedError && normalizedData) {
          console.log("✅ Backend: Found normalized match:", normalizedData);
          return res.json({ success: true, data: normalizedData });
        }
      }

      // Not found
      console.log("❌ Backend: No product found for barcode:", barcode);
      return res.status(404).json({ success: false, message: `Product with barcode "${barcode}" not found` });
    } catch (error) {
      console.error("❌ Backend: getProductByBarcode error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },
  searchProducts: async (req, res) => {
    try {
      const { q } = req.query || {};
      if (!q || String(q).trim().length < 2) {
        return res.json({ success: true, data: [] });
      }

      const term = cleanInput(q);
      const trimmedTerm = term.trim();
      
      // Strategy 1: Exact barcode match (highest priority for scanners)
      if (/^\d+$/.test(trimmedTerm) || trimmedTerm.length >= 8) {
        const { data: barcodeResults, error: barcodeError } = await supabase
          .from("Products")
          .select("id, name, barcode, price, quantity, category_id")
          .eq("barcode", trimmedTerm)
          .neq("is_deleted", true)
          .limit(1);

        if (!barcodeError && barcodeResults?.length > 0) {
          return res.json({ 
            success: true, 
            data: barcodeResults,
            searchType: 'barcode_exact'
          });
        }
      }

      // Strategy 2: Full-text search using PostgreSQL's websearch
      try {
        const { data: fullTextResults, error: fullTextError } = await supabase
          .from("Products")
          .select("id, name, barcode, price, quantity, category_id")
          .textSearch('search_vector', trimmedTerm, {
            type: 'websearch',
            config: 'english'
          })
          .neq("is_deleted", true)
          .limit(20);

        if (!fullTextError && fullTextResults?.length > 0) {
          return res.json({ 
            success: true, 
            data: fullTextResults,
            searchType: 'fulltext'
          });
        }
      } catch (fullTextError) {
        console.log('Full-text search not available, falling back to ILIKE');
      }

      // Strategy 3: ILIKE search with trigram ranking
      const { data: ilikeResults, error: ilikeError } = await supabase
        .from("Products")
        .select("id, name, barcode, price, quantity, category_id")
        .or(`name.ilike.%${trimmedTerm}%,barcode.ilike.%${trimmedTerm}%`)
        .neq("is_deleted", true)
        .order("name", { ascending: true })
        .limit(50);

      if (ilikeError) throw ilikeError;

      // Apply client-side ranking for better results
      const rankedResults = (ilikeResults || []).map(product => ({
        ...product,
        matchScore: calculateMatchScore(product, trimmedTerm)
      })).sort((a, b) => b.matchScore - a.matchScore);

      res.json({ 
        success: true, 
        data: rankedResults.slice(0, 50),
        searchType: 'ilike'
      });

    } catch (error) {
      console.error("searchProducts error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Internal server error" 
      });
    }
  },

};

// Helper function to calculate match score (moved outside the controller object)
function calculateMatchScore(product, term) {
  let score = 0;
  const lowerTerm = term.toLowerCase();
  const lowerName = product.name.toLowerCase();
  const lowerBarcode = (product.barcode || '').toLowerCase();

  // Exact matches get highest score
  if (lowerName === lowerTerm) score += 100;
  if (lowerBarcode === lowerTerm) score += 100;

  // Starts with gets high score
  if (lowerName.startsWith(lowerTerm)) score += 50;
  if (lowerBarcode.startsWith(lowerTerm)) score += 50;

  // Contains gets medium score
  if (lowerName.includes(lowerTerm)) score += 25;
  if (lowerBarcode.includes(lowerTerm)) score += 25;

  // Bonus for shorter names (more specific matches)
  if (lowerName.length < 20) score += 10;

  return score;
}

module.exports = productController;