'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { CalendarIcon, ChevronDown, ChevronUp, History } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import axios from "@/lib/axios"
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from '@/components/ui/skeleton'

type ProductSaleItem = {
  product_name: string
  total_sales: number
  quantity: number
  price: number
  unit: string
  last_purchase: string
}

type ProductDetail = {
  name: string
  qty: number
  price: number
  total: number
  unit: string
  last_purchase: string
}

type ChartData = ProductSaleItem

const chartConfig: ChartConfig = {
  total_sales: {
    label: 'Total Sales',
    color: 'var(--color-primary)'
  }
}

const fetcher = async (url: string) => {
  const response = await axios.get(url)
  return response.data?.data || response.data || []
}

// Manila timezone helpers
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000
function manilaDayStartUTCiso(d: Date) {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  const manilaMidnightUTCms = Date.UTC(y, m, day, 0, 0, 0) - MANILA_OFFSET_MS
  return new Date(manilaMidnightUTCms).toISOString()
}
function manilaNextDayStartUTCiso(d: Date) {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  const manilaMidnightUTCms = Date.UTC(y, m, day, 0, 0, 0) - MANILA_OFFSET_MS
  const nextMidnight = manilaMidnightUTCms + 24 * 60 * 60 * 1000
  return new Date(nextMidnight).toISOString()
}

