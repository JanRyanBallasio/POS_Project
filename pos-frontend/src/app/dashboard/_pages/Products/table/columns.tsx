"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type Products = {
  id: string
  productName: string
  barcode: string
  category: string
  currentStock: number
  productPrice: number
  status: "out of stock" | "low stock" | "in stock"
}

export const columns: ColumnDef<Products>[] = [
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 font-medium focus:outline-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center font-medium">
        {row.getValue("productName")}
      </div>
    ),
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 font-medium focus:outline-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Current Stock
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center font-medium">
        {row.getValue("currentStock")}
      </div>
    ),
  },
  {
    accessorKey: "productPrice",
    header: "Price",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "outline" | "secondary" | "destructive" = "default";
      if (status === "out of stock") variant = "destructive";
      else if (status === "low stock") variant = "secondary";
      else if (status === "in stock") variant = "default";
      return (
        <Badge
          variant={variant}
          className={
            status === "in stock"
              ? "bg-green-300 text-black"
              : status === "low stock"
                ? "bg-yellow-500 text-black"
                : status === "out of stock"
                  ? "bg-red-500 text-white"
                  : ""
          }
        >
          {status.replace(/^\w/, c => c.toUpperCase())}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Actions</div>,
    cell: () => (
      <div className="flex gap-5 justify-center">
        <Button variant="outline" size="icon">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]