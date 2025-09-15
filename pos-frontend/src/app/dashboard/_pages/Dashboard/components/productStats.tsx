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

export default function ProductStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  // Change the default sort order from 'desc' to 'recent':
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'recent'>('recent')
  
  // State declarations
  const [open, setOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  // Also change the table sort order default:
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc' | 'recent'>('recent')
  const [productLimit, setProductLimit] = useState(15)

  // FIXED: Use a different approach - fetch from multiple categories
  const productSalesUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (range?.from) params.set('from_date', range.from.toISOString())
    if (range?.to) params.set('to_date', range.to.toISOString())
    // We'll fetch from a specific category first to test
    params.set('category_name', 'Lane 3') // Start with one category
    return `/sales-items/products-by-category?${params.toString()}`
  }, [range])

  // Fetch product sales data
  const { data: productSales = [], error, isLoading, isValidating } = useSWR(
    productSalesUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Transform the data to match our expected format
  const productSalesData = useMemo(() => {
    if (productSales.length === 0) return []
    
    const productMap = new Map<string, ProductSaleItem>()
    
    productSales.forEach((item: any) => {
      const productName = item.product_name || 'Unknown Product'
      const existing = productMap.get(productName)
      
      if (existing) {
        existing.total_sales += Number(item.total) || 0
        existing.quantity += Number(item.qty) || 0
        // Keep the most recent purchase date
        if (new Date(item.last_purchase) > new Date(existing.last_purchase)) {
          existing.last_purchase = item.last_purchase
        }
      } else {
        productMap.set(productName, {
          product_name: productName,
          total_sales: Number(item.total) || 0,
          quantity: Number(item.qty) || 0,
          price: Number(item.price) || 0,
          unit: item.unit || 'pcs',
          last_purchase: item.last_purchase
        })
      }
    })
    
    const result = Array.from(productMap.values())
    console.log('Product sales data:', result)
    return result
  }, [productSales])

  // Fetch products to get product names and units
  const { data: allProducts = [] } = useSWR(
    '/products?limit=all',
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Create a map of product_id to product info
  const productMap = useMemo(() => {
    const map = new Map<number, any>()
    allProducts.forEach((product: any) => {
      map.set(product.id, product)
    })
    return map
  }, [allProducts])

  // Fix the handleBarClick function:
  const handleBarClick = async (data: any) => {
    console.log('Clicked product:', data.product_name)
    setSelectedProduct(data.product_name)
    setOpen(true)
    setLoadingDetails(true)

    try {
      // Filter the productSales data for this specific product
      const productSalesItems = productSales.filter((item: any) => 
        item.product_name === data.product_name
      )

      console.log('Filtered product sales items:', productSalesItems)

      const transformedDetails = productSalesItems.map((item: any) => ({
        name: item.product_name,
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0,
        total: Number(item.total) || 0,
        unit: item.unit || 'pcs',
        last_purchase: item.last_purchase
      }))

      console.log('Transformed product details:', transformedDetails)
      setProductDetails(transformedDetails)
    } catch (error: any) {
      console.error('Error fetching product details:', error)
      setProductDetails([])
    } finally {
      setLoadingDetails(false)
    }
  }

  // Sort table data locally based on tableSortOrder
  const sortedProductDetails = useMemo(() => {
    switch (tableSortOrder) {
      case 'asc':
        return [...productDetails].sort((a, b) => (a.total || 0) - (b.total || 0))
      case 'desc':
        return [...productDetails].sort((a, b) => (b.total || 0) - (a.total || 0))
      case 'recent':
      default:
        return [...productDetails].sort((a, b) => {
          const ta = a.last_purchase ? new Date(a.last_purchase).getTime() : 0
          const tb = b.last_purchase ? new Date(b.last_purchase).getTime() : 0
          return tb - ta
        })
    }
  }, [productDetails, tableSortOrder])

  // Compute total of product details currently shown in modal
  const productDetailsTotal = productDetails.reduce((acc, p) => acc + (Number(p.total) || 0), 0)

  // Chart data with sorting
  const chartData = useMemo(() => {
    const arr = productSalesData.map(item => ({
      product_name: item.product_name,
      total_sales: item.total_sales,
      quantity: item.quantity,
      price: item.price,
      unit: item.unit,
      last_purchase: item.last_purchase
    }))

    // Debug log to see the actual data
    console.log('Product chart data before sorting:', arr)
    console.log('Total sales sum:', arr.reduce((acc, curr) => acc + curr.total_sales, 0))
    
    // Debug each product's total
    arr.forEach(item => {
      console.log(`Product: ${item.product_name}, Total Sales: ₱${item.total_sales.toLocaleString()}`)
    })

    // Sort first, then limit to the specified number of products
    let sorted
    switch (sortOrder) {
      case 'asc': 
        sorted = [...arr].sort((a, b) => a.total_sales - b.total_sales)
        break
      case 'desc': 
        sorted = [...arr].sort((a, b) => b.total_sales - a.total_sales)
        break
      case 'recent': 
        sorted = [...arr].sort((a, b) => new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime())
        break
      default: 
        sorted = [...arr].sort((a, b) => b.total_sales - a.total_sales)
    }
    
    // Limit to the specified number of products
    return sorted.slice(0, productLimit)
  }, [productSalesData, sortOrder, productLimit]) // Add productLimit to dependencies

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.total_sales, 0), [chartData])

  // Initial empty state: show skeleton full-chart if first load and no data
  const initialLoadingNoData = isLoading && productSalesData.length === 0
  // Updating overlay while revalidating (keep previous chart visible)
  const isUpdating = isValidating && productSalesData.length > 0

  return (
    <>
      <Card className='@container/card w-full relative'>
        <CardHeader className='flex flex-col border-b @md/card:grid'>
          <CardTitle>Product Analytics</CardTitle>
          <CardDescription>Showing highest selling products for this month.</CardDescription>
          <CardAction className='mt-2 @md/card:mt-0'>
            <div className="flex gap-2 items-center mt-2">
              {/* Add the input field here */}
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
                <div className="w-full h-full">
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
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className='w-[200px]'
                            nameKey='total_sales'
                            labelFormatter={v => v}
                            formatter={(value, name, props) => {
                              console.log('Tooltip data:', { value, name, props })
                              return [
                                `₱ ${Number(value).toLocaleString()}`,
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
                  {error ? (
                    <div className="text-sm text-red-600">Error loading product stats.</div>
                  ) : (!isLoading && productSalesData.length === 0) ? (
                    <div className="text-sm text-gray-600">No data for the selected range.</div>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              )}
            </div>

            {/* Skeleton overlay */}
            <div
              aria-hidden
              className={`absolute inset-0 z-20 flex items-end px-4 pointer-events-none transition-opacity duration-300 ease-in-out ${(isUpdating || initialLoadingNoData) ? 'opacity-100' : 'opacity-0'
                }`}
            >
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

      {/* Modal with product details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-5xl sm:max-w-4xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold items-center">
                {selectedProduct ? `${selectedProduct} — Total Amount: ₱ ${productDetailsTotal.toLocaleString()}` : `₱ ${productDetailsTotal.toLocaleString()}`}
              </DialogTitle>
              <div className="text-sm text-gray-600 mt-1">
                Total Quantity Sold: {productDetails.reduce((acc, p) => acc + p.qty, 0).toLocaleString()} {productDetails[0]?.unit || 'units'}
              </div>
            </div>
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

          <ScrollArea className="h-80 mt-4 rounded-md border bg-white">
            {loadingDetails && productDetails.length === 0 && (
              <div className="p-4 text-center text-gray-600">Loading product details…</div>
            )}

            {sortedProductDetails.length > 0 ? (
              <>
                {loadingDetails && (
                  <div className="p-2 text-sm text-gray-600 border-b">Updating details…</div>
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
                    {sortedProductDetails.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="p-2 border font-medium">{p.name}</td>
                        <td className="p-2 border text-center font-semibold text-blue-600">
                          {p.qty.toLocaleString()} {p.unit}
                        </td>
                        <td className="p-2 border text-left">₱ {p.price.toLocaleString()}</td>
                        <td className="p-2 border text-left font-semibold">₱ {p.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              !loadingDetails && (
                <p className="p-4 text-center text-gray-500">No details found for this product.</p>
              )
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
