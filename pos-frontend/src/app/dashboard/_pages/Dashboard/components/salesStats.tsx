'use client'

import * as React from 'react'
import useSWR from 'swr'
import axios from "@/lib/axios";
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import { CalendarIcon, List, ChevronDown, ChevronUp } from 'lucide-react'
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

type Sale = {
  created_at: string
  total_purchase: number
}

type AggregatedSale = {
  sale_date: string
  total_sales: number
}

// Create a union type for flexibility
type SalesData = Sale | AggregatedSale

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
  // d is already a local date from the calendar picker
  // We need to treat it as if it's a Manila date and convert to UTC
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  
  // Create Manila midnight for this date, then convert to UTC
  const manilaMidnightUTCms = Date.UTC(y, m, day, 0, 0, 0) - MANILA_OFFSET_MS
  return new Date(manilaMidnightUTCms).toISOString()
}

function manilaNextDayStartUTCiso(d: Date) {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  
  // Create Manila midnight for this date, add 24 hours, then convert to UTC
  const manilaMidnightUTCms = Date.UTC(y, m, day, 0, 0, 0) - MANILA_OFFSET_MS
  const nextMidnight = manilaMidnightUTCms + 24 * 60 * 60 * 1000
  return new Date(nextMidnight).toISOString()
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

  // build URL with from/to when range selected (convert to Manila day boundaries -> UTC ISO)
  // pass from = Manila 00:00 (inclusive), to = next Manila 00:00 (exclusive) so backend can use gte / lt
  const salesUrl = React.useMemo(() => {
    if (!range?.from || !range?.to) return '/sales?aggregate=daily'
    const fromIso = manilaDayStartUTCiso(range.from)
    const toIso = manilaNextDayStartUTCiso(range.to)
    return `/sales?aggregate=daily&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  }, [range?.from?.getTime(), range?.to?.getTime()])

  // Keep previous data during revalidation to avoid flicker
  const { data: sales = [], error, isLoading, isValidating } = useSWR<SalesData[]>(
    salesUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  // Group by Manila date (YYYY-MM-DD)
  const groupedByDateMap = React.useMemo(() => {
    const map = new Map<string, number>()
    
    sales.forEach(sale => {
      if ('sale_date' in sale) {
        // Aggregated data from the new API
        map.set(sale.sale_date, sale.total_sales || 0)
      } else {
        // Individual sales data (fallback)
        const key = createdAtToManilaYmd(sale.created_at)
        map.set(key, (map.get(key) || 0) + (sale.total_purchase || 0))
      }
    })
    
    return map
  }, [sales])

  // Build full date series based on selected range (or fallback to data date span)
  const chartSeries = React.useMemo(() => {
    let fromDate: Date
    let toDate: Date
    
    if (range?.from && range?.to) {
      fromDate = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate())
      toDate = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())
    } else if (sales.length > 0) {
      const keys = Array.from(groupedByDateMap.keys()).sort()
      const min = parseYmdToLocalDate(keys[0])
      const max = parseYmdToLocalDate(keys[keys.length - 1])
      fromDate = new Date(min.getFullYear(), min.getMonth(), min.getDate())
      toDate = new Date(max.getFullYear(), max.getMonth(), max.getDate())
    } else {
      const today = new Date()
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      toDate = fromDate
    }

    const days = eachDayInclusive(fromDate, toDate)
    return days.map(d => {
      const key = ymd(d) // YYYY-MM-DD (Manila/local day keys)
      return {
        date: key,
        customer: groupedByDateMap.get(key) || 0
      }
    })
  }, [range?.from?.getTime(), range?.to?.getTime(), sales, groupedByDateMap])

  // --- NEW: compute chartDisplayData based on sortOrder ---
  const chartDisplayData = React.useMemo(() => {
    if (sortOrder === 'normal') return chartSeries
    const arr = [...chartSeries]
    if (sortOrder === 'asc') {
      arr.sort((a, b) => a.customer - b.customer)
    } else if (sortOrder === 'desc') {
      arr.sort((a, b) => b.customer - a.customer)
    }
    return arr
  }, [chartSeries, sortOrder])
  // -------------------------------------------------------

  // sortedDataForTable (affects table/summaries only)
  const sortedDataForTable = React.useMemo(() => {
    let arr = [...chartSeries]
    if (sortOrder === 'asc') arr.sort((a, b) => a.customer - b.customer)
    else if (sortOrder === 'desc') arr.sort((a, b) => b.customer - a.customer)
    return arr
  }, [chartSeries, sortOrder])

  // total sums the filtered chartSeries values
  const total = React.useMemo(
    () => chartSeries.reduce((acc, curr) => acc + curr.customer, 0),
    [chartSeries]
  )

  // Detect "empty" period: all points are zero
  const isEmptyPeriod = React.useMemo(() => {
    return chartSeries.length > 0 && chartSeries.every(pt => (pt.customer ?? 0) === 0)
  }, [chartSeries])

  const initialLoadingNoData = isLoading && sales.length === 0
  const isUpdating = isValidating && sales.length > 0

  // Add debugging logs
  React.useEffect(() => {
    if (range?.from && range?.to) {
      const fromIso = manilaDayStartUTCiso(range.from)
      const toIso = manilaNextDayStartUTCiso(range.to)
      
      console.log('🔍 DEBUGGING SALES CHART:')
      console.log('Selected range:', {
        from: range.from.toISOString(),
        to: range.to.toISOString()
      })
      console.log('Converted to Manila UTC:', {
        fromIso,
        toIso
      })
      console.log('Sales URL:', salesUrl)
      console.log('Raw sales data count:', sales.length)
      console.log('Raw sales data sample:', sales.slice(0, 3))
      
      // Check what type of data we have
      const dataType = sales.length > 0 && 'sale_date' in sales[0] ? 'aggregated' : 'individual'
      console.log('Data type:', dataType)
      
      if (dataType === 'aggregated') {
        console.log('✅ Using aggregated data!')
      } else {
        console.log('❌ Still using individual sales data - backend not working!')
      }
      
      // Check the grouped data
      console.log('Grouped by date map:', Object.fromEntries(groupedByDateMap))
      
      // Check the chart series
      console.log('Chart series length:', chartSeries.length)
      console.log('Chart series sample:', chartSeries.slice(0, 5))
    }
  }, [range, sales, salesUrl, groupedByDateMap, chartSeries])

  if (error && !sales.length) return <div>Error loading sales data.</div>

  return (
    <Card className='@container/card w-full'>
      <CardHeader className='flex flex-col border-b @md/card:grid'>
        <CardTitle>Sales Chart</CardTitle>
        <CardDescription>Filter total sales by date range</CardDescription>
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
        {/* Chart area: keep size fixed h-89 */}
        <div className="relative h-89 w-full">
          {/* Initial full-screen skeleton when first load and no previous data */}
          {initialLoadingNoData && (
            <div className="absolute inset-0 flex items-end px-4">
              <div className="flex w-full h-full items-end gap-3">
                {Array.from({ length: Math.max(6, chartSeries.length || 6) }).map((_, i) => {
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
          )}

          {/* If selected period has no sales (all zeros), show centered muted message */}
          {!initialLoadingNoData && isEmptyPeriod && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-sm text-gray-500">
                No sales found for the selected period
              </div>
            </div>
          )}

          {/* Chart (render when not initial-loading and not empty-period). Keeps previous data during revalidation. */}
          {!initialLoadingNoData && !isEmptyPeriod && (
            <div className="absolute inset-0 w-full h-full">
              <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
                <LineChart
                  accessibilityLayer
                  data={chartDisplayData} // <-- use sorted/normal display data
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
                        month: 'short', // or 'long' if you want full month
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

          {/* Overlay skeleton when revalidating (keeps previous chart visible underneath) */}
          {!initialLoadingNoData && isUpdating && !isEmptyPeriod && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-end px-4 pointer-events-none transition-opacity duration-300 ease-in-out z-20"
            >
              <div className="flex w-full h-full items-end gap-3">
                {Array.from({ length: Math.max(6, chartSeries.length || 6) }).map((_, i) => {
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
          )}
        </div>
      </CardContent>

      <CardFooter className='border-t'>
        <div className='text-sm'>
          You had <span className='font-semibold'>₱ {total.toLocaleString()}</span> total sales for the selected period.
        </div>
      </CardFooter>
    </Card>
  )
}