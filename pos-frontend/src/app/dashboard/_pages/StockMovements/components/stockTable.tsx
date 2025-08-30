// ...existing code...
'use client'

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

/* ------------------ NEW IMPORTS ------------------ */
import { Eye, ChevronLeft as ChevronLeftIcon } from 'lucide-react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import React from 'react'
/* ------------------------------------------------- */


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
    },

    {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            const company = String(row.getValue('company_name') ?? '')
            const rawDate = String(row.getValue('date') ?? '')
            const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : ''
            const total = parseFloat(String(row.getValue('total') ?? 0))
            const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)

            // transaction id from original row
            const txId = (row.original as any)?.id

            const TransactionDetailsDialog: React.FC<{ id: number | string }> = ({ id }) => {
                const [open, setOpen] = React.useState(false)
                const [items, setItems] = React.useState<any[] | null>(null)
                const [loadingItems, setLoadingItems] = React.useState(false)
                const [loadError, setLoadError] = React.useState<string | null>(null)

                React.useEffect(() => {
                    if (!open) return
                    let mounted = true
                    const load = async () => {
                        setLoadingItems(true)
                        setLoadError(null)
                        try {
                            const base = process.env.NEXT_PUBLIC_backend_api_url ?? ''
                            const endpoint = `${base}/stock-transactions/${id}`
                            const res = await fetch(endpoint)
                            const json = await res.json()
                            if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to load')
                            // backend now returns items with joined product object and product_name normalization
                            const fetched = json?.items ?? json?.data?.items ?? []
                            if (mounted) setItems(Array.isArray(fetched) ? fetched : [])
                        } catch (err: any) {
                            console.error('load transaction items error', err)
                            if (mounted) setLoadError(err?.message ?? String(err))
                        } finally {
                            if (mounted) setLoadingItems(false)
                        }
                    }
                    load()
                    return () => { mounted = false }
                }, [open, id])

                // fallback to original row items if remote not available yet
                const origItems = (row.original as any)?.items ?? (row.original as any)?.products ?? []
                const shownItems = items ?? (Array.isArray(origItems) ? origItems : [])

                return (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="View details">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="flex max-h-[min(640px,84vh)] flex-col gap-0 p-0 sm:max-w-lg">
                            <DialogHeader className="contents space-y-0 text-left">
                                <ScrollArea className="flex max-h-full flex-col overflow-hidden">
                                    <DialogTitle className="px-6 pt-6 text-lg md:text-xl font-semibold text-foreground">Transaction Details</DialogTitle>
                                    <DialogDescription asChild>
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-sm text-muted-foreground">Company:</span>
                                                        <span className="text-base font-medium text-foreground">{company}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-sm text-muted-foreground">Date:</span>
                                                        <span className="text-sm text-foreground">{formattedDate}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-sm text-muted-foreground">Total:</span>
                                                        <span className="text-base font-semibold text-foreground">{formattedTotal}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <h4 className="text-sm font-medium text-muted-foreground">Products</h4>

                                                    {loadingItems ? (
                                                        <div className="text-sm text-muted-foreground mt-3">Loading products…</div>
                                                    ) : loadError ? (
                                                        <div className="text-sm text-destructive mt-3">Failed to load products: {loadError}</div>
                                                    ) : !shownItems || shownItems.length === 0 ? (
                                                        <div className="text-sm text-muted-foreground mt-3">No products available for this transaction.</div>
                                                    ) : (
                                                        <div className="mt-3 overflow-auto rounded-sm border">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="bg-muted/5">
                                                                        <th className="px-4 py-3 text-left text-xs text-muted-foreground">Product</th>
                                                                        <th className="px-4 py-3 text-right text-xs text-muted-foreground">Qty</th>
                                                                        <th className="px-4 py-3 text-right text-xs text-muted-foreground">Unit</th>
                                                                        <th className="px-4 py-3 text-right text-xs text-muted-foreground">Subtotal</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {shownItems.map((it: any, i: number) => {
                                                                        const name =
                                                                            it.product?.name ??
                                                                            it.product_name ??
                                                                            it.name ??
                                                                            (it.product_id ? `#${it.product_id}` : `Item ${i + 1}`)
                                                                        const qty = Number(it.quantity ?? it.qty ?? 0)
                                                                        const unit = Number(it.purchased_price ?? it.unit_price ?? it.price ?? 0)
                                                                        const subtotal = qty * unit
                                                                        const formattedUnit = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(unit)
                                                                        const formattedSubtotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)

                                                                        return (
                                                                            <tr key={i} className="border-t last:border-b">
                                                                                <td className="px-4 py-3 align-top text-sm text-foreground max-w-[260px] break-words whitespace-normal">{name}</td>
                                                                                <td className="px-4 py-3 align-top text-sm text-right text-foreground">{qty}</td>
                                                                                <td className="px-4 py-3 align-top text-sm text-right text-foreground">{formattedUnit}</td>
                                                                                <td className="px-4 py-3 align-top text-sm text-right font-medium text-foreground">{formattedSubtotal}</td>
                                                                            </tr>
                                                                        )
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DialogDescription>
                                </ScrollArea>
                            </DialogHeader>

                            <DialogFooter className="flex-row items-center justify-end border-t px-6 py-4">
                                <DialogClose asChild>
                                    <Button variant="outline" size="sm">
                                        <ChevronLeftIcon />
                                        Back
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )
            }

            return (
                <div className="flex justify-end">
                    <TransactionDetailsDialog id={txId} />
                </div>
            )
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
// ...existing