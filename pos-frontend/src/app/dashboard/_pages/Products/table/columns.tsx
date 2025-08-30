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
        <div
          className="flex-1 flex flex-col items-start font-medium break-words whitespace-normal leading-tight"
          title={String(row.getValue("productName"))}
          style={{ wordBreak: "break-word", whiteSpace: "normal" }}
        >
          {row.getValue("productName")}
        </div>
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
    cell: ({ row }) => <div className="flex items-center font-medium">{row.getValue("currentStock")}</div>,
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
      const cfg = statusConfig[status];
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      return (
        <Badge variant={cfg.variant} className={cfg.className}>
          {label}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Actions</div>,
    // leave actions cell empty here — table parent can provide the real handlers to avoid duplicate button code and reduce bundle
    cell: () => <div className="flex gap-5 justify-center" aria-hidden />,
    enableSorting: false,
    enableHiding: false,
  },
];
//