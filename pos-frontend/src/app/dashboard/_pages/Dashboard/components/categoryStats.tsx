'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { CalendarIcon, ChevronDown, ChevronUp, History, List } from 'lucide-react'
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

// Manila offset in ms
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000

// Return UTC ISO that corresponds to Manila 00:00:00.000 for the provided date (inclusive start).
// Caller should pass a Date representing the selected local day (from calendar).
function manilaDayStartUTCiso(d: Date) {
  const manilaLocal = new Date(d.getTime() + MANILA_OFFSET_MS)
  const y = manilaLocal.getUTCFullYear()
  const m = manilaLocal.getUTCMonth()
  const day = manilaLocal.getUTCDate()
  const manilaMidnightUTCms = Date.UTC(y, m, day, 0, 0, 0) - MANILA_OFFSET_MS
  return new Date(manilaMidnightUTCms).toISOString() // inclusive start
}

// Return UTC ISO for Manila next-day 00:00:00.000 (exclusive end).
// Use this as `to` so backend can use created_at < to and include the whole last Manila day.
function manilaNextDayStartUTCiso(d: Date) {
  const manilaLocal = new Date(d.getTime() + MANILA_OFFSET_MS)
  const y = manilaLocal.getUTCFullYear()
  const m = manilaLocal.getUTCMonth()
  const day = manilaLocal.getUTCDate()
  const manilaMidnightUTCms = Date.UTC(y, m, day, 0, 0, 0) - MANILA_OFFSET_MS
  const nextMidnight = manilaMidnightUTCms + 24 * 60 * 60 * 1000
  return new Date(nextMidnight).toISOString() // exclusive end
}

type CategoryAnalytics = {
  category: string
  total_sales: number
  total_items: number
}

type CategoryAnalyticsResponse = {
  salesTotals: Array<{
    sale_date: string
    total_sales: number
    total_items: number
    total_transactions: number
  }>
  categoryAnalytics: CategoryAnalytics[]
}

type Product = {
  name: string
  qty: number
  price: number
  unit?: string
  last_purchase?: string
  total?: number
}

type ChartData = CategoryAnalytics

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

