"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table"
import { useState, useEffect, useRef, useMemo } from "react"

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

  // create the table instance (react-table hook internally memoizes heavy parts)
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex: page } as any },
    onSortingChange: setSorting,
    // keep pagination control outside of react-table to avoid internal pageIndex churn
    onPaginationChange: (() => {}) as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // derived rows and paginated rows (memoized to avoid extra work on unrelated renders)
  const rows = table.getRowModel().rows
  const paginatedRows = useMemo(
    () => rows.slice(page * pageSize, (page + 1) * pageSize),
    [rows, page, pageSize]
  )

  // notify parent of filtered/sorted count with a deferred callback to avoid sync updates
  const prevCountRef = useRef<number | null>(null)
  const notifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rowCount = rows.length

  useEffect(() => {
    if (!onFilteredCountChange) return

    if (prevCountRef.current !== rowCount) {
      prevCountRef.current = rowCount

      if (notifyTimerRef.current) {
        clearTimeout(notifyTimerRef.current)
        notifyTimerRef.current = null
      }

      // defer notification so parent state updates don't run synchronously here
      notifyTimerRef.current = setTimeout(() => {
        onFilteredCountChange(rowCount)
        notifyTimerRef.current = null
      }, 0)
    }

    return () => {
      if (notifyTimerRef.current) {
        clearTimeout(notifyTimerRef.current)
        notifyTimerRef.current = null
      }
    }
  }, [rowCount, onFilteredCountChange])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {paginatedRows.length > 0 ? (
            paginatedRows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
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
