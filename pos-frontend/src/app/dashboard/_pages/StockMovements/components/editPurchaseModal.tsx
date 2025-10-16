'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { Replace, RefreshCw } from 'lucide-react'

interface EditPurchaseModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string | number
    product_id?: number
    product_name: string
    quantity: number
    purchased_price: number
    saved_price?: number
  }
  companyName: string
  onSuccess: () => void
}

export default function EditPurchaseModal({ isOpen, onOpenChange, item, companyName, onSuccess }: EditPurchaseModalProps) {
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [price, setPrice] = useState(item.saved_price?.toString() || item.purchased_price.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantityMode, setQuantityMode] = useState<'overwrite' | 'add'>('overwrite')
  const [supplierPercent, setSupplierPercent] = useState<number | null>(null)
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null)

  // Reset form when item changes
  useEffect(() => {
    setQuantity(item.quantity.toString())
    setPrice(item.saved_price?.toString() || item.purchased_price.toString())
    setError(null)
  }, [item])

  // Fetch supplier percent when modal opens
  useEffect(() => {
    if (isOpen && companyName) {
      axios.get(`/stock-transactions/suppliers/${encodeURIComponent(companyName)}/percent`)
        .then(res => {
          const percent = res.data?.data?.percent
          setSupplierPercent(percent)
        })
        .catch(err => {
          console.error('Error fetching supplier percent:', err)
          setSupplierPercent(null)
        })
    }
  }, [isOpen, companyName])

  // Calculate adjusted price when price or supplierPercent changes
  useEffect(() => {
    if (price !== '' && supplierPercent) {
      const priceNum = parseFloat(price)
      if (!isNaN(priceNum) && priceNum > 0) {
        const calculated = priceNum / supplierPercent
        setAdjustedPrice(calculated)
      } else {
        setAdjustedPrice(null)
      }
    } else {
      setAdjustedPrice(null)
    }
  }, [price, supplierPercent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const quantityNum = parseFloat(quantity)
      const priceNum = parseFloat(price)

      if (isNaN(quantityNum) || quantityNum <= 0) {
        setError('Please enter a valid quantity')
        setLoading(false)
        return
      }

      if (isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid price')
        setLoading(false)
        return
      }

      // Calculate final quantity based on mode and round up
      let finalQuantity = Math.ceil(quantityNum)
      if (quantityMode === 'add') {
        finalQuantity = Math.ceil(item.quantity + quantityNum)
      }

      // Calculate final price (use adjusted price if divisor exists, otherwise use input price) and round up
      const finalPrice = Math.ceil(adjustedPrice !== null ? adjustedPrice : priceNum)

      await axios.put(`/stock-transactions/items/${item.id}`, {
        quantity: finalQuantity,
        purchased_price: finalPrice
      })

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error updating purchase item:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Purchase Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product</Label>
              <Input
                id="product-name"
                value={item.product_name}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <p className="text-xs text-gray-500">
                Current: {item.quantity}
                {quantity !== '' && (
                  <span className="ml-1 font-semibold text-emerald-600">
                    → {quantityMode === 'add'
                      ? Math.ceil(item.quantity + (parseFloat(quantity) || 0))
                      : Math.ceil(parseFloat(quantity) || 0)
                    }
                  </span>
                )}
              </p>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-14"
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
              <Label htmlFor="price" className="flex items-center gap-2">
                Supplier Price
                {supplierPercent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                    ÷{supplierPercent.toFixed(2)}
                  </span>
                )}
              </Label>
              <p className="text-xs text-gray-500">
                Current: ₱{Math.ceil(item.saved_price || item.purchased_price)}
                {price !== '' && adjustedPrice !== null && (
                  <span className="ml-1 font-semibold text-emerald-600">
                    → ₱{Math.ceil(adjustedPrice)}
                  </span>
                )}
              </p>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
