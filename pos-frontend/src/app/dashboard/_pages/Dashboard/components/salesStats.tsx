'use client'

import * as React from 'react'
import useSWR from 'swr'
import axios from "@/lib/axios";
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import { CalendarIcon, List, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

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
import { Skeleton } from '@/components/ui/skeleton'

type SalesTotal = {
  sale_date: string
  total_sales: number
  total_items: number
  total_transactions: number
}

type ChartData = {
  date: string
  customer: number
}

const chartConfig: ChartConfig = {
  customer: {
    label: 'Total',
    color: 'var(--color-primary)'
  }
}

const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data?.data || []
}

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

// Convert an ISO created_at (UTC) to a Manila YYYY-MM-DD string
function createdAtToManilaYmd(iso: string) {
  const d = new Date(iso) // UTC time
  const manila = new Date(d.getTime() + MANILA_OFFSET_MS)
  const y = manila.getUTCFullYear()
  const m = String(manila.getUTCMonth() + 1).padStart(2, '0')
  const day = String(manila.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// iterate dates inclusive (local dates)
function eachDayInclusive(from: Date, to: Date) {
  const arr: Date[] = []
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  while (cur <= end) {
    arr.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return arr
}

// format YYYY-MM-DD from local Date
function ymd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// parse YYYY-MM-DD into a local Date (avoid timezone shifts)
function parseYmdToLocalDate(ymdStr: string) {
  const [y, m, d] = ymdStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function SalesStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | 'normal'>('normal')

  // Updated URL to use the new sales totals endpoint
  const salesUrl = React.useMemo(() => {
    if (!range?.from || !range?.to) return '/sales/totals'
    const fromIso = manilaDayStartUTCiso(range.from)
    const toIso = manilaNextDayStartUTCiso(range.to) // exclusive end: includes the whole `range.to` Manila day
    return `/sales/totals?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  }, [range?.from?.getTime(), range?.to?.getTime()])

  // Keep previous data during revalidation to avoid flicker
  const { data: salesTotals = [], error, isLoading, isValidating } = useSWR<SalesTotal[]>(
    salesUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Convert sales totals to chart data format
  const chartData = React.useMemo(() => {
    return salesTotals.map(total => ({
      date: total.sale_date,
      customer: total.total_sales
    }))
  }, [salesTotals])

  // Calculate total sales for the period - this will now match the Category Analytics total
  const totalSales = React.useMemo(() => {
    return salesTotals.reduce((sum, total) => sum + (total.total_sales || 0), 0)
  }, [salesTotals])

  // --- NEW: compute chartDisplayData based on sortOrder ---
  const chartDisplayData = React.useMemo(() => {
    if (sortOrder === 'normal') return chartData
    const arr = [...chartData]
    if (sortOrder === 'asc') {
      arr.sort((a, b) => a.customer - b.customer)
    } else if (sortOrder === 'desc') {
      arr.sort((a, b) => b.customer - a.customer)
    }
    return arr
  }, [chartData, sortOrder])
  // -------------------------------------------------------

  // sortedDataForTable (affects table/summaries only)
  const sortedDataForTable = React.useMemo(() => {
    let arr = [...chartData]
    if (sortOrder === 'asc') arr.sort((a, b) => a.customer - b.customer)
    else if (sortOrder === 'desc') arr.sort((a, b) => b.customer - a.customer)
    return arr
  }, [chartData, sortOrder])

  // total sums the filtered chartData values
  const total = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.customer, 0),
    [chartData]
  )

  // Detect "empty" period: all points are zero
  const isEmptyPeriod = React.useMemo(() => {
    return chartData.length > 0 && chartData.every(pt => (pt.customer ?? 0) === 0)
  }, [chartData])

  const initialLoadingNoData = isLoading && salesTotals.length === 0
  const isUpdating = isValidating && salesTotals.length > 0

  if (error && !salesTotals.length) return <div>Error loading sales data.</div>

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-semibold font-xl">Sales Chart</CardTitle>
          <CardDescription>Filter total sales by date range</CardDescription>
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
            {initialLoadingNoData ? (
              <div className="flex flex-col items-center space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            ) : isEmptyPeriod ? (
              <div className="text-center text-muted-foreground">
                <p>No sales data for the selected period.</p>
                <p className="text-sm">Try selecting a different date range.</p>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full">
                <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
                  <LineChart
                    accessibilityLayer
                    data={chartDisplayData}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={20}
                      tickFormatter={value => {
                        const date = parseYmdToLocalDate(String(value))
                        return date.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className='w-[200px]'
                          nameKey='customer'
                          labelFormatter={value =>
                            parseYmdToLocalDate(String(value)).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          }
                          formatter={(value, name, props) => {
                            return [
                              `₱ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                              ''
                            ]
                          }}
                        />
                      }
                    />
                    <Line
                      dataKey="customer"
                      type="monotone"
                      stroke={`var(--color-customer)`}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">You had</span>
          <span className="text-lg font-bold">₱ {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-sm text-muted-foreground">total sales for the selected period.</span>
        </div>
      </CardFooter>
    </Card>
  )
}