export default function CategoryStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  
  // NEW: Add sorting state for category analytics
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'normal'>('normal')
  
  // State for dialog
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc' | 'recent'>('recent')

  // Updated URL to use the new category analytics endpoint - FIXED: Use same date conversion as Sales Chart
  const categoryAnalyticsUrl = useMemo(() => {
    if (!range?.from || !range?.to) return '/sales/category-analytics'
    const fromIso = manilaDayStartUTCiso(range.from)
    const toIso = manilaNextDayStartUTCiso(range.to) // exclusive end: includes the whole `range.to` Manila day
    return `/sales/category-analytics?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  }, [range?.from?.getTime(), range?.to?.getTime()])

  // Keep previous data during revalidation and avoid refetch on window focus
  const { data: analyticsData, error, isLoading, isValidating } = useSWR<CategoryAnalyticsResponse>(
    categoryAnalyticsUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Extract category analytics data
  const chartData = useMemo(() => {
    return analyticsData?.categoryAnalytics || []
  }, [analyticsData])

  // NEW: Add sorting logic for category chart data
  const sortedChartData = useMemo(() => {
    if (sortOrder === 'normal') return chartData
    
    const sorted = [...chartData]
    switch (sortOrder) {
      case 'desc':
        return sorted.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
      case 'asc':
        return sorted.sort((a, b) => (a.total_sales || 0) - (b.total_sales || 0))
      default:
        return sorted
    }
  }, [chartData, sortOrder])

  // Calculate total sales from the sales totals - this will now match the Sales Chart total
  const totalSales = useMemo(() => {
   
    
    if (!analyticsData?.salesTotals) return 0
    return analyticsData.salesTotals.reduce((sum, total) => sum + (total.total_sales || 0), 0)
  }, [analyticsData])

  const isUpdating = isValidating && chartData.length > 0

  // Handle bar click to show products - FIXED: Use same date conversion and better data handling
  const handleBarClick = useCallback(async (data: any) => {
    if (!data?.category) return
    
    setSelectedCategory(data.category)
    setOpen(true)
    setLoadingProducts(true)
    
    try {
      const params = new URLSearchParams()
      params.set('category_name', data.category)
      
      // FIXED: Use proper Manila timezone conversion like Sales Chart
      if (range?.from) {
        const fromIso = manilaDayStartUTCiso(range.from)
        params.set('from_date', fromIso)
      }
      if (range?.to) {
        const toIso = manilaNextDayStartUTCiso(range.to)
        params.set('to_date', toIso)
      }
      
      const response = await axios.get(`/sales-items/products-by-category?${params.toString()}`)
      const products = response.data?.data || response.data || []
      
      // FIXED: Transform the data to match the expected format
      const transformedProducts = products.map((item: any) => ({
        name: item.product_name || item.name || 'Unknown Product',
        qty: Number(item.qty || item.quantity || 0),
        price: Number(item.price || 0),
        total: Number(item.total || (item.qty || item.quantity || 0) * (item.price || 0)),
        unit: item.unit || 'pcs',
        last_purchase: item.last_purchase || item.created_at
      }))
      
      setProducts(transformedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [range])

  // Sort products based on table sort order
  const sortedProducts = useMemo(() => {
    if (!products.length) return []
    
    const sorted = [...products]
    switch (tableSortOrder) {
      case 'asc':
        return sorted.sort((a, b) => (a.total || 0) - (b.total || 0))
      case 'desc':
        return sorted.sort((a, b) => (b.total || 0) - (a.total || 0))
      case 'recent':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.last_purchase || 0)
          const dateB = new Date(b.last_purchase || 0)
          return dateB.getTime() - dateA.getTime()
        })
      default:
        return sorted
    }
  }, [products, tableSortOrder])

  if (error && !chartData.length) return <div>Error loading category data.</div>

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">Category Analytics</CardTitle>
            <CardDescription>Showing most sold categories for this month.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {/* NEW: Filter Icons */}
            <div className="flex items-center space-x-1">
              <Button
                variant={sortOrder === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('normal')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('desc')}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('asc')}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Existing Calendar Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="w-[260px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range?.from ? (
                    range.to ? (
                      <>
                        {range.from.toLocaleDateString()} -{" "}
                        {range.to.toLocaleDateString()}
                      </>
                    ) : (
                      range.from.toLocaleDateString()
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className='px-4'>
          <div className="relative h-89 w-full">
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              {sortedChartData.length > 0 ? (
                <div className="w-full h-full">
                  <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
                    <BarChart data={sortedChartData} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey='category' tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className='w-[150px]'
                            nameKey='total_sales'
                            labelFormatter={v => v}
                            formatter={(value, name, props) => {
                              return [
                                `₱ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                ''
                              ]
                            }}
                          />
                        }
                      />
                      <Bar dataKey='total_sales' fill={`var(--color-total_sales)`} radius={4} onClick={handleBarClick} />
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center px-4">
                  <div className="text-center text-muted-foreground">
                    <p>No category data for the selected period.</p>
                    <p className="text-sm">Try selecting a different date range.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Total sales:</span>
            <span className="text-lg font-bold">₱ {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </CardFooter>
      </Card>

      {/* Products Dialog - IMPROVED: Wider modal with totals */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-5xl sm:max-w-4xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold items-center">
                {selectedCategory ? `Products in ${selectedCategory} — Total Amount: ₱ ${products.reduce((acc, p) => acc + (p.total || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Products'}
              </DialogTitle>
              <div className="text-sm text-gray-600 mt-1">
                Total Products: {products.length} • Total Quantity Sold: {products.reduce((acc, p) => acc + (p.qty || 0), 0).toLocaleString()} {products[0]?.unit || 'units'}
              </div>
            </div>
            <div className="flex gap-2 pr-4">
              <Button
                variant={tableSortOrder === 'recent' ? 'default' : 'outline'}
                size="icon"
                className="w-8 h-8"
                onClick={() => setTableSortOrder('recent')}
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant={tableSortOrder === 'desc' ? 'default' : 'outline'}
                size="icon"
                className="w-8 h-8"
                onClick={() => setTableSortOrder('desc')}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant={tableSortOrder === 'asc' ? 'default' : 'outline'}
                size="icon"
                className="w-8 h-8"
                onClick={() => setTableSortOrder('asc')}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <ScrollArea className="h-[400px]">
              {loadingProducts ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className="space-y-2">
                  {sortedProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.qty} {product.unit || 'units'} • Last: {product.last_purchase ? new Date(product.last_purchase).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₱ {Number(product.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground">₱ {Number(product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No products found for this category.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
