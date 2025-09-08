'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { CalendarIcon, ChevronDown, ChevronUp, List } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import axios from "@/lib/axios";
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

type SaleItem = {
  product_id: number
  quantity: number
  created_at: string
}

type Product = {
  id: number
  name: string
  category_id: number
}

type Category = {
  id: number
  name: string
}

type ChartData = {
  category: string
  quantity: number
}

const chartConfig: ChartConfig = {
  quantity: {
    label: 'Transactions',
    color: 'var(--color-primary)'
  }
}
const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data.data;
};

export default function ProductStats() {
  const { data: saleItems = [], error: saleItemsError, isLoading: saleItemsLoading } = useSWR<SaleItem[]>(
    '/sales-items',
    fetcher
  )
  const { data: products = [], error: productsError, isLoading: productsLoading } = useSWR<Product[]>(
    '/products',
    fetcher
  )
  const { data: categories = [], error: categoriesError, isLoading: categoriesLoading } = useSWR<Category[]>(
    '/categories',
    fetcher
  )

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'normal'>('normal')

  // Map product_id to category_id
  const productCategoryMap = useMemo(() => {
    const map: Record<number, number> = {}
    products.forEach(p => {
      map[p.id] = p.category_id
    })
    return map
  }, [products])

  // Map category_id to category name
  const categoryNameMap = useMemo(() => {
    const map: Record<number, string> = {}
    categories.forEach(c => {
      map[c.id] = c.name
    })
    return map
  }, [categories])

  const isSameOrAfter = (a: Date, b: Date) =>
    a.setHours(0, 0, 0, 0) >= b.setHours(0, 0, 0, 0)
  const isSameOrBefore = (a: Date, b: Date) =>
    a.setHours(0, 0, 0, 0) <= b.setHours(0, 0, 0, 0)

  // Group by category_id and show category name
  const chartData = useMemo(() => {
    const grouped: { [category_id: string]: number } = {}
    saleItems.forEach(item => {
      const date = new Date(item.created_at)
      if (
        (!range?.from || isSameOrAfter(date, range.from)) &&
        (!range?.to || isSameOrBefore(date, range.to))
      ) {
        const category_id = productCategoryMap[item.product_id]
        if (category_id !== undefined) {
          grouped[category_id] = (grouped[category_id] || 0) + item.quantity
        }
      }
    })
    let arr = Object.entries(grouped)
      .map(([category_id, quantity]) => ({
        category: categoryNameMap[Number(category_id)] || `Category ${category_id}`,
        quantity
      }))
    if (sortOrder === 'asc') {
      arr = arr.sort((a, b) => a.quantity - b.quantity)
    } else if (sortOrder === 'desc') {
      arr = arr.sort((a, b) => b.quantity - a.quantity)
    }
    return arr
  }, [saleItems, range, productCategoryMap, categoryNameMap, sortOrder])

  const total = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.quantity, 0),
    [chartData]
  )

  if (saleItemsLoading || productsLoading || categoriesLoading) return <div>Loading...</div>
  if (saleItemsError || productsError || categoriesError) return <div>Error loading product stats.</div>

  return (
    <Card className='@container/card w-full'>
      <CardHeader className='flex flex-col border-b @md/card:grid'>
        <CardTitle>Product Analytics</CardTitle>
        <CardDescription>Showing most sold categories for this month.</CardDescription>
        <CardAction className='mt-2 @md/card:mt-0'>
          <div className="flex gap-2 items-center mt-2">
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
              aria-label="Sort Descending"
            >
              <ChevronDown size={16} />
            </Button>
            <Button
              variant={sortOrder === 'normal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('normal')}
              aria-label="Follow Order"
            >
              <List size={16} />
            </Button>
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
              aria-label="Sort Ascending"
            >
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
              <PopoverContent className='w-auto overflow-hidden p-0' align='end'>
                <Calendar
                  className='w-full'
                  mode='range'
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  fixedWeeks
                  showOutsideDays
                  disabled={{
                    after: today
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className='px-4'>
        <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='category'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='quantity'
                  labelFormatter={value => value}
                />
              }
            />
            <Bar dataKey='quantity' fill={`var(--color-quantity)`} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='border-t'>
        <div className='text-sm'>
          Total sold: <span className='font-semibold'>{total.toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  )
}