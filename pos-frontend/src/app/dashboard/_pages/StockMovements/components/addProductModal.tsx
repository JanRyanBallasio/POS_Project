'use client'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

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
import Fuse from 'fuse.js'
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

  const { products: apiProducts, loading, error } = useProducts()

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

  // robust, memoized filtering (normalizes unicode and checks both label and value)
  const fuse = useMemo(() => {
    return new Fuse(productItems, {
      keys: ['label'],
      threshold: 0.30, // adjust fuzziness if needed
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  }, [productItems])

  const filtered = useMemo(() => {
    const qRaw = query.trim()
    if (!qRaw) return productItems

    const tokens = qRaw
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    const strictMatches = productItems.filter((p) => {
      const label = String(p.label ?? '').normalize('NFKC').toLowerCase()
      return tokens.every((t) => label.includes(t))
    })

    if (strictMatches.length > 0) return strictMatches

    // Fuse will only search label (product name)
    return fuse.search(qRaw).map((r) => r.item)
  }, [fuse, query, productItems])

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
        <Button variant="outline" className="h-8">
          Add
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <div className="text-sm text-muted-foreground">Search and add a product with quantity and unit price.</div>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="product-combobox">Product</Label>

              <Popover open={popOpen} onOpenChange={setPopOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popOpen}
                    className="w-full justify-between text-left overflow-hidden"
                    aria-label="Product combobox"
                    id="product-combobox"
                    ref={triggerRef}
                    type="button"
                  >
                    <span className="flex-1 min-w-0 truncate pr-2 text-left">
                      {selected ? productItems.find((p) => p.value === selected)?.label ?? selected : 'Select product...'}
                    </span>
                    <ChevronsUpDownIcon className="opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="p-3 min-w-[280px] max-w-[640px]"
                  align="start"
                  side="bottom"
                  style={triggerWidth ? { width: `${triggerWidth}px` } : undefined}
                >
                  <div>
                    <Input
                      placeholder="Search product..."
                      className="h-9 mb-2"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />

                    {loading ? (
                      <div className="p-2 text-sm">Loading products...</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {`No product found for "${query}". products=${productItems.length} filtered=${filtered.length}`}
                      </div>
                    ) : (
                      <ul className="max-h-56 overflow-auto divide-y rounded-md bg-background">
                        {filtered.map((it) => (
                          <li key={it.value}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted-foreground/5 flex items-center gap-3"
                              onClick={() => {
                                setSelected(it.value)
                                setPopOpen(false)
                                setTimeout(() => qtyRef.current?.focus(), 60)
                              }}
                            >
                              <span className="flex-1 truncate">{String(it.label)}</span>

                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                ref={qtyRef}
                type="number"
                min={1}
                value={String(qty)}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit-price">Unit price (purchased)</Label>
              <Input
                id="unit-price"
                type="number"
                step="0.01"
                min={0}
                value={unitPrice === '' ? '' : String(unitPrice)}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!selected || qty < 1 || unitPrice === ''}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}