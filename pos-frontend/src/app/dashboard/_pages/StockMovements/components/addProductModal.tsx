'use client'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CheckIcon, ChevronsUpDownIcon, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import FlexSearch from 'flexsearch'
import { useProducts } from '@/hooks/global/fetching/useProducts'

const FALLBACK_PRODUCTS = [
  { value: 'widget-a', label: 'Widget A' },
  { value: 'widget-b', label: 'Widget B' },
  { value: 'gadget-x', label: 'Gadget X' },
  { value: 'gadget-y', label: 'Gadget Y' },
  { value: 'part-123', label: 'Part 123' },
]

type Props = { onAdd: (p: { name: string; qty: number; unitPrice: number; productId?: string | number | null }) => void }

export default function AddProductModal({ onAdd }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [popOpen, setPopOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string>('') // product id or fallback value
  const [qty, setQty] = useState<number>(1)
  const [unitPrice, setUnitPrice] = useState<number | ''>('')
  const qtyRef = useRef<HTMLInputElement | null>(null)

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [triggerWidth, setTriggerWidth] = useState<number | null>(null)

  // Fetch products only when the dialog is open
  const { products: apiProducts, loading, error } = useProducts(dialogOpen)

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
    if (!qRaw) return productItems

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
      limit: 100,
      enrich: true
    })

    // FlexSearch returns results grouped by field, we need to flatten and deduplicate
    const uniqueValues = new Set<string>()
    const matchedItems: typeof productItems = []

    results.forEach((fieldResult: any) => {
      fieldResult.result.forEach((item: any) => {
        if (!uniqueValues.has(item.doc.value)) {
          uniqueValues.add(item.doc.value)
          const productItem = productItems.find(p => p.value === item.doc.value)
          if (productItem) {
            matchedItems.push(productItem)
          }
        }
      })
    })

    return matchedItems
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

  // Auto-fill product price when a product is selected
  useEffect(() => {
    if (!selected) return
    const p = apiProducts?.find((ap: any) => String(ap.id) === selected)
    if (p && typeof p.price === 'number') {
      setUnitPrice(Number(p.price))
    }
  }, [selected, apiProducts])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!selected || qty < 1 || unitPrice === '' || Number(unitPrice) < 0) return
      const label = productItems.find((p) => p.value === selected)?.label ?? selected
      // if selection corresponds to an API product, pass its id along
      const apiId = apiProducts?.find((ap: any) => String(ap.id) === selected)?.id ?? null
      if (typeof onAdd === 'function') {
        onAdd({ name: label, qty, unitPrice: Number(unitPrice), productId: apiId })
      } else {
        try {
          window.dispatchEvent(
            new CustomEvent('stock:addProduct', {
              detail: { name: label, qty, unitPrice: Number(unitPrice), productId: apiId },
            })
          )
        } catch {
          // noop
        }
      }

      setSelected('')
      setQty(1)
      setUnitPrice('')
      setQuery('')
      setDialogOpen(false)
    },
    [selected, qty, unitPrice, productItems, onAdd]
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
        <Button className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] p-0 gap-0 border-none shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl font-bold tracking-tight">Add Product</DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">Search and add a product with quantity and purchase price.</div>
          </DialogHeader>

          <div className="grid gap-6 px-6 py-2">
            <div className="grid gap-2.5">
              <Label htmlFor="product-combobox" className="text-sm font-semibold text-foreground/90">Product</Label>

              <Popover open={popOpen} onOpenChange={setPopOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popOpen}
                    className="w-full h-10 justify-between text-left overflow-hidden text-sm border-muted-foreground/20 hover:border-foreground/40 hover:bg-muted/30 transition-all duration-200 rounded-lg font-normal"
                    aria-label="Product combobox"
                    id="product-combobox"
                    ref={triggerRef}
                    type="button"
                  >
                    <span className="flex-1 min-w-0 truncate pr-2 text-left text-foreground/80">
                      {selected ? productItems.find((p) => p.value === selected)?.label ?? selected : 'Select a product...'}
                    </span>
                    <ChevronsUpDownIcon className="opacity-40 h-4 w-4 transition-transform" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="p-3 min-w-[260px] max-w-[520px] border-muted-foreground/20 shadow-xl rounded-lg"
                  align="start"
                  side="bottom"
                  style={triggerWidth ? { width: `${triggerWidth}px` } : undefined}
                >
                  <div>
                    <Input
                      placeholder="Search by name or barcode..."
                      className="h-9 mb-2 text-sm border-muted-foreground/20 focus-visible:border-primary/50 rounded-md"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />

                    {loading ? (
                      <div className="p-8 text-sm text-center text-muted-foreground">Loading products...</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-8 text-sm text-center text-muted-foreground">
                        No product found for "{query}"
                      </div>
                    ) : (
                      <ul className="max-h-[400px] overflow-auto space-y-1 mt-2">
                        {filtered.map((it) => {
                          const p = apiProducts?.find((ap: any) => String(ap.id) === it.value)
                          return (
                            <li key={it.value}>
                              <button
                                type="button"
                                className="w-full text-left px-4 py-3.5 hover:bg-muted/60 active:bg-muted/80 transition-colors flex flex-col gap-1.5 rounded-lg group"
                                onClick={() => {
                                  setSelected(it.value)
                                  if (p && typeof p.price === 'number') setUnitPrice(Number(p.price))
                                  setPopOpen(false)
                                  setTimeout(() => qtyRef.current?.focus(), 60)
                                }}
                              >
                                <span className="truncate font-medium text-base group-hover:text-foreground">
                                  {String(it.label)}
                                </span>
                                {p?.barcode && (
                                  <span className="text-xs text-muted-foreground truncate">Barcode: {p.barcode}</span>
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

            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2.5">
                <Label htmlFor="qty" className="text-sm font-semibold text-foreground/90 flex items-center justify-between">
                  <span>Quantity</span>
                  {selected && (() => {
                    const currentProduct = apiProducts?.find((ap: any) => String(ap.id) === selected)
                    const currentQty = currentProduct?.quantity
                    if (currentQty != null && typeof currentQty === 'number') {
                      return (
                        <span className="text-xs text-muted-foreground font-medium">
                          Current: {currentQty}
                        </span>
                      )
                    }
                    return null
                  })()}
                </Label>
                <Input
                  id="qty"
                  ref={qtyRef}
                  type="number"
                  min={1}
                  value={String(qty)}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="h-10 text-sm border-muted-foreground/20 focus-visible:border-primary/50 rounded-lg font-normal"
                  placeholder="1"
                />
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="unit-price" className="text-sm font-semibold text-foreground/90 flex items-center justify-between">
                  <span>Purchase Price</span>
                  {selected && (() => {
                    const currentProduct = apiProducts?.find((ap: any) => String(ap.id) === selected)
                    const currentPrice = currentProduct?.price
                    if (currentPrice != null && typeof currentPrice === 'number') {
                      return (
                        <span className="text-xs text-muted-foreground font-medium">
                          Current: ₱{Number(currentPrice).toFixed(2)}
                        </span>
                      )
                    }
                    return null
                  })()}
                </Label>
                <Input
                  id="unit-price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={unitPrice === '' ? '' : String(unitPrice)}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  placeholder="0.00"
                  className="h-10 text-sm border-muted-foreground/20 focus-visible:border-primary/50 rounded-lg font-normal"
                />
              </div>
            </div>

            {selected && unitPrice !== '' && (() => {
              const currentProduct = apiProducts?.find((ap: any) => String(ap.id) === selected)
              const currentPrice = currentProduct?.price
              const newPrice = Number(unitPrice)
              if (currentPrice != null && typeof currentPrice === 'number' && currentPrice !== newPrice) {
                return (
                  <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 -mt-2">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      Price will be updated from ₱{Number(currentPrice).toFixed(2)} to ₱{newPrice.toFixed(2)}
                    </p>
                  </div>
                )
              }
              return null
            })()}
          </div>

          <DialogFooter className="px-6 py-6 gap-3 flex-row justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="h-10 px-6 rounded-lg border-muted-foreground/20 hover:bg-muted/50 transition-all">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!selected || qty < 1 || unitPrice === ''} className="h-10 px-6 rounded-lg shadow-sm hover:shadow transition-all">
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}