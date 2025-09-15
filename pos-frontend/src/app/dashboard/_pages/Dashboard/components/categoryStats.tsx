'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
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

type SaleItem = {
  category: string
  quantity: number
  total_sales: number  // Add this field
  last_purchase: string
  unit?: string
}

type Product = {
  name: string
  qty: number
  price: number
  unit?: string
  last_purchase?: string // Add this property
  total?: number // Add this property too
}

type ChartData = SaleItem

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

// Fetch products to get unit information
const productsFetcher = async () => {
  const response = await axios.get('/products?limit=all')
  return response.data?.data || response.data || []
}

export default function ProductStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  // Change the default sort order from 'desc' to 'recent':
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'recent'>('recent')
  
  // ADD: Move these state declarations here
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  // Also change the table sort order default:
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc' | 'recent'>('recent')
  const [categoryTotals, setCategoryTotals] = useState<{[key: string]: number}>({})

  const saleItemsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (range?.from) params.set('from', range.from.toISOString())
    if (range?.to) params.set('to', range.to.toISOString())
    return `/sales-items?${params.toString()}`
  }, [range])

  // Keep previous data during revalidation and avoid refetch on window focus
  const { data: saleItems = [], error, isLoading, isValidating } = useSWR<SaleItem[]>(
    saleItemsUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Fetch products to get unit information
  const { data: allProducts = [] } = useSWR(
    '/products?limit=all',
    productsFetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Create a map of category to unit (assuming products in same category have same unit)
  const categoryUnitMap = useMemo(() => {
    const map = new Map<string, string>()
    console.log('All products for mapping:', allProducts) // Debug log
    allProducts.forEach((product: any) => {
      if (product.category_id && product.unit) {
        // We need to find the actual category name, not just "Category X"
        // Let's use the category_id to map to the actual category name from the chart data
        map.set(`Category ${product.category_id}`, product.unit)

        // Also try to map common category names
        if (product.category_name) {
          map.set(product.category_name, product.unit)
        }
      }
    })
    console.log('Final category-unit map:', map) // Debug log
    return map
  }, [allProducts])

  // MODIFY: Update handleBarClick to also calculate the correct total for tooltip
  const handleBarClick = async (data: any) => {
    console.log('Clicked category:', data.category)
    setSelectedCategory(data.category)
    setOpen(true)
    setLoadingProducts(true)

    try {
      const params = new URLSearchParams()
      params.set('category_name', data.category)
      if (range?.from) params.set('from_date', range.from.toISOString())
      if (range?.to) params.set('to_date', range.to.toISOString())

      const url = `/sales-items/products-by-category?${params.toString()}`
      console.log('Making request to:', url)

      const response = await axios.get(url)
      console.log('Products by category response:', response.data)
      const items = response.data?.data || response.data || []
      console.log('Parsed product items:', items)

      // Find the correct unit for this category
      let categoryUnit = 'pcs' // default
      const categoryProduct = allProducts.find((p: any) => {
        return p.category_name === data.category ||
          p.category_id && `Category ${p.category_id}` === data.category
      })
      if (categoryProduct && categoryProduct.unit) {
        categoryUnit = categoryProduct.unit
      }

      // Transform the data to match expected structure
      const transformedItems = items.map((item: any) => ({
        name: item.product_name || 'Unknown Product',
        qty: item.qty || 0,
        price: item.price || 0,
        total: item.total || 0,
        unit: item.unit || 'pcs',
        last_purchase: item.last_purchase
      }))

      console.log('Transformed product items:', transformedItems)
      setProducts(transformedItems)

      // ADD: Calculate and store the correct total for this category
      const correctTotal = transformedItems.reduce((acc: number, item: Product) => acc + (Number(item.total) || 0), 0)
      setCategoryTotals(prev => ({
        ...prev,
        [data.category]: correctTotal
      }))
      
      console.log(`Correct total for ${data.category}: ₱${correctTotal.toLocaleString()}`)
    } catch (error: any) {
      console.error('Error fetching products by category:', error)
      console.error('Error details:', error.response?.data)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }
  // Sort table data locally based on tableSortOrder
  const sortedProducts = useMemo(() => {
    switch (tableSortOrder) {
      case 'asc':
        return [...products].sort((a, b) => (a.total || 0) - (b.total || 0))
      case 'desc':
        return [...products].sort((a, b) => (b.total || 0) - (a.total || 0))
      case 'recent':
      default:
        // newest first by last_purchase (robust to missing values)
        return [...products].sort((a, b) => {
          const ta = a.last_purchase ? new Date(a.last_purchase).getTime() : 0
          const tb = b.last_purchase ? new Date(b.last_purchase).getTime() : 0
          return tb - ta
        })
    }
  }, [products, tableSortOrder])

  // compute total of products currently shown in modal
  const productsTotal = products.reduce((acc, p) => acc + (Number(p.total) || 0), 0)

  // ADD: Debug the modal total calculation
  console.log('Modal products:', products)
  console.log('Modal total calculation:', productsTotal)
  console.log('Individual product totals:', products.map(p => ({ name: p.name, total: p.total })))

  // initial empty state: show skeleton full-chart if first load and no data
  const initialLoadingNoData = isLoading && saleItems.length === 0
  // updating overlay while revalidating (keep previous chart visible)
  const isUpdating = isValidating && saleItems.length > 0

  // Note: do not return early on error — render error inside the chart area so header/footer remain visible.

  // ADD: Fetch correct totals for all categories
  const fetchCategoryTotals = useCallback(async () => {
    if (!range?.from || !range?.to) return

    try {
      const categoryTotalsMap: {[key: string]: number} = {}
      
      // Get all unique categories from saleItems
      const categories = [...new Set(saleItems.map(si => si.category))]
      
      // Fetch totals for each category
      for (const category of categories) {
        try {
          const params = new URLSearchParams()
          params.set('category_name', category)
          params.set('from_date', range.from.toISOString())
          params.set('to_date', range.to.toISOString())

          const response = await axios.get(`/sales-items/products-by-category?${params.toString()}`)
          const items = response.data?.data || response.data || []
          
          const total = items.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0)
          categoryTotalsMap[category] = total
          
          console.log(`Correct total for ${category}: ₱${total.toLocaleString()}`)
        } catch (error) {
          console.error(`Error fetching total for ${category}:`, error)
          // Fallback to original total
          const originalItem = saleItems.find(si => si.category === category)
          categoryTotalsMap[category] = Number(originalItem?.total_sales) || 0
        }
      }
      
      setCategoryTotals(categoryTotalsMap)
    } catch (error) {
      console.error('Error fetching category totals:', error)
    }
  }, [saleItems, range])

  // ADD: Effect to fetch category totals when data changes
  useEffect(() => {
    if (saleItems.length > 0 && range?.from && range?.to) {
      fetchCategoryTotals()
    }
  }, [saleItems, range, fetchCategoryTotals])

  // MODIFY: Update chartData to use correct totals when available
  const chartData = useMemo(() => {
    const arr = saleItems.map(si => {
      // Try to find the unit for this category
      let unit = 'pcs' // default

      // First try to find by exact category name
      if (categoryUnitMap.has(si.category)) {
        unit = categoryUnitMap.get(si.category)!
      } else {
        // If not found, try to find by looking up products in this category
        const categoryProduct = allProducts.find((p: any) => {
          return p.category_name === si.category ||
            p.category_id && `Category ${p.category_id}` === si.category
        })
        if (categoryProduct && categoryProduct.unit) {
          unit = categoryProduct.unit
        }
      }

      // USE CORRECT TOTAL if available, otherwise use the aggregated total
      const totalSales = categoryTotals[si.category] || Number(si.total_sales) || 0

      return {
        category: si.category,
        quantity: Number(si.quantity) || 0,
        total_sales: totalSales, // Use correct total
        last_purchase: si.last_purchase,
        unit: unit
      }
    })

    // Debug log to see the actual data
    console.log('Chart data before sorting:', arr)
    console.log('Total sales sum:', arr.reduce((acc, curr) => acc + curr.total_sales, 0))
    
    // Debug each category's total
    arr.forEach(item => {
      console.log(`Category: ${item.category}, Total Sales: ₱${item.total_sales.toLocaleString()}`)
    })

    switch (sortOrder) {
      case 'asc': return [...arr].sort((a, b) => a.total_sales - b.total_sales)
      case 'desc': return [...arr].sort((a, b) => b.total_sales - a.total_sales)
      case 'recent': return [...arr].sort((a, b) => new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime())
      default: return [...arr].sort((a, b) => b.total_sales - a.total_sales)
    }
  }, [saleItems, sortOrder, categoryUnitMap, allProducts, categoryTotals]) // ADD categoryTotals to dependencies

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.total_sales, 0), [chartData])

  return (
    <>
      <Card className='@container/card w-full relative'>
        <CardHeader className='flex flex-col border-b @md/card:grid'>
          <CardTitle>Category Analytics</CardTitle>
          <CardDescription>Showing most sold categories for this month.</CardDescription>
          <CardAction className='mt-2 @md/card:mt-0'>
            <div className="flex gap-2 items-center mt-2">
              <Button onClick={() => setSortOrder('desc')} variant={sortOrder === 'desc' ? 'default' : 'outline'} size="sm"><ChevronDown size={16} /></Button>
              <Button onClick={() => setSortOrder('recent')} variant={sortOrder === 'recent' ? 'default' : 'outline'} size="sm"><History size={16} /></Button>
              <Button onClick={() => setSortOrder('asc')} variant={sortOrder === 'asc' ? 'default' : 'outline'} size="sm"><ChevronUp size={16} /></Button>
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

        {/* CardContent is always rendered so header/footer don't disappear */}
        <CardContent className='px-4'>
          {/* Chart wrapper: relative so we can overlay the skeleton.
              h-89 is preserved on the wrapper so size remains constant. */}
          <div className="relative h-89 w-full">
            {/* Chart area (keeps previous data visible because SWR keepPreviousData is enabled).
                We render either:
                  - the chart (when there is chart data),
                  - a "no data" / error message (when not loading & no data),
                  - underlying empty area (chart hidden) while initial skeleton shows on top.
            */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              {chartData.length > 0 ? (
                <div className="w-full h-full">
                  {/* ChartContainer sized to fill the area */}
                  <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
                    <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey='category' tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className='w-[150px]'
                            nameKey='total_sales'
                            labelFormatter={v => v}
                            formatter={(value, name, props) => {
                              console.log('Tooltip data:', { value, name, props }) // Debug log
                              return [
                                `₱ ${Number(value).toLocaleString()}`, // Show just the price
                                '' // Empty string instead of 'Total Sales'
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
                // show helpful messages when there is no chart data
                <div className="w-full h-full flex items-center justify-center px-4">
                  {error ? (
                    <div className="text-sm text-red-600">Error loading product stats.</div>
                  ) : (!isLoading && saleItems.length === 0) ? (
                    <div className="text-sm text-gray-600">No data for the selected range.</div>
                  ) : (
                    // keep empty while initial skeleton (below) handles first-load UX
                    <div className="w-full h-full" />
                  )}
                </div>
              )}
            </div>

            {/* Skeleton overlay — used both for initial loading (no data) and for updates.
                Overlay sits above chart (z-20), fades in/out using transition-opacity.
                pointer-events-none ensures underlying chart remains interactive if needed. */}
            <div
              aria-hidden
              className={`absolute inset-0 z-20 flex items-end px-4 pointer-events-none transition-opacity duration-300 ease-in-out ${(isUpdating || initialLoadingNoData) ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <div className="flex w-full h-full items-end gap-3">
                {Array.from({ length: Math.max(6, chartData.length || 6) }).map((_, i) => {
                  // create some height variety for a natural skeleton chart
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

      {/* Modal with filter buttons + scroll area */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-5xl sm:max-w-4xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold items-center">
              {selectedCategory ? `${selectedCategory} — Total Amount: ₱ ${productsTotal.toLocaleString()}` : `₱ ${productsTotal.toLocaleString()}`}
            </DialogTitle>
            <div className="flex gap-2 pr-4">
              <Button
                onClick={() => setTableSortOrder('desc')}
                variant={tableSortOrder === 'desc' ? 'default' : 'outline'}
                size="icon"
                className="w-8 h-8"
              >
                <ChevronDown size={16} />
              </Button>
              <Button
                onClick={() => setTableSortOrder('recent')}
                variant={tableSortOrder === 'recent' ? 'default' : 'outline'}
                size="icon"
                className="w-8 h-8"
              >
                <History size={16} />
              </Button>
              <Button
                onClick={() => setTableSortOrder('asc')}
                variant={tableSortOrder === 'asc' ? 'default' : 'outline'}
                size="icon"
                className="w-8 h-8"
              >
                <ChevronUp size={16} />
              </Button>
            </div>
          </DialogHeader>

          {/* Table area */}
          <ScrollArea className="h-80 mt-4 rounded-md border bg-white">
            {/* If we're loading and have no previous products, show loading message */}
            {loadingProducts && products.length === 0 && (
              <div className="p-4 text-center text-gray-600">Loading products…</div>
            )}

            {/* Show existing / fetched table if we have products */}
            {sortedProducts.length > 0 ? (
              <>
                {/* optional small loader banner while updating */}
                {loadingProducts && (
                  <div className="p-2 text-sm text-gray-600 border-b">Updating products…</div>
                )}
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 border text-left font-semibold">Product</th>
                      <th className="p-2 border text-center font-semibold">Quantity Sold</th>
                      <th className="p-2 border text-center font-semibold">Unit Price</th>
                      <th className="p-2 border text-center font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="p-2 border font-medium">{p.name}</td>
                        <td className="p-2 border text-center font-semibold text-blue-600">
                          {p.qty.toLocaleString()} {p.unit}
                        </td>
                        <td className="p-2 border text-left">₱ {p.price.toLocaleString()}</td>
                        <td className="p-2 border text-left font-semibold">₱ {(p.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              // If not loading and no products, show empty state
              !loadingProducts && (
                <p className="p-4 text-center text-gray-500">No products found for this category.</p>
              )
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
