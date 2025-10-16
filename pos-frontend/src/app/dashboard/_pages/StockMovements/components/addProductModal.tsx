'use client'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ChevronsUpDownIcon, PlusCircle, RefreshCw, Replace } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Toggle } from '@/components/ui/toggle'
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FlexSearch from 'flexsearch'
import { useProducts } from '@/hooks/global/fetching/useProducts'
import { useCategories } from '@/hooks/global/fetching/useCategories'
import useSWR, { useSWRConfig } from 'swr'
import axios from '@/lib/axios'
  
const FALLBACK_PRODUCTS = [
  { value: 'widget-a', label: 'Widget A' },
  { value: 'widget-b', label: 'Widget B' },
  { value: 'gadget-x', label: 'Gadget X' },
  { value: 'gadget-y', label: 'Gadget Y' },
  { value: 'part-123', label: 'Part 123' },
]

type Props = {
  onAdd?: (p: { name: string; qty: number; unitPrice: number; productId?: string | number | null; companyName?: string }) => void
  preSelectedSupplier?: string | null
  onSuccess?: () => void // Callback to refresh the view after successful addition
}

export default function AddProductModal({ onAdd, preSelectedSupplier, onSuccess }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [popOpen, setPopOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string>('') // product id or fallback value
  const [selectedCompany, setSelectedCompany] = useState<string>('') // company name
  const [qty, setQty] = useState<number | ''>('') // Changed to allow empty string
  const [unitPrice, setUnitPrice] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [supplierPercent, setSupplierPercent] = useState<number | null>(null)
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null)
  const qtyRef = useRef<HTMLInputElement | null>(null)

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [triggerWidth, setTriggerWidth] = useState<number | null>(null)

  // Quick add product states
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductBarcode, setNewProductBarcode] = useState('')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)

  // Quantity mode: 'overwrite' or 'add'
  const [quantityMode, setQuantityMode] = useState<'overwrite' | 'add'>('overwrite')

  const { mutate } = useSWRConfig()

  // Fetch suppliers/companies
  const { data: suppliersData } = useSWR(
    dialogOpen ? '/stock-transactions/suppliers/list' : null,
    async (url) => {
      const res = await axios.get(url)
      return res.data
    }
  )
  const suppliers = suppliersData?.data || []

  // Fetch products only when the dialog is open
  const { products: apiProducts, loading, error, refetch: refetchProducts } = useProducts(dialogOpen)

  // Fetch categories for quick add
  const { categories } = useCategories()

  // normalize product list for the command component
  const productItems = useMemo(
    () =>
      apiProducts && apiProducts.length > 0
        ? apiProducts.map((p) => ({ value: String(p.id), label: p.name ?? `#${p.id}` }))
        : FALLBACK_PRODUCTS,
    [apiProducts]
  )

  useEffect(() => {
    if (dialogOpen && selected) {
      setTimeout(() => qtyRef.current?.focus(), 60)
    }
  }, [dialogOpen, selected])

  // Pre-fill supplier when modal opens, or reset company if no pre-selected supplier
  useEffect(() => {
    if (dialogOpen) {
      if (preSelectedSupplier) {
        setSelectedCompany(preSelectedSupplier)
      } else {
        // Reset to empty if no pre-selected supplier (main Purchases view)
        setSelectedCompany('')
        setQty('')
      }
    }
  }, [dialogOpen, preSelectedSupplier])

  // Fetch supplier percent when company is selected
  useEffect(() => {
    if (selectedCompany) {
      axios.get(`/stock-transactions/suppliers/${encodeURIComponent(selectedCompany)}/percent`)
        .then(res => {
          const percent = res.data?.data?.percent
          setSupplierPercent(percent)
        })
        .catch(err => {
          console.error('Error fetching supplier percent:', err)
          setSupplierPercent(null)
        })
    } else {
      setSupplierPercent(null)
    }
  }, [selectedCompany])

  // Calculate adjusted price when unitPrice or supplierPercent changes
  useEffect(() => {
    if (typeof unitPrice === 'number' && unitPrice > 0 && supplierPercent) {
      const calculated = unitPrice / supplierPercent
      setAdjustedPrice(calculated)
    } else {
      setAdjustedPrice(null)
    }
  }, [unitPrice, supplierPercent])

  // Fetch the selected product's current data
  const selectedProductData = useMemo(() => {
    if (!selected || !apiProducts) return null
    return apiProducts.find((p) => String(p.id) === selected)
  }, [selected, apiProducts])

  // measure trigger width so popover can match it
  useLayoutEffect(() => {
    const update = () => setTriggerWidth(triggerRef.current?.offsetWidth ?? null)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // when the popover opens ensure width is up-to-date
  useEffect(() => {
    if (popOpen) {
      setTriggerWidth(triggerRef.current?.offsetWidth ?? null)
    }
  }, [popOpen, selected])

  // robust, memoized filtering using FlexSearch (normalizes unicode and checks both label and barcode)
  const searchIndex = useMemo(() => {
    const index = new FlexSearch.Document({
      tokenize: 'forward',
      resolution: 9,
      cache: true,
      document: {
        id: 'value',
        index: ['label', 'barcode'],
        store: ['value', 'label', 'barcode']
      }
    })

    // Index all products with their barcodes
    productItems.forEach((item) => {
      const apiProduct = apiProducts?.find((ap: any) => String(ap.id) === item.value)
      index.add({
        value: item.value,
        label: item.label,
        barcode: apiProduct?.barcode || ''
      })
    })

    return index
  }, [productItems, apiProducts])

  const filtered = useMemo(() => {
    const qRaw = query.trim()
    if (!qRaw) return productItems.slice(0, 10) // Limit to 10 items when no search query

    // Check for exact barcode match first
    const barcodeMatch = apiProducts?.find((ap: any) =>
      ap.barcode && String(ap.barcode).toLowerCase() === qRaw.toLowerCase()
    )
    if (barcodeMatch) {
      const matchedItem = productItems.find(p => String(p.value) === String(barcodeMatch.id))
      if (matchedItem) return [matchedItem]
    }

    // Use FlexSearch to search both label (product name) and barcode
    const results = searchIndex.search(qRaw, {
      limit: 10, // Limit search results to 10 items
      enrich: true
    })

    // FlexSearch returns results grouped by field, we need to flatten and deduplicate
    const uniqueValues = new Set<string>()
    const matchedItems: typeof productItems = []

    results.forEach((fieldResult: any) => {
      fieldResult.result.forEach((item: any) => {
        if (!uniqueValues.has(item.doc.value) && matchedItems.length < 10) {
          uniqueValues.add(item.doc.value)
          const productItem = productItems.find(p => p.value === item.doc.value)
          if (productItem) {
            matchedItems.push(productItem)
          }
        }
      })
    })

    return matchedItems.slice(0, 10) // Ensure max 10 results
  }, [searchIndex, query, productItems, apiProducts])

  // DEBUG: log what the modal sees so we can diagnose "No product found" even though network returned data
  useEffect(() => {
    try {
      console.log('[AddProductModal] apiProducts.length=', apiProducts?.length ?? 0)
      console.log('[AddProductModal] sample apiProducts=', (apiProducts ?? []).slice(0, 5))
      console.log('[AddProductModal] productItems.length=', productItems.length)
      console.log('[AddProductModal] sample productItems=', productItems.slice(0, 8))
      console.log('[AddProductModal] query=', JSON.stringify(query), 'filtered.length=', filtered.length)
      console.log('[AddProductModal] sample filtered=', filtered.slice(0, 8))
    } catch (e) {
      console.error('[AddProductModal] debug error', e)
    }
  }, [apiProducts, productItems, query, filtered])

  // Auto-fill quantity with current product quantity when product is selected and inside a supplier view
  useEffect(() => {
    if (selected && selectedProductData && preSelectedSupplier) {
      // Only auto-fill if we're inside a supplier view (preSelectedSupplier is set)
      setQty(selectedProductData.quantity || 0)
    }
  }, [selected, selectedProductData, preSelectedSupplier])

  // Pre-fill product name from search query when opening quick add
  useEffect(() => {
    if (showQuickAdd && query.trim()) {
      setNewProductName(query.trim())
    }
  }, [showQuickAdd, query])

  // Handle quick add product
  const handleQuickAddProduct = useCallback(async () => {
    // Validation
    if (!newProductName.trim()) {
      alert('Product name is required')
      return
    }
    if (!newProductBarcode.trim()) {
      alert('Barcode is required')
      return
    }
    if (!newProductCategory) {
      alert('Category is required')
      return
    }

    try {
      setCreatingProduct(true)

      // Create product via API
      const payload = {
        name: newProductName.trim(),
        barcode: newProductBarcode.trim(),
        category_id: Number(newProductCategory),
        price: 0, // Default price, will be updated from purchase
        quantity: 0, // Initial quantity
        unit: 'pieces' // Default unit
      }

      const response = await axios.post('/products', payload)
      const createdProduct = response.data

      // Refresh products list
      await refetchProducts()

      // Auto-select the newly created product
      if (createdProduct?.id) {
        setSelected(String(createdProduct.id))
      }

      // Reset quick add form
      setShowQuickAdd(false)
      setNewProductName('')
      setNewProductBarcode('')
      setNewProductCategory('')

      // Focus on quantity field
      setTimeout(() => qtyRef.current?.focus(), 100)
    } catch (err: any) {
      console.error('Error creating product:', err)
      alert(`Failed to create product: ${err?.response?.data?.message || err?.message || 'Unknown error'}`)
    } finally {
      setCreatingProduct(false)
    }
  }, [newProductName, newProductBarcode, newProductCategory, refetchProducts])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validation
      if (!selected || qty === '' || Number(qty) < 1 || unitPrice === '' || Number(unitPrice) < 0) {
        alert('Please fill in all required fields')
        return
      }

      if (!selectedCompany) {
        alert('Please select a company')
        return
      }

      const label = productItems.find((p) => p.value === selected)?.label ?? selected
      const apiId = apiProducts?.find((ap: any) => String(ap.id) === selected)?.id ?? null

      if (!apiId) {
        alert('Invalid product selected')
        return
      }

      try {
        setSaving(true)

        // Check if a transaction exists for this company for TODAY (backend uses Philippine timezone)
        const todayTransactionRes = await axios.get(`/stock-transactions/today/${encodeURIComponent(selectedCompany)}`)
        const existingTransaction = todayTransactionRes.data?.data

        let transactionId: number

        if (existingTransaction) {
          // Use existing transaction for today
          transactionId = existingTransaction.id
          console.log('✅ Using existing transaction for today:', transactionId, 'for company:', selectedCompany, 'date:', todayTransactionRes.data?.todayDate)
        } else {
          // Create new transaction for this company (backend will set today's date in Philippine timezone)
          const newTransactionRes = await axios.post('/stock-transactions', {
            company_name: selectedCompany,
            total: 0, // Will be calculated when items are added
            items: [] // No items initially
          })

          transactionId = newTransactionRes.data?.transaction?.id
          console.log('✅ Created new transaction for today:', transactionId, 'for company:', selectedCompany)
        }

        if (!transactionId) {
          throw new Error('Failed to get or create transaction')
        }

        // Calculate final price to use (adjusted if percent available, raw otherwise) and round up
        const finalPrice = Math.ceil(adjustedPrice !== null ? adjustedPrice : Number(unitPrice))

        // Calculate final quantity based on mode and round up
        let finalQuantity = Math.ceil(Number(qty))
        if (quantityMode === 'add' && selectedProductData) {
          // Add to current quantity
          finalQuantity = Math.ceil(Number(selectedProductData.quantity || 0) + Number(qty))
        }

        // Now add the product as a stock item using the new endpoint
        const payload = {
          items: [{
            product_id: apiId,
            purchased_price: finalPrice,
            quantity: finalQuantity,
            quantity_mode: quantityMode
          }]
        }

        await axios.post(`/stock-transactions/${transactionId}/items`, payload)

        console.log('✅ Product added with price:', {
          supplierPrice: Number(unitPrice),
          percent: supplierPercent,
          adjustedPrice: finalPrice
        })

        // Trigger callback if provided
        if (typeof onAdd === 'function') {
          onAdd({ name: label, qty: Number(qty), unitPrice: Number(unitPrice), productId: apiId, companyName: selectedCompany })
        }

        // Revalidate the transactions cache to get fresh data (with explicit revalidation)
        await mutate('/stock-transactions', undefined, { revalidate: true })

        // Refetch products to show updated data in modal
        await refetchProducts()

        // Reset form
        setSelected('')
        setSelectedCompany('')
        setQty('') // Reset to empty
        setUnitPrice('')
        setQuery('')
        setDialogOpen(false)

        // Call onSuccess callback to refresh the view
        if (typeof onSuccess === 'function') {
          onSuccess()
        }

        // Show success message
        console.log('✅ Product added successfully')
      } catch (err: any) {
        console.error('Error adding product:', err)
        alert(`Failed to add product: ${err?.response?.data?.message || err?.message || 'Unknown error'}`)
      } finally {
        setSaving(false)
      }
    },
    [selected, selectedCompany, qty, unitPrice, productItems, apiProducts, onAdd, onSuccess, adjustedPrice, supplierPercent, mutate, refetchProducts]
  )
  useEffect(() => {
    if (error) {
      // Log the error coming from useProducts to the browser console
      console.error('useProducts error:', error)
    }
  }, [error])
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className="h-11 gap-2 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-4 rounded-lg font-medium transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg border-0 p-0 gap-0 bg-white">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-1.5">
          <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">Add Product</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a product to your purchase order
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Product</Label>
            <Popover open={popOpen} onOpenChange={setPopOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popOpen}
                  className="w-full h-11 justify-between text-left overflow-hidden border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors rounded-lg font-normal shadow-sm"
                  aria-label="Product combobox"
                  id="product-combobox"
                  ref={triggerRef}
                  type="button"
                >
                  <span className="flex-1 min-w-0 truncate pr-2 text-sm text-gray-700">
                    {selected ? productItems.find((p) => p.value === selected)?.label ?? selected : 'Select a product...'}
                  </span>
                  <ChevronsUpDownIcon className="h-4 w-4 text-gray-400" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="p-3 min-w-[260px] max-w-[520px] border-gray-200 shadow-lg rounded-xl"
                align="start"
                side="bottom"
                style={triggerWidth ? { width: `${triggerWidth}px` } : undefined}
              >
                <div>
                  <Input
                    placeholder="Search by name or barcode..."
                    className="h-10 mb-3 text-sm border-gray-200 focus-visible:border-gray-300 focus-visible:ring-1 focus-visible:ring-gray-300 rounded-lg"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />

                  {loading && !apiProducts?.length ? (
                    <div className="p-8 text-sm text-center text-gray-500">Loading products...</div>
                  ) : showQuickAdd ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">Create New Product</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuickAdd(false)
                            setNewProductName('')
                            setNewProductBarcode('')
                            setNewProductCategory('')
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Product Name *</Label>
                        <Input
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="Enter product name"
                          className="h-9 text-sm"
                          autoFocus
                        />
                      </div>

                      <div className="grid grid-cols-[70%_30%] gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Barcode *</Label>
                          <Input
                            value={newProductBarcode}
                            onChange={(e) => setNewProductBarcode(e.target.value)}
                            placeholder="Enter barcode"
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Category *</Label>
                          <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.length === 0 ? (
                                <div className="px-2 py-4 text-xs text-gray-500 text-center">
                                  No categories available
                                </div>
                              ) : (
                                categories.map((cat) => (
                                  <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={handleQuickAddProduct}
                        disabled={creatingProduct || !newProductName.trim() || !newProductBarcode.trim() || !newProductCategory}
                        className="w-full h-9 text-sm"
                      >
                        {creatingProduct ? 'Creating...' : 'Create Product'}
                      </Button>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-4 space-y-3">
                      <div className="p-4 text-sm text-center text-gray-500">
                        No product found for "{query}"
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowQuickAdd(true)}
                        className="w-full h-9 text-sm border-dashed border-2 hover:border-gray-400 hover:bg-gray-50"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create "{query}" as new product
                      </Button>
                    </div>
                  ) : (
                    <ul className="max-h-[320px] overflow-auto space-y-0.5">
                      {filtered.map((it) => {
                        const p = apiProducts?.find((ap: any) => String(ap.id) === it.value)
                        return (
                          <li key={it.value}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 transition-colors flex flex-col gap-1 rounded-lg group"
                              onClick={() => {
                                setSelected(it.value)
                                setPopOpen(false)
                                setTimeout(() => qtyRef.current?.focus(), 60)
                              }}
                            >
                              <span className="truncate font-medium text-sm text-gray-900">
                                {String(it.label)}
                              </span>
                              {p?.barcode && (
                                <span className="text-xs text-gray-500 truncate">Barcode: {p.barcode}</span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Company/Supplier Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
              Company / Supplier
              {supplierPercent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                  ÷{supplierPercent.toFixed(2)}
                </span>
              )}
            </Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger id="company" className="w-full h-11 text-sm border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 rounded-lg shadow-sm">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {suppliers.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    No companies found
                  </div>
                ) : (
                  suppliers.map((supplier: { company_name: string; percent?: number }) => (
                    <SelectItem key={supplier.company_name} value={supplier.company_name} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        {supplier.company_name}
                        {supplier.percent && (
                          <span className="text-xs text-gray-500">
                            (÷{supplier.percent.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity and Supplier Price inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Quantity
              </Label>
              {selectedProductData && (
                <p className="text-xs text-gray-500 -mt-1">
                  Current: {selectedProductData?.quantity || 0}
                  {qty !== '' && (
                    <span className="ml-1 font-semibold text-emerald-600">
                      → {quantityMode === 'add'
                        ? Math.ceil(Number(selectedProductData?.quantity || 0) + Number(qty))
                        : Math.ceil(Number(qty))
                      }
                    </span>
                  )}
                </p>
              )}
              <div className="relative">
                <Input
                  ref={qtyRef}
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  step={0.01}
                  placeholder={quantityMode === 'add' ? "Enter quantity to add" : "Enter new quantity"}
                  disabled={!selected}
                  className="h-11 pr-14 border-gray-200 focus-visible:border-gray-300 focus-visible:ring-1 focus-visible:ring-gray-300 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                  <Toggle
                    pressed={quantityMode === 'overwrite'}
                    onPressedChange={() => setQuantityMode('overwrite')}
                    size="sm"
                    title="Overwrite quantity"
                    className="h-5 w-5 p-0 data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=off]:text-gray-500 hover:data-[state=off]:text-gray-700"
                  >
                    <Replace className="h-3 w-3" />
                  </Toggle>
                  <Toggle
                    pressed={quantityMode === 'add'}
                    onPressedChange={() => setQuantityMode('add')}
                    size="sm"
                    title="Add to current quantity"
                    className="h-5 w-5 p-0 data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=off]:text-gray-500 hover:data-[state=off]:text-gray-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Toggle>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Supplier Price
              </Label>
              {selectedProductData && (
                <p className="text-xs text-gray-500 -mt-1">
                  Current: ₱{Math.ceil(selectedProductData?.price || 0)}
                  {unitPrice !== '' && adjustedPrice !== null && (
                    <span className="ml-1 font-semibold text-emerald-600">
                      → ₱{Math.ceil(adjustedPrice)}
                    </span>
                  )}
                </p>
              )}
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                min={0}
                step={0.01}
                placeholder="0.00"
                disabled={!selected}
                className="h-11 border-gray-200 focus-visible:border-gray-300 focus-visible:ring-1 focus-visible:ring-gray-300 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50/50">
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1 sm:flex-none h-10 sm:h-11 px-4 sm:px-6 border-gray-200 hover:bg-white rounded-lg text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 sm:flex-none h-10 sm:h-11 px-4 sm:px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm text-sm sm:text-base"
            >
              {saving ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
