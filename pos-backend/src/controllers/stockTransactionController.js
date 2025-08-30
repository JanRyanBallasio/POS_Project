// ...existing code...
const { supabase } = require('../config/db')

const cleanNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const stockTransactionController = {
  // POST /api/stock-transactions
  createStockTransaction: async (req, res) => {
    try {
      const { company_name, date = new Date().toISOString(), total = 0, items = [] } = req.body

      if (!company_name || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'company_name and items[] are required' })
      }

      // insert transaction
      const { data: tx, error: txErr } = await supabase
        .from('StockTransaction')
        .insert([{ company_name, date, total: cleanNumber(total) }])
        .select()
        .single()

      if (txErr) {
        console.error('insert tx error', txErr)
        return res.status(500).json({ success: false, error: txErr.message || txErr })
      }

      // prepare items
      const itemRows = items.map((it) => ({
        stock_transaction_id: tx.id,
        product_id: it.product_id ?? it.productId ?? null,
        purchased_price: cleanNumber(it.purchased_price ?? it.purchasedPrice ?? it.price ?? 0),
        quantity: parseInt(it.quantity ?? it.qty ?? 0, 10) || 0
      }))

      // batch insert items
      const { data: insertedItems, error: itemsErr } = await supabase
        .from('StockItems')
        .insert(itemRows)
        .select()

      if (itemsErr) {
        console.error('insert items error', itemsErr)
        // attempt to cleanup the transaction row (best-effort)
        await supabase.from('StockTransaction').delete().eq('id', tx.id)
        return res.status(500).json({ success: false, error: itemsErr.message || itemsErr })
      }

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
  }
}

module.exports = stockTransactionController
// ...existing code...