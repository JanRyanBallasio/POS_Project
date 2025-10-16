// ...existing code...
const { supabase } = require('../config/db')
const { DateTime } = require('luxon')

const cleanNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// Helper to get current date/time in Philippine timezone
const getPhilippineDateTime = () => {
  return DateTime.now().setZone('Asia/Manila')
}

// Helper to get just the date part (YYYY-MM-DD) in Philippine timezone
const getPhilippineDate = () => {
  return getPhilippineDateTime().toISODate()
}

const stockTransactionController = {
  // POST /api/stock-transactions
  createStockTransaction: async (req, res) => {
    try {
      const { company_name, total = 0, items = [], percent } = req.body

      if (!company_name || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'company_name and items[] are required' })
      }

      // Always use Philippine timezone for the date
      const philippineDateTime = getPhilippineDateTime()
      const date = philippineDateTime.toISO()

      // insert transaction (include percent if provided)
      const txData = { company_name, date, total: cleanNumber(total) }
      if (percent !== undefined && percent !== null) {
        txData.percent = cleanNumber(percent)
      }

      const { data: tx, error: txErr } = await supabase
        .from('StockTransaction')
        .insert([txData])
        .select()
        .single()

      if (txErr) {
        console.error('insert tx error', txErr)
        return res.status(500).json({ success: false, error: txErr.message || txErr })
      }

      // Only process items if there are any
      let insertedItems = []
      if (items.length > 0) {
        // prepare items
        const itemRows = items.map((it) => ({
          stock_transaction_id: tx.id,
          product_id: it.product_id ?? it.productId ?? null,
          purchased_price: cleanNumber(it.purchased_price ?? it.purchasedPrice ?? it.price ?? 0),
          quantity: parseInt(it.quantity ?? it.qty ?? 0, 10) || 0
        }))

        // batch insert items
        const { data: itemsData, error: itemsErr } = await supabase
          .from('StockItems')
          .insert(itemRows)
          .select()

        if (itemsErr) {
          console.error('insert items error', itemsErr)
          // attempt to cleanup the transaction row (best-effort)
          await supabase.from('StockTransaction').delete().eq('id', tx.id)
          return res.status(500).json({ success: false, error: itemsErr.message || itemsErr })
        }

        insertedItems = itemsData
      }

      // Update product quantities and prices (INCREASE quantity for stock additions, UPDATE price when provided)
      console.log('🔄 Starting product quantity and price updates...');

      const updatePromises = items.map(async (item) => {
        const productId = item.product_id ?? item.productId;
        const quantity = parseInt(item.quantity ?? item.qty ?? 0, 10) || 0;
        const purchasedPrice = cleanNumber(item.purchased_price ?? item.purchasedPrice ?? item.price ?? 0);

        if (productId && quantity > 0) {
          // Get current product data
          const { data: currentProduct, error: fetchError } = await supabase
            .from('Products')
            .select('quantity, price')
            .eq('id', productId)
            .single();

          if (!fetchError && currentProduct) {
            const currentQuantity = Number(currentProduct.quantity) || 0;
            const newQuantity = currentQuantity + quantity;
            const updates = { quantity: newQuantity };

            // Update price if a valid purchasedPrice was provided
            if (Number.isFinite(purchasedPrice) && purchasedPrice >= 0) {
              updates.price = purchasedPrice;
              console.log(`📝 Price set for product ${productId}: ${currentProduct.price} → ${purchasedPrice}`);
            }

            const { error: updateError } = await supabase
              .from('Products')
              .update(updates)
              .eq('id', productId);

            if (updateError) {
              console.error(`Failed to update product ${productId}:`, updateError);
            } else {
              console.log(`✅ Updated product ${productId}: quantity ${currentQuantity} + ${quantity} = ${newQuantity}${updates.price != null ? `, price set to ${updates.price}` : ''}`);
            }
          } else {
            console.error(`Product ${productId} not found or fetch error:`, fetchError);
          }
        }
      });

      await Promise.all(updatePromises);
      console.log('✅ Product quantity and price updates completed');

      return res.status(201).json({ success: true, transaction: tx, items: insertedItems })
    } catch (err) {
      console.error('createStockTransaction error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // GET /api/stock-transactions
  listStockTransactions: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('StockTransaction')
        .select('*')
        .order('date', { ascending: false })
        .limit(200)

      if (error) throw error
      return res.json({ success: true, data })
    } catch (err) {
      console.error('listStockTransactions error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // GET /api/stock-transactions/:id
  // returns transaction and items; items include joined product (id, name) as "product"
  getStockTransaction: async (req, res) => {
    try {
      const { id } = req.params
      const { data: tx, error: txErr } = await supabase
        .from('StockTransaction')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (txErr) throw txErr
      if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' })

      // fetch items and include product name via relationship join (product_id -> Products.id)
      // adjust "Products" to the exact name of your products table if different
      const { data: items, error: itemsErr } = await supabase
        .from('StockItems')
        .select(`
          *,
          product:Products(id, name)
        `)
        .eq('stock_transaction_id', id)
        .order('created_at', { ascending: true })

      if (itemsErr) throw itemsErr

      // Normalize item shape: add product_name for convenience (fallback to product_id)
      const normalizedItems = (items || []).map((it) => {
        return {
          ...it,
          product_name: it.product?.name ?? it.product_name ?? (it.product_id ? `#${it.product_id}` : null)
        }
      })

      return res.json({ success: true, transaction: tx, items: normalizedItems })
    } catch (err) {
      console.error('getStockTransaction error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // GET /api/stock-transactions/suppliers/list
  // returns unique supplier names from company_name field with their latest percent
  getSuppliers: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('StockTransaction')
        .select('company_name, percent, created_at')
        .not('company_name', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get unique suppliers with their most recent percent
      const supplierMap = new Map()
      data.forEach(row => {
        if (row.company_name && !supplierMap.has(row.company_name)) {
          supplierMap.set(row.company_name, {
            company_name: row.company_name,
            percent: row.percent
          })
        }
      })

      const uniqueSuppliers = Array.from(supplierMap.values())
        .sort((a, b) => a.company_name.localeCompare(b.company_name))

      return res.json({ success: true, data: uniqueSuppliers })
    } catch (err) {
      console.error('getSuppliers error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // PUT /api/stock-transactions/suppliers/:companyName/percent
  // Update or insert percent for a supplier (upsert behavior)
  updateSupplierPercent: async (req, res) => {
    try {
      const { companyName } = req.params
      const { percent } = req.body

      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Company name is required' })
      }

      if (percent === undefined || percent === null || !Number.isFinite(Number(percent))) {
        return res.status(400).json({ success: false, message: 'Valid percent value is required' })
      }

      const cleanPercent = cleanNumber(percent)

      // Get most recent transaction for this supplier
      const { data: existingTx, error: fetchError } = await supabase
        .from('StockTransaction')
        .select('*')
        .eq('company_name', companyName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existingTx) {
        // Update existing transaction
        const { data: updated, error: updateError } = await supabase
          .from('StockTransaction')
          .update({ percent: cleanPercent })
          .eq('id', existingTx.id)
          .select()
          .single()

        if (updateError) throw updateError
        return res.json({ success: true, data: updated })
      } else {
        // Create new transaction with just company name and percent (use Philippine timezone)
        const philippineDateTime = getPhilippineDateTime()
        const { data: created, error: createError } = await supabase
          .from('StockTransaction')
          .insert([{
            company_name: companyName,
            date: philippineDateTime.toISO(),
            total: 0,
            percent: cleanPercent
          }])
          .select()
          .single()

        if (createError) throw createError
        return res.json({ success: true, data: created })
      }
    } catch (err) {
      console.error('updateSupplierPercent error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // GET /api/stock-transactions/suppliers/:companyName/percent
  // Get the current percent for a supplier
  getSupplierPercent: async (req, res) => {
    try {
      const { companyName } = req.params

      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Company name is required' })
      }

      // Get most recent transaction for this supplier
      const { data: tx, error } = await supabase
        .from('StockTransaction')
        .select('percent')
        .eq('company_name', companyName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      return res.json({
        success: true,
        data: {
          company_name: companyName,
          percent: tx?.percent || null
        }
      })
    } catch (err) {
      console.error('getSupplierPercent error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // GET /api/stock-transactions/today/:companyName
  // Get or check if a transaction exists for this company on today's date (Philippine timezone)
  getTodayTransaction: async (req, res) => {
    try {
      const { companyName } = req.params

      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Company name is required' })
      }

      // Get today's date in Philippine timezone
      const todayDate = getPhilippineDate()

      // Get all transactions for this company
      const { data: transactions, error } = await supabase
        .from('StockTransaction')
        .select('*')
        .eq('company_name', companyName)
        .order('date', { ascending: false })

      if (error) throw error

      // Find a transaction that matches today's date
      const todayTransaction = transactions?.find((tx) => {
        const txDate = DateTime.fromISO(tx.date).setZone('Asia/Manila').toISODate()
        return txDate === todayDate
      })

      return res.json({
        success: true,
        data: todayTransaction || null,
        todayDate // Include for debugging
      })
    } catch (err) {
      console.error('getTodayTransaction error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // POST /api/stock-transactions/:transactionId/items
  // Add stock items to an existing transaction
  addStockItems: async (req, res) => {
    try {
      const { transactionId } = req.params
      const { items = [] } = req.body

      if (!transactionId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'transactionId and items[] are required' })
      }

      // Verify the transaction exists
      const { data: tx, error: txErr } = await supabase
        .from('StockTransaction')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle()

      if (txErr) throw txErr
      if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' })

      // Prepare items
      const itemRows = items.map((it) => ({
        stock_transaction_id: parseInt(transactionId, 10),
        product_id: it.product_id ?? it.productId ?? null,
        purchased_price: cleanNumber(it.purchased_price ?? it.purchasedPrice ?? it.price ?? 0),
        quantity: parseInt(it.quantity ?? it.qty ?? 0, 10) || 0
      }))

      // Insert items
      const { data: itemsData, error: itemsErr } = await supabase
        .from('StockItems')
        .insert(itemRows)
        .select()

      if (itemsErr) {
        console.error('insert items error', itemsErr)
        return res.status(500).json({ success: false, error: itemsErr.message || itemsErr })
      }

      // Update product quantities and prices
      console.log('🔄 Starting product quantity and price updates...');

      const updatePromises = items.map(async (item) => {
        const productId = item.product_id ?? item.productId;
        const quantity = parseInt(item.quantity ?? item.qty ?? 0, 10) || 0;
        const purchasedPrice = cleanNumber(item.purchased_price ?? item.purchasedPrice ?? item.price ?? 0);

        if (productId && quantity > 0) {
          // Get current product data
          const { data: currentProduct, error: fetchError } = await supabase
            .from('Products')
            .select('quantity, price')
            .eq('id', productId)
            .single();

          if (!fetchError && currentProduct) {
            const currentQuantity = Number(currentProduct.quantity) || 0;
            // OVERWRITE quantity instead of adding
            const newQuantity = quantity;
            const updates = { quantity: newQuantity };

            // Update price if a valid purchasedPrice was provided
            if (Number.isFinite(purchasedPrice) && purchasedPrice >= 0) {
              updates.price = purchasedPrice;
              console.log(`📝 Price set for product ${productId}: ${currentProduct.price} → ${purchasedPrice}`);
            }

            const { error: updateError } = await supabase
              .from('Products')
              .update(updates)
              .eq('id', productId);

            if (updateError) {
              console.error(`Failed to update product ${productId}:`, updateError);
            } else {
              console.log(`✅ Updated product ${productId}: quantity ${currentQuantity} → ${newQuantity}${updates.price != null ? `, price set to ${updates.price}` : ''}`);
            }
          } else {
            console.error(`Product ${productId} not found or fetch error:`, fetchError);
          }
        }
      });

      await Promise.all(updatePromises);
      console.log('✅ Product quantity and price updates completed');

      // Calculate new total for the transaction
      const totalAmount = items.reduce((sum, item) => {
        const price = cleanNumber(item.purchased_price ?? item.purchasedPrice ?? item.price ?? 0);
        const qty = parseInt(item.quantity ?? item.qty ?? 0, 10) || 0;
        return sum + (price * qty);
      }, 0);

      // Update transaction total
      const { error: updateTotalErr } = await supabase
        .from('StockTransaction')
        .update({ total: (tx.total || 0) + totalAmount })
        .eq('id', transactionId);

      if (updateTotalErr) {
        console.error('Failed to update transaction total:', updateTotalErr);
      }

      return res.status(201).json({ success: true, items: itemsData })
    } catch (err) {
      console.error('addStockItems error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // PUT /api/stock-transactions/items/:itemId
  // Update a stock item (quantity and/or purchased_price)
  updateStockItem: async (req, res) => {
    try {
      const { itemId } = req.params
      const { quantity, purchased_price, product_id } = req.body

      if (!itemId) {
        return res.status(400).json({ success: false, message: 'Item ID is required' })
      }

      // Get the current item to know the old values
      const { data: currentItem, error: fetchError } = await supabase
        .from('StockItems')
        .select('*, stock_transaction_id')
        .eq('id', itemId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!currentItem) {
        return res.status(404).json({ success: false, message: 'Stock item not found' })
      }

      // Build update object
      const updates = {}
      if (quantity !== undefined) updates.quantity = parseInt(quantity, 10) || 0
      if (purchased_price !== undefined) updates.purchased_price = cleanNumber(purchased_price)
      if (product_id !== undefined) updates.product_id = product_id

      // Update the stock item
      const { data: updatedItem, error: updateError } = await supabase
        .from('StockItems')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (updateError) throw updateError

      // Get the product_id to update (use new one if changed, otherwise use current)
      const targetProductId = updates.product_id ?? currentItem.product_id

      // Update the product price if purchased_price changed
      if (targetProductId && updates.purchased_price !== undefined) {
        const { error: productUpdateError } = await supabase
          .from('Products')
          .update({ price: updates.purchased_price })
          .eq('id', targetProductId)

        if (productUpdateError) {
          console.error(`Failed to update product ${targetProductId} price:`, productUpdateError)
        } else {
          console.log(`✅ Updated product ${targetProductId} price to ${updates.purchased_price}`)
        }
      }

      // Recalculate transaction total
      const { data: allItems, error: itemsError } = await supabase
        .from('StockItems')
        .select('quantity, purchased_price')
        .eq('stock_transaction_id', currentItem.stock_transaction_id)

      if (!itemsError && allItems) {
        const newTotal = allItems.reduce((sum, item) => {
          return sum + (cleanNumber(item.quantity) * cleanNumber(item.purchased_price))
        }, 0)

        await supabase
          .from('StockTransaction')
          .update({ total: newTotal })
          .eq('id', currentItem.stock_transaction_id)
      }

      return res.json({ success: true, data: updatedItem })
    } catch (err) {
      console.error('updateStockItem error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  },

  // DELETE /api/stock-transactions/items/:itemId
  // Hard delete a stock item and update product quantity accordingly
  deleteStockItem: async (req, res) => {
    try {
      const { itemId } = req.params

      if (!itemId) {
        return res.status(400).json({ success: false, message: 'Item ID is required' })
      }

      // Get the item before deleting to know the quantity to subtract from product
      const { data: item, error: fetchError } = await supabase
        .from('StockItems')
        .select('*, stock_transaction_id')
        .eq('id', itemId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!item) {
        return res.status(404).json({ success: false, message: 'Stock item not found' })
      }

      // Hard delete the item
      const { error: deleteError } = await supabase
        .from('StockItems')
        .delete()
        .eq('id', itemId)

      if (deleteError) throw deleteError

      // Update the product quantity (subtract the deleted quantity)
      if (item.product_id && item.quantity > 0) {
        const { data: currentProduct, error: productFetchError } = await supabase
          .from('Products')
          .select('quantity')
          .eq('id', item.product_id)
          .single()

        if (!productFetchError && currentProduct) {
          const currentQuantity = Number(currentProduct.quantity) || 0
          const newQuantity = Math.max(0, currentQuantity - item.quantity)

          const { error: productUpdateError } = await supabase
            .from('Products')
            .update({ quantity: newQuantity })
            .eq('id', item.product_id)

          if (productUpdateError) {
            console.error(`Failed to update product ${item.product_id} quantity:`, productUpdateError)
          } else {
            console.log(`✅ Updated product ${item.product_id}: quantity ${currentQuantity} - ${item.quantity} = ${newQuantity}`)
          }
        }
      }

      // Recalculate transaction total
      const { data: remainingItems, error: itemsError } = await supabase
        .from('StockItems')
        .select('quantity, purchased_price')
        .eq('stock_transaction_id', item.stock_transaction_id)

      if (!itemsError) {
        const newTotal = (remainingItems || []).reduce((sum, it) => {
          return sum + (cleanNumber(it.quantity) * cleanNumber(it.purchased_price))
        }, 0)

        await supabase
          .from('StockTransaction')
          .update({ total: newTotal })
          .eq('id', item.stock_transaction_id)
      }

      return res.json({
        success: true,
        message: 'Stock item deleted successfully',
        deleted_item_id: itemId
      })
    } catch (err) {
      console.error('deleteStockItem error', err)
      return res.status(500).json({ success: false, error: err.message || 'Internal error' })
    }
  }
}

module.exports = stockTransactionController