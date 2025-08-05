'use client'

import { useState, useMemo } from 'react'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { ChevronDown, ChevronUp, List } from 'lucide-react';

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
import { useSaleItems } from "@/hooks/global/fetching/useSaleItems";
import { useProducts } from "@/hooks/global/fetching/useProducts";

type ChartData = {
  product: string
  quantity: number
}

const chartConfig: ChartConfig = {
  quantity: {
    label: 'Quantity Sold',
    color: 'var(--color-primary)'
  }
}

export default function ProductStats() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'normal'>('desc');

  const { saleItems, loading, error } = useSaleItems();
  const { products } = useProducts();

  // Map product_id to product name for display
  const productMap = useMemo(() => {
    const map: Record<number, string> = {};
    products.forEach(p => {
      map[p.id] = p.name;
    });
    return map;
  }, [products]);
  const isSameOrAfter = (a: Date, b: Date) =>
    a.setHours(0, 0, 0, 0) >= b.setHours(0, 0, 0, 0);
  const isSameOrBefore = (a: Date, b: Date) =>
    a.setHours(0, 0, 0, 0) <= b.setHours(0, 0, 0, 0);
  // Transform sale items data: group by product, sum quantity sold
  const chartData = useMemo(() => {
    const grouped: { [product_id: number]: number } = {};
    saleItems.forEach(item => {
      const date = new Date(item.created_at);
      if (
        (!range?.from || isSameOrAfter(date, range.from)) &&
        (!range?.to || isSameOrBefore(date, range.to))
      ) {
        grouped[item.product_id] = (grouped[item.product_id] || 0) + item.quantity;
      }
    });
    let arr = Object.entries(grouped)
      .map(([product_id, quantity]) => ({
        product: productMap[Number(product_id)] || `Product ${product_id}`,
        quantity
      }));
    if (sortOrder === 'asc') {
      arr = arr.sort((a, b) => a.quantity - b.quantity);
    } else if (sortOrder === 'desc') {
      arr = arr.sort((a, b) => b.quantity - a.quantity);
    }
    // 'normal' leaves the original order
    return arr;
  }, [saleItems, range, productMap, sortOrder]);

  const total = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.quantity, 0),
    [chartData]
  );

  return (
    <Card className='@container/card w-full'>
      <CardHeader className='flex flex-col border-b @md/card:grid'>
        <CardTitle>Product Analytics</CardTitle>
        <CardDescription>Showing most sold products for this month.</CardDescription>
        <CardAction className='mt-2 @md/card:mt-0'>
          <div className="flex gap-2 items-center mt-2">
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
              aria-label="Sort Descending"
            >
              <ChevronDown className="mr-1" size={16} /> Desc
            </Button>
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
              aria-label="Sort Ascending"
            >
              <ChevronUp className="mr-1" size={16} /> Asc
            </Button>
            <Button
              variant={sortOrder === 'normal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('normal')}
              aria-label="Follow Order"
            >
              <List className="mr-1" size={16} /> Follow Order
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
                    after: today // disables future dates
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
              dataKey='product'
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