// ...existing code...
'use client'

import { useState } from 'react'
import axios from "@/lib/axios";
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
        header: 'Supplier / Company',
        cell: ({ row }) => <div className='font-semibold text-base'>{row.getValue('company_name')}</div>
    },
    {
        accessorKey: 'date',
        header: 'Purchase Date',
        cell: ({ row }) => {
            const raw = row.getValue('date') as string
            const formatted = raw ? new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
            return <div className='text-sm text-muted-foreground'>{formatted}</div>
        }
    },
    {
        accessorKey: 'total',
        header: () => <div className='text-right'>Total Amount</div>,
        cell: ({ row }) => {
            const price = parseFloat(String(row.getValue('total') ?? 0))
            const formatted = `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            return <div className='text-right font-semibold text-base'>{formatted}</div>
        }
    },

    {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            const company = String(row.getValue('company_name') ?? '')
            const rawDate = String(row.getValue('date') ?? '')
            const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
            const total = parseFloat(String(row.getValue('total') ?? 0))
            const formattedTotal = `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
                            const endpoint = `/stock-transactions/${id}`;
                            const res = await axios.get(endpoint);
                            const json = res.data;
                            if (res.status >= 400) throw new Error(json?.message || json?.error || 'Failed to load')
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
                            <Button variant="ghost" size="sm" aria-label="View details" className="hover:bg-primary/10">
                                <Eye className="h-4 w-4 mr-2" />
                                <span className="text-sm">View Details</span>
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="flex max-h-[min(720px,90vh)] flex-col gap-0 p-0 sm:max-w-2xl">
                            <DialogHeader className="contents space-y-0 text-left">
                                <ScrollArea className="flex max-h-full flex-col overflow-hidden">
                                    <DialogTitle className="px-8 pt-8 pb-6 text-2xl font-semibold text-foreground border-b">Purchase Details</DialogTitle>
                                    <DialogDescription asChild>
                                        <div className="p-8">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Supplier</span>
                                                        <div className="text-base font-semibold text-foreground">{company}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Purchase Date</span>
                                                        <div className="text-sm text-foreground">{formattedDate}</div>
                                                    </div>
                                                    <div className="col-span-2 space-y-1 pt-2 border-t">
                                                        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Amount</span>
                                                        <div className="text-2xl font-bold text-primary">{formattedTotal}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-base font-semibold mb-3">Products Purchased</h4>

                                                    {loadingItems ? (
                                                        <div className="text-sm text-muted-foreground text-center py-8">Loading products…</div>
                                                    ) : loadError ? (
                                                        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">Failed to load products: {loadError}</div>
                                                    ) : !shownItems || shownItems.length === 0 ? (
                                                        <div className="text-sm text-muted-foreground text-center py-8">No products available for this transaction.</div>
                                                    ) : (
                                                        <div className="overflow-auto rounded-lg border">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="bg-muted/50 border-b">
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Name</th>
                                                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                                                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit Price</th>
                                                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtotal</th>
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
                                                                        const formattedUnit = `₱${unit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                        const formattedSubtotal = `₱${subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

                                                                        return (
                                                                            <tr key={i} className="border-b last:border-b-0 hover:bg-muted/20">
                                                                                <td className="px-4 py-4 align-top text-sm font-medium text-foreground max-w-[260px] break-words whitespace-normal">{name}</td>
                                                                                <td className="px-4 py-4 align-top text-sm text-right text-foreground">{qty}</td>
                                                                                <td className="px-4 py-4 align-top text-sm text-right text-foreground">{formattedUnit}</td>
                                                                                <td className="px-4 py-4 align-top text-sm text-right font-semibold text-foreground">{formattedSubtotal}</td>
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

                            <DialogFooter className="flex-row items-center justify-end border-t px-8 py-5 bg-muted/20">
                                <DialogClose asChild>
                                    <Button variant="outline" className="h-11 px-6">
                                        <ChevronLeftIcon className="mr-2 h-5 w-5" />
                                        Close
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
            <div className='flex justify-between gap-4 pb-6 max-sm:flex-col sm:items-center'>
                <div className='flex items-center space-x-2'>
                    <Input
                        placeholder='Search purchases...'
                        value={globalFilter ?? ''}
                        onChange={event => setGlobalFilter(String(event.target.value))}
                        className='max-w-sm h-11 text-base'
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
            <div className='rounded-lg border shadow-sm overflow-hidden'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id} className="h-12 font-semibold">
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
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-muted/30">
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id} className="py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-32 text-center'>
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <p className="text-base">No purchases found.</p>
                                        <p className="text-sm mt-1">Add a new purchase to get started.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default StockMovementTable// ...existing
