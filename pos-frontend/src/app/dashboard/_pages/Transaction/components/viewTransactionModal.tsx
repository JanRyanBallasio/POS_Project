'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

type Item = {
  product_id: number | null;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
};

type SaleDetails = {
  sale: {
    id: number;
    created_at: string;
    total_purchase: number;
    customer_id: number | null;
    customer: { id: number | null; name: string | null };
  };
  items: Item[];
};

export default function ViewTransactionModal({
  open,
  saleId,
  onClose,
}: {
  open: boolean;
  saleId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<SaleDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open || !saleId) return;
      setLoading(true);
      try {
        const res = await axios.get(`/sales/${saleId}`);
        const payload = res.data?.data || null;
        if (mounted) setData(payload);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [open, saleId]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6">Loading...</div>
        ) : !data ? (
          <div className="py-6">No data</div>
        ) : (
          <>
            <div className="mb-4 text-sm">
              <div>Date: {new Date(data.sale.created_at).toLocaleString()}</div>
              <div>Customer: {data.sale.customer?.name || 'N/A'}</div>
              <div>Total: ₱{data.sale.total_purchase.toFixed(2)}</div>
            </div>

            <div className="rounded-md border">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((it, idx) => (
                    <TableRow key={`${it.product_id}-${idx}`}>
                      <TableCell className="truncate" title={it.name}>{it.name}</TableCell>
                      <TableCell className="text-center">{it.quantity} {it.unit}</TableCell>
                      <TableCell className="text-right">₱{it.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₱{it.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}