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
          .eq('barcode', b)
          .neq('is_deleted', true); // Add this filter

        if (error) throw error;
        return res.json({ success: true, data: data, count: data.length });
      }

      if (name) {
        const n = cleanInput(name);
        const { data, error } = await supabase
          .from('Products')
          .select('*')
          .ilike('name', `%${n}%`)
          .neq('is_deleted', true) // Add this filter
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json({ success: true, data: data, count: data.length });
      }

      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .neq('is_deleted', true) // Add this filter
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: data, count: data.length });
    } catch (error) {
      console.error("getAllProducts error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  },

  // Create product (normalizes barcode) - DUPLICATE NAMES NOW ALLOWED
  createProduct: async (req, res) => {
    try {
      const { name, barcode, category_id, price, quantity } = req.body;

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

      const normalizedBarcode = cleanInput(barcode);
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
          .insert([
            { name: trimmedName, barcode: normalizedBarcode, category_id: catNum, price: priceNum, quantity: qtyNum }
          ])
          .select()
          .single();

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
  }
};

module.exports = productController;