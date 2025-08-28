'use client'

// ...existing code...
import { useState } from 'react'

import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { cn } from '@/lib/utils'
import useStockTransactions, { StockTransaction } from '@/hooks/stocks/useStockTransactions'


export type StockItem = {
    id: string
    company: string
    date: string // ISO date string
    price: number
}

export const columns: ColumnDef<StockTransaction>[] = [
    {
        accessorKey: 'company_name',
        header: 'Company Name',
        cell: ({ row }) => <div className='font-medium'>{row.getValue('company_name')}</div>
    },
    {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => {
            const raw = row.getValue('date') as string
            const formatted = raw ? new Date(raw).toLocaleDateString() : ''
            return <div className='text-sm text-muted-foreground'>{formatted}</div>
        }
    },
    {
        accessorKey: 'total',
        header: () => <div className='text-right'>Total</div>,
        cell: ({ row }) => {
            const price = parseFloat(String(row.getValue('total') ?? 0))
            const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
            return <div className='text-right font-medium'>{formatted}</div>
        }
    }
]

const StockMovementTable = () => {
    const { data, loading, error } = useStockTransactions()
    const rowsData = data ?? []
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')

    const table = useReactTable({
        data: rowsData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter
        }
    })


    return (
        <div className='w-full h-full'>
            <div className='flex justify-between gap-2 pb-4 max-sm:flex-col sm:items-center'>
                <div className='flex items-center space-x-2'>
                    <Input
                        placeholder='Search all columns...'
                        value={globalFilter ?? ''}
                        onChange={event => setGlobalFilter(String(event.target.value))}
                        className='max-w-sm'
                    />
                </div>
                <div className='flex items-center space-x-2'>
                    <div className='text-muted-foreground text-sm'>
                        {table.getSelectedRowModel().rows.length > 0 && (
                            <span className='mr-2'>
                                {table.getSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
                            </span>
                        )}
                        {loading && <span className="ml-2">Loading...</span>}
                        {error && <span className="ml-2 text-destructive">Error: {error}</span>}
                    </div>
                    {/* Refresh button removed since SWR handles revalidation; call mutate() if you want manual refresh */}
                </div>
            </div>
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default StockMovementTable
