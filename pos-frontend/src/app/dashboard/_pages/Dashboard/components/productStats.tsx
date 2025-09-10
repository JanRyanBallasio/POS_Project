'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { CalendarIcon, ChevronDown, ChevronUp, History } from 'lucide-react'
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
  category: string
  quantity: number
  last_purchase: string // from backend
}

type ChartData = SaleItem

const chartConfig: ChartConfig = {
  quantity: {
    label: 'Transactions',
    color: 'var(--color-primary)'
  }
}

const fetcher = async (url: string) => {
  const response = await axios.get(url)
  const payload = response.data

  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data

  return payload
}

export default function ProductStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })

  // ✅ include "recent" in the type
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'recent'>('recent')

  // build URL for sale-items including from/to if present
  const saleItemsUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', 'all')
    if (range?.from) params.set('from', (range.from as Date).toISOString())
    if (range?.to) params.set('to', (range.to as Date).toISOString())
    return `/sales-items?${params.toString()}`
  }, [range])

  const {
    data: saleItems = [],
    error: saleItemsError,
    isLoading: saleItemsLoading,
    isValidating
  } = useSWR<SaleItem[]>(saleItemsUrl, fetcher, {
    keepPreviousData: true,
  })

  // Transform + sort chart data
  const chartData = useMemo<ChartData[]>(() => {
    const arr = Array.isArray(saleItems)
      ? saleItems.map(si => ({
        category: si.category,
        quantity: Number(si.quantity) || 0,
        last_purchase: si.last_purchase,
      }))
      : []

    switch (sortOrder) {
      case 'asc':
        return [...arr].sort((a, b) => a.quantity - b.quantity)
      case 'desc':
        return [...arr].sort((a, b) => b.quantity - a.quantity)
      case 'recent':
        return [...arr].sort(
          (a, b) =>
            new Date(b.last_purchase).getTime() -
            new Date(a.last_purchase).getTime()
        )
      default:
        return arr
    }
  }, [saleItems, sortOrder])

  const total = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.quantity, 0),
    [chartData]
  )

  if (saleItemsLoading && !isValidating) return <div>Loading...</div>
  if (saleItemsError) return <div>Error loading product stats.</div>

  return (
    <Card className='@container/card w-full relative'>
      {isValidating && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
          <span className="text-sm text-gray-600">Updating…</span>
        </div>
      )}
      <CardHeader className='flex flex-col border-b @md/card:grid'>
        <CardTitle>Product Analytics</CardTitle>
        <CardDescription>
          Showing most sold categories for this month.
        </CardDescription>
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
              variant={sortOrder === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('recent')}
              aria-label="Sort by Recent"
            >
              <History size={16} />
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
                  disabled={{ after: today }}
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
            margin={{ left: 12, right: 12 }}
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
          Total sold:{' '}
          <span className='font-semibold'>{total.toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
