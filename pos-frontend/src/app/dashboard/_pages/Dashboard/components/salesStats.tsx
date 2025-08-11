'use client'

import * as React from 'react'
import useSWR from 'swr'
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

type Sale = {
  created_at: string
  total_purchase: number
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
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

export default function ProductStats() {
  const API_URL = process.env.NEXT_PUBLIC_backend_api_url
  const { data: sales = [], error, isLoading } = useSWR<Sale[]>(
    `${API_URL}/sales`,
    fetcher
  )
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  })
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | 'normal'>('normal')

  const isSameOrAfter = (a: Date, b: Date) =>
    a.setHours(0, 0, 0, 0) >= b.setHours(0, 0, 0, 0)
  const isSameOrBefore = (a: Date, b: Date) =>
    a.setHours(0, 0, 0, 0) <= b.setHours(0, 0, 0, 0)

  const chartData = React.useMemo(() => {
    const grouped: { [date: string]: number } = {}
    sales.forEach(sale => {
      const date = sale.created_at.slice(0, 10)
      grouped[date] = (grouped[date] || 0) + (sale.total_purchase ?? 0)
    })
    return Object.entries(grouped).map(([date, total]) => ({
      date,
      customer: total
    }))
  }, [sales])

  const filteredData = React.useMemo(() => {
    if (!range?.from && !range?.to) return chartData
    return chartData.filter(item => {
      const date = new Date(item.date)
      return (
        (!range.from || isSameOrAfter(date, range.from)) &&
        (!range.to || isSameOrBefore(date, range.to))
      )
    })
  }, [range, chartData])

  const sortedData = React.useMemo(() => {
    let arr = [...filteredData]
    if (sortOrder === 'asc') arr.sort((a, b) => a.customer - b.customer)
    else if (sortOrder === 'desc') arr.sort((a, b) => b.customer - a.customer)
    return arr
  }, [filteredData, sortOrder])

  const total = React.useMemo(
    () => sortedData.reduce((acc, curr) => acc + curr.customer, 0),
    [sortedData]
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading sales data.</div>

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
        <ChartContainer config={chartConfig} className='aspect-auto h-89 w-full'>
          <LineChart
            accessibilityLayer
            data={sortedData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={value => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { day: 'numeric' })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='customer'
                  labelFormatter={value =>
                    new Date(value).toLocaleDateString('en-US', {
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
      </CardContent>
      <CardFooter className='border-t'>
        <div className='text-sm'>
          You had <span className='font-semibold'>₱ {total.toLocaleString()}</span> total sales for the selected period.
        </div>
      </CardFooter>
    </Card>
  )
}