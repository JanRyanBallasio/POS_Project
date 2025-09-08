const { supabase } = require("../config/db");

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
        const { error: updateError } = await supabase
          .rpc('decrease_product_quantity', {
            product_id_param: item.product_id,
            quantity_to_subtract: item.quantity
          });

        if (updateError) {
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
        }
      });

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      // 4. AWARD CUSTOMER POINTS (1 peso = 1 point)
      if (customer_id && total_purchase > 0) {
        console.log("🎯 Awarding customer points...");
        
        const pointsToAward = Math.floor(total_purchase); // 1 peso = 1 point (round down)
        
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
      console.log("❌ SALES CREATION FAILED:", error.message);
      console.log("Error details:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getSales: async (req, res) => {
    try {
      const { data, error } = await supabase.from("Sales").select("*");
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
};

module.exports = salesController;