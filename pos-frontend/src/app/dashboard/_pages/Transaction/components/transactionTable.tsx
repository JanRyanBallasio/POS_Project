import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye, Printer } from 'lucide-react'
import { useSales } from '@/hooks/global/fetching/useSales'
import ViewTransactionModal from './viewTransactionModal'
import { useState } from 'react'
import axios from '@/lib/axios'
import { usePrint } from '@/hooks/printing/usePrint'



export default function TransactionTable() {
    const { sales, loading } = useSales();
    const [viewSaleId, setViewSaleId] = useState<number | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const { printReceipt } = usePrint();
    const [printingId, setPrintingId] = useState<number | null>(null);

    const handlePrint = async (saleId: number) => {
        if (printingId !== null) return;
        try {
            setPrintingId(saleId);

            const res = await axios.get(`/sales/${saleId}`);
            const payload = res?.data?.data;
            if (!payload || !payload.items || !payload.sale) {
                throw new Error('Invalid sale details returned');
            }

            const items = (payload.items as Array<{
                name: string;
                quantity: number;
                price: number;
                total: number;
            }>).map(it => ({
                desc: it.name,
                qty: Number(it.quantity || 0),
                price: Number(it.price || 0),
                amount: Number(it.total || 0),
            }));

            await printReceipt({
                store: { name: "YZY STORE", address1: "Eastern Slide, Tuding" },
                customer: payload.sale.customer || { name: "N/A" },
                cartTotal: Number(payload.sale.total_purchase || 0),
                amount: Number(payload.sale.total_purchase || 0),
                change: 0,
                points: 0,
                items,
                printerName: null,
            });

            alert('Printed successfully');
        } catch (e: any) {
            alert(e?.message || String(e));
        } finally {
            setPrintingId(null);
        }
    };

    return (
        <div className='w-full h-full'>
            <div className='rounded-md border h-full overflow-auto'>
                <Table className='table-fixed w-full'>
                    <TableHeader>
                        <TableRow className='bg-background sticky top-0'>
                            <TableHead className='w-1/3 text-left'>Date</TableHead>
                            <TableHead className='w-1/3 text-center'>Customer</TableHead>
                            <TableHead className='w-1/3 text-center'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell className='text-left'>Loading...</TableCell>
                                <TableCell className='text-center'>—</TableCell>
                                <TableCell className='text-center'>—</TableCell>
                            </TableRow>
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell className='text-left'>No data</TableCell>
                                <TableCell className='text-center'>—</TableCell>
                                <TableCell className='text-center'>—</TableCell>
                            </TableRow>
                        ) : (
                            sales.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className='text-left'>
                                        {new Date(s.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className='text-center truncate' title={s.customer?.name || 'N/A'}>
                                        {s.customer?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className='text-center'>
                                        <div className='flex items-center justify-center gap-2'>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              title='View'
                                              onClick={() => { setViewSaleId(s.id); setViewOpen(true); }}
                                            >
                                                <Eye className='h-4 w-4' />
                                                <span className='sr-only'>View</span>
                                            </Button>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              title='Print'
                                              onClick={() => handlePrint(s.id)}
                                              disabled={printingId === s.id}
                                            >
                                                <Printer className='h-4 w-4' />
                                                <span className='sr-only'>Print</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <ViewTransactionModal
              open={viewOpen}
              saleId={viewSaleId}
              onClose={() => setViewOpen(false)}
            />
        </div>
    )
}