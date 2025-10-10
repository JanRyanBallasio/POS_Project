"use client"

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type Products = {
  id: string;
  productName: string;
  barcode: string;
  category: string;
  currentStock: number;
  productPrice: number;
  status: "out of stock" | "low stock" | "in stock";
  original?: any;
};

const statusConfig: Record<
  Products["status"],
  { variant: "default" | "outline" | "secondary" | "destructive"; className: string }
> = {
  "in stock": { variant: "default", className: "bg-green-300 text-black" },
  "low stock": { variant: "secondary", className: "bg-yellow-500 text-black" },
  "out of stock": { variant: "destructive", className: "bg-red-500 text-white" },
};

export const columns: ColumnDef<Products>[] = [
  // Mobile Card Column - Shows on small screens (lg and below)
  {
    id: "mobileCard",
    header: () => null,
    cell: () => null, // Will be overridden in ProductTable
    meta: {
      headerClassName: "lg:hidden",
      cellClassName: "lg:hidden",
    },
  },
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
      <div className="flex w-full">
        <div className="flex-1 font-medium break-words whitespace-normal leading-tight">
          {row.getValue("productName")}
        </div>
      </div>
    ),
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ row }) => (
      <div className="font-mono">{String(row.getValue("barcode") || "—")}</div>
    ),
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("currentStock")}</div>,
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "productPrice",
    header: "Price",
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
  // New computed column: Total = currentStock * productPrice
  {
    // New computed column: Total = currentStock * productPrice
    id: "total",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 font-medium focus:outline-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </button>
    ),
    accessorFn: (row) => Number(row.currentStock || 0) * Number(row.productPrice || 0),
    cell: ({ row }) => {
      const total = Number(row.getValue("total") || 0);
      return <div className="font-medium">₱{total.toLocaleString()}</div>;
    },
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const cfg = statusConfig[status];
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      return <Badge variant={cfg.variant} className={cfg.className}>{label}</Badge>;
    },
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Actions</div>,
    cell: () => <div className="flex gap-5 justify-center" aria-hidden />,
    enableSorting: false,
    enableHiding: false,
    meta: {
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
  },
];