export default function ProductStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'recent'>('desc')
  const [open, setOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc' | 'recent'>('desc')
  const [productLimit, setProductLimit] = useState(15)

  // API URL
  const productSalesUrl = useMemo(() => {
    if (!range?.from || !range?.to) return '/sales-items/products'
    const fromIso = manilaDayStartUTCiso(range.from)
    const toIso = manilaNextDayStartUTCiso(range.to)
    return `/sales-items/products?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  }, [range?.from?.getTime(), range?.to?.getTime()])

  // Fetch sales data
  const { data: productSales = [], error, isLoading, isValidating } = useSWR(
    productSalesUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // ✅ Use backend totals directly, no re-aggregation
  const productSalesData = useMemo(() => {
    if (!productSales.length) return []

    return productSales.map((item: any) => ({
      product_name: item.product_name || 'Unknown Product',
      total_sales: Number(item.total_sales || item.total) || 0,  // ← Handle both field names
      quantity: Number(item.total_quantity || item.quantity) || 0,  // ← Handle both field names
      price: Number(item.average_price || item.price) || 0,     // ← Handle both field names
      unit: item.unit || 'pcs',
      last_purchase: item.last_purchase
    }))
  }, [productSales])

  const handleBarClick = async (data: any) => {
    setSelectedProduct(data.product_name)
    setOpen(true)
    setLoadingDetails(true)

    try {
      const fromIso = manilaDayStartUTCiso(range?.from || new Date())
      const toIso = manilaNextDayStartUTCiso(range?.to || new Date())

      const response = await axios.get(`/sales-items/product-details`, {
        params: {
          product_name: data.product_name,
          from: fromIso,
          to: toIso
        }
      })

      const details = response.data?.data || []
      setProductDetails(details)

      console.log(`Loaded ${details.length} transactions for ${data.product_name}`)
    } catch (error: any) {
      console.error('Error fetching product details:', error)
      setProductDetails([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const sortedProductDetails = useMemo(() => {
    switch (tableSortOrder) {
      case 'asc': return [...productDetails].sort((a, b) => (a.total || 0) - (b.total || 0))
      case 'desc': return [...productDetails].sort((a, b) => (b.total || 0) - (a.total || 0))
      case 'recent':
      default:
        return [...productDetails].sort((a, b) => {
          const ta = a.last_purchase ? new Date(a.last_purchase).getTime() : 0
          const tb = b.last_purchase ? new Date(b.last_purchase).getTime() : 0
          return tb - ta
        })
    }
  }, [productDetails, tableSortOrder])

  const productDetailsTotal = productDetails.reduce((acc, p) => acc + (Number(p.total) || 0), 0)

  const chartData = useMemo(() => {
    let sorted
    switch (sortOrder) {
      case 'asc': sorted = [...productSalesData].sort((a, b) => a.total_sales - b.total_sales); break
      case 'desc': sorted = [...productSalesData].sort((a, b) => b.total_sales - a.total_sales); break
      case 'recent': sorted = [...productSalesData].sort((a, b) =>
        new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime()
      ); break
      default: sorted = [...productSalesData].sort((a, b) => b.total_sales - a.total_sales)
    }
    
    const limited = sorted.slice(0, productLimit)
    
    // Add debugging
    console.log('🔍 PRODUCT ANALYTICS DEBUG:')
    console.log('Total products from API:', productSalesData.length)
    console.log('Product limit setting:', productLimit)
    console.log('Chart data length after limit:', limited.length)
    console.log('Chart data sample:', limited.slice(0, 3).map(p => p.product_name))
    
    return limited
  }, [productSalesData, sortOrder, productLimit])

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.total_sales, 0), [chartData])

  const initialLoadingNoData = isLoading && productSalesData.length === 0
  const isUpdating = isValidating && productSalesData.length > 0

  return (
    <>
      <Card className='@container/card w-full relative'>
        <CardHeader className='flex flex-col border-b @md/card:grid'>
          <CardTitle>Product Analytics</CardTitle>
          <CardDescription>Showing highest selling products for this month.</CardDescription>
          <CardAction className='mt-2 @md/card:mt-0'>
            <div className="flex gap-2 items-center mt-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Show:</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={productLimit}
                  onChange={(e) => setProductLimit(Number(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-sm text-center"
                />
                <span className="text-sm text-gray-600">products</span>
              </div>
              <Button onClick={() => setSortOrder('desc')} variant={sortOrder === 'desc' ? 'default' : 'outline'} size="sm">
                <ChevronDown size={16} />
              </Button>
              <Button onClick={() => setSortOrder('recent')} variant={sortOrder === 'recent' ? 'default' : 'outline'} size="sm">
                <History size={16} />
              </Button>
              <Button onClick={() => setSortOrder('asc')} variant={sortOrder === 'asc' ? 'default' : 'outline'} size="sm">
                <ChevronUp size={16} />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline'>
                    <CalendarIcon />
                    {range?.from && range?.to
                      ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
                      : `${startOfMonth.toLocaleDateString()} - ${today.toLocaleDateString()}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='end'>
                  <Calendar mode='range' defaultMonth={range?.from} selected={range} onSelect={setRange} fixedWeeks showOutsideDays disabled={{ after: today }} />
                </PopoverContent>
              </Popover>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className='px-4'>
          <div className="relative h-89 w-full">
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
                  <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                      dataKey='product_name' 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                      minTickGap={20}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0} // Show all ticks for the limited data
                      fontSize={10} // Smaller font to fit better
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className='w-[200px]'
                          nameKey='total_sales'
                          labelFormatter={v => v}
                          formatter={(value) => [`₱ ${Number(value).toLocaleString()}`, '']}
                        />
                      }
                    />
                    <Bar dataKey='total_sales' fill={`var(--color-total_sales)`} radius={4} onClick={handleBarClick} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-sm text-gray-600">No data for the selected range.</div>
              )}
            </div>
            <div aria-hidden className={`absolute inset-0 z-20 flex items-end px-4 pointer-events-none transition-opacity duration-300 ease-in-out ${(isUpdating || initialLoadingNoData) ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex w-full h-full items-end gap-3">
                {Array.from({ length: Math.max(6, chartData.length || 6) }).map((_, i) => {
                  const heights = [28, 44, 60, 36, 52, 40]
                  const pct = heights[i % heights.length]
                  return (
                    <div key={i} className="flex-1 flex items-end justify-center">
                      <div className="w-3/4">
                        <Skeleton className="rounded-t-md animate-pulse" style={{ height: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className='border-t'>
          <div className='text-sm'>
            Total sales: <span className='font-semibold'>₱ {total.toLocaleString()}</span>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-5xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>
              {selectedProduct ? `${selectedProduct} — Total Amount: ₱ ${productDetailsTotal.toLocaleString()}` : `₱ ${productDetailsTotal.toLocaleString()}`}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80 mt-4 rounded-md border bg-white">
            {sortedProductDetails.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border text-left">Product</th>
                    <th className="p-2 border text-center">Quantity Sold</th>
                    <th className="p-2 border text-center">Unit Price</th>
                    <th className="p-2 border text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProductDetails.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">{p.name}</td>
                      <td className="p-2 border text-center">{p.qty.toLocaleString()} {p.unit}</td>
                      <td className="p-2 border text-center">₱ {p.price.toLocaleString()}</td>
                      <td className="p-2 border text-center">₱ {p.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-center text-gray-500">No details found for this product.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
