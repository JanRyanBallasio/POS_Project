const { supabase } = require('../config/db');

const cleanInput = (v) =>
  v == null ? null : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();

const productController = {
  // Get all products (supports ?barcode= and ?name= filters)
  getAllProducts: async (req, res) => {
    try {
      const { barcode, name } = req.query || {};

      if (barcode) {
        const b = cleanInput(barcode);
        const { data, error } = await supabase
          .from('Products')
          .select('*')
          .eq('barcode', b);

        if (error) throw error;
        return res.json({ success: true, data: data, count: data.length });
      }

      if (name) {
        const n = cleanInput(name);
        const { data, error } = await supabase
          .from('Products')
          .select('*')
          .ilike('name', `%${n}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json({ success: true, data: data, count: data.length });
      }

      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: data, count: data.length });
    } catch (error) {
      console.error("getAllProducts error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Create product (normalizes barcode)
  createProduct: async (req, res) => {
    try {
      const { name, barcode, category_id, price, quantity } = req.body;

      if (!name || String(name).trim() === "") {
        return res.status(400).json({ success: false, field: "name", message: "Product name is required" });
      }

      if (category_id === undefined || category_id === null || String(category_id).trim() === "") {
        return res.status(400).json({ success: false, field: "category_id", message: "Category is required" });
      }
      const catNum = Number(category_id);
      if (isNaN(catNum) || catNum <= 0) {
        return res.status(400).json({ success: false, field: "category_id", message: "Invalid category selected" });
      }

      if (price === undefined || price === null || String(price).trim() === "") {
        return res.status(400).json({ success: false, field: "price", message: "Price is required" });
      }
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, field: "price", message: "Price must be a number >= 0" });
      }

      if (quantity === undefined || quantity === null || String(quantity).trim() === "") {
        return res.status(400).json({ success: false, field: "quantity", message: "Quantity is required" });
      }
      const qtyNum = Number(quantity);
      if (isNaN(qtyNum) || qtyNum < 0) {
        return res.status(400).json({ success: false, field: "quantity", message: "Quantity must be a number >= 0" });
      }

      const normalizedBarcode = cleanInput(barcode);

      const { data, error } = await supabase
        .from('Products')
        .insert([
          { name: String(name).trim(), barcode: normalizedBarcode ?? null, category_id: catNum, price: priceNum, quantity: qtyNum }
        ])
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data: data });
    } catch (error) {
      console.error("createProduct error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Update product (normalizes barcode)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, barcode, category_id, price, quantity } = req.body;
      const normalizedBarcode = cleanInput(barcode);

      const { data, error } = await supabase
        .from('Products')
        .update({ name, barcode: normalizedBarcode ?? null, category_id, price, quantity })
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
      const { error } = await supabase
        .from('Products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ success: true, message: `Product with id "${id}" deleted` });
    } catch (error) {
      console.error("deleteProduct error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Get product by id
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: `Product with id "${id}" not found` });

      res.json({ success: true, data: data });
    } catch (error) {
      console.error("getProductById error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Get product by barcode (exact match preferred). Returns 404 when not found.
  getProductByBarcode: async (req, res) => {
    try {
      const rawBarcode = req.params?.barcode;
      const barcode = cleanInput(rawBarcode);

      console.log(`[productController] getProductByBarcode - rawParam: ${JSON.stringify(rawBarcode)}, cleaned: "${barcode}"`);

      if (!barcode) {
        return res.status(400).json({ success: false, message: "Barcode is required" });
      }

      // Exact equality
      const { data: exactData, error: exactError } = await supabase
        .from('Products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();

      if (exactError) {
        console.error("[productController] supabase exact query error:", exactError);
        throw exactError;
      }

      if (exactData) {
        console.log("[productController] exact match found:", exactData);
        return res.json({ success: true, data: exactData });
      }

      // Defensive: try ilike (debug only) to surface odd DB values (do not rely on this for production matching)
      console.log("[productController] exact match not found, trying defensive ilike search (debug)");
      const { data: searchData, error: searchError } = await supabase
        .from('Products')
        .select('*')
        .ilike('barcode', `%${barcode}%`)
        .order('created_at', { ascending: false });

      if (searchError) {
        console.error("[productController] supabase search query error:", searchError);
        throw searchError;
      }

      console.log(`[productController] defensive search returned ${Array.isArray(searchData) ? searchData.length : 0} rows`);

      if (Array.isArray(searchData) && searchData.length > 0) {
        console.warn("[productController] returning first search match (defensive) - check database normalization for barcodes", searchData[0]);
        return res.json({ success: true, data: searchData[0] });
      }

      // Not found
      console.log(`[productController] product not found for barcode "${barcode}"`);
      return res.status(404).json({ success: false, message: `Product with barcode "${barcode}" not found` });
    } catch (error) {
      console.error("getProductByBarcode error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  }
};

module.exports = productController;