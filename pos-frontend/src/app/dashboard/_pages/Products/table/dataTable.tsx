"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table"
import { useState, useEffect, useRef } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  page: number
  pageSize: number
  onFilteredCountChange?: (count: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pageSize,
  onFilteredCountChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    // control pagination externally so react-table doesn't try to reset pageIndex internally
    state: { sorting, pagination: { pageIndex: page } as any },
    onSortingChange: setSorting,
    // provide a no-op to avoid internal pagination updates causing setState loops
    onPaginationChange: (() => {}) as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Notify parent of filtered/sorted row count (deferred to avoid sync updates)
  const prevCountRef = useRef<number | null>(null)
  const notifyTimerRef = useRef<number | null>(null)
  const rowCount = table.getRowModel().rows.length

  useEffect(() => {
    if (!onFilteredCountChange) return
    if (prevCountRef.current !== rowCount) {
      prevCountRef.current = rowCount

      // clear any pending timer first
      if (notifyTimerRef.current !== null) {
        clearTimeout(notifyTimerRef.current)
        notifyTimerRef.current = null
      }

      // defer the callback to avoid triggering synchronous parent state updates
      notifyTimerRef.current = window.setTimeout(() => {
        onFilteredCountChange(rowCount)
        notifyTimerRef.current = null
      }, 0)

      return () => {
        if (notifyTimerRef.current !== null) {
          clearTimeout(notifyTimerRef.current)
          notifyTimerRef.current = null
        }
      }
    }
    // only re-run when the numeric row count or callback changes
  }, [rowCount, onFilteredCountChange])

  // Paginate the sorted/filtered rows
  const rows = table.getRowModel().rows
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paginatedRows.length ? (
            paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}