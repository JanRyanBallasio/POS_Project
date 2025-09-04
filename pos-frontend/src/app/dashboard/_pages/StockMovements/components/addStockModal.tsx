'use client'
import { useState, useEffect } from "react";
import { ChevronLeft as ChevronLeftIcon, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { useSWRConfig } from 'swr'
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import AddProductModal from "./addProductModal";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'

type ProductItem = { id: string; productId?: string | number | null; name: string; qty: number; unitPrice: number };
type StockPayload = { company: string; date: string; price: number; products: ProductItem[] };
type Props = { onSave?: (payload: StockPayload) => void };

export default function AddStockModal({ onSave }: Props) {
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState<Date | undefined>(new Date());
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ name: string; qty: number; unitPrice: number }>;
            if (ce?.detail) {
                handleAddProduct(ce.detail)
            }
        }
        window.addEventListener('stock:addProduct', handler as EventListener)
        return () => window.removeEventListener('stock:addProduct', handler as EventListener)
    }, [])

    const [company, setCompany] = useState("");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [price, setPrice] = useState<number | "">("");
    const [products, setProducts] = useState<ProductItem[]>([])
    const [saving, setSaving] = useState(false);
    const { mutate } = useSWRConfig()

    const handleSave = async () => {
        if (!company || products.length === 0) {
            // minimal validation
            alert('Company and at least one product are required.')
            return
        }

        const payload = {
            company_name: company,
            date: date ? date.toISOString() : new Date().toISOString(),
            total: Number(price) || 0,
            items: products.map(p => ({
                product_id: p.productId ?? null,
                purchased_price: p.unitPrice ?? (Number(price) || 0),
                quantity: p.qty
            }))
        }

        try {
            setSaving(true)
            const endpoint = `/stock-transactions`;
            const res = await axios.post(endpoint, payload);
            const json = res.data;
            if (res.status >= 400) throw new Error(json?.message || json?.error || 'Save failed')

            // notify parent if needed
            onSave?.({
                company,
                date: date ? date.toISOString() : new Date().toISOString(),
                price: Number(price) || 0,
                products,
            })

            // revalidate stock transactions SWR cache
            mutate(endpoint)

            // reset and close
            setCompany("")
            setDate(undefined)
            setPrice("")
            setProducts([])
            setOpen(false)
        } catch (err: any) {
            console.error('save stock error', err)
            alert(`Save failed: ${err?.message ?? err}`)
        } finally {
            setSaving(false)
        }
    };

    // Merge same product by name: increase qty and update unitPrice to the newly provided one
    const handleAddProduct = (p: { name: string; qty: number; unitPrice: number; productId?: string | number | null }) => {
        setProducts(prev => {
            // prefer matching by productId when available, otherwise fallback to name
            const idx = prev.findIndex(x => (p.productId != null ? x.productId === p.productId : x.name === p.name))
            if (idx !== -1) {
                const updated = [...prev]
                updated[idx] = {
                    ...updated[idx],
                    qty: updated[idx].qty + p.qty,
                    unitPrice: p.unitPrice,
                    productId: updated[idx].productId ?? p.productId
                }
                return updated
            }
            return [
                ...prev,
                { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, productId: p.productId ?? null, name: p.name, qty: p.qty, unitPrice: p.unitPrice }
            ]
        })
    };

    const handleRemoveProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    // Update a product field (qty or unitPrice)
    const updateProductField = (id: string, field: 'qty' | 'unitPrice', value: string | number) => {
        setProducts(prev =>
            prev.map(p => {
                if (p.id !== id) return p
                const parsed = field === 'qty' ? Math.max(0, Math.floor(Number(value) || 0)) : Math.max(0, Number(value) || 0)
                return { ...p, [field]: parsed }
            })
        )
    }

    const total = products.reduce((sum, p) => sum + p.qty * p.unitPrice, 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-full flex items-center gap-2">
                    <Plus size={16} />
                    Add Stocks
                </Button>
            </DialogTrigger>

            <DialogContent className=" flex h-[calc(80vh-2rem)] min-w-[calc(80vw-2rem)] flex-col justify-between gap-0 p-0">
                <ScrollArea className="flex-1 overflow-hidden">
                    <DialogHeader className="contents space-y-0 text-left">
                        <DialogTitle className="px-6 pt-6">Add Stock</DialogTitle>
                        <DialogDescription asChild>
                            <div className="pt-2 px-6">
                                <p className="text-sm text-muted-foreground">Enter stock details and add products.</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pt-2">
                        <div className="flex w-full gap-6">
                            {/* Left column - basic info */}
                            <div className="flex-[40%] ">
                                <div className="mt-2">
                                    <label className="text-sm block mb-1">Company</label>
                                    <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
                                </div>

                                <div className="mt-2">
                                    <label className="text-sm block mb-1">Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-10 justify-between text-left px-3"
                                                type="button"
                                                aria-label="Choose date"
                                            >
                                                <span className="truncate">
                                                    {date ? date.toLocaleDateString() : 'mm/dd/yyyy'}
                                                </span>
                                                <CalendarIcon className="ml-2 opacity-70" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-auto p-2">
                                            <Card className="w-[290px]">
                                                <CardHeader className="flex items-start gap-2">
                                                    <div>
                                                        <CardDescription className="text-xs text-muted-foreground">
                                                            <CardTitle className="text-sm">Choose date</CardTitle>
                                                            Select a date for this stock entry
                                                        </CardDescription>
                                                    </div>
                                                    <CardAction>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const now = new Date()
                                                                setMonth(now)
                                                                setDate(now)
                                                            }}
                                                        >
                                                            Today
                                                        </Button>
                                                    </CardAction>
                                                </CardHeader>
                                                <CardContent className="p-2">
                                                    <Calendar
                                                        mode="single"
                                                        month={month}
                                                        onMonthChange={setMonth}
                                                        selected={date}
                                                        onSelect={setDate}
                                                        className="bg-transparent p-0 rounded-md"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="mt-2">
                                    <label className="text-sm block mb-1">Price</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={price === "" ? "" : String(price)}
                                        onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Right column - products */}
                            <div className="flex flex-col h-full flex-[60%]">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium">Products</h3>
                                    <AddProductModal onAdd={handleAddProduct} />
                                </div>

                                <div className='[&>div]:max-h-[400px] [&>div]:rounded-sm [&>div]:border'>
                                    <div className="overflow-x-auto">
                                        <Table className="table-fixed w-full">
                                            <TableHeader>
                                                <TableRow className="bg-background sticky top-0">
                                                    <TableHead className="w-[35%]">Product</TableHead>
                                                    <TableHead className="w-[10%] text-center">Quantity</TableHead>
                                                    <TableHead className="w-[10%] text-center">Unit Price</TableHead>

                                                    <TableHead className="w-[8%]" />
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {products.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4}>
                                                            <div className="w-full h-24 flex items-center justify-center text-sm text-muted-foreground">
                                                                No products added.
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    products.map(p => (
                                                        <TableRow key={p.id}>
                                                            {/* Product column: prevent flex expansion and allow wrapping */}
                                                            <TableCell className="min-w-0 break-words whitespace-normal pr-4">
                                                                <div className="font-medium">{p.name}</div>
                                                            </TableCell>

                                                            {/* Quantity: compact centered input so it won't push layout */}
                                                            <TableCell className="text-center align-middle">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={String(p.qty)}
                                                                    onChange={(e) => updateProductField(p.id, 'qty', e.target.value)}
                                                                    onBlur={(e) => updateProductField(p.id, 'qty', e.target.value)}
                                                                    className="focus-visible:ring-ring h-8 w-20 border-0 bg-transparent p-1 text-center focus-visible:ring-1 mx-auto"
                                                                    aria-label={`qty-${p.id}`}
                                                                />
                                                            </TableCell>

                                                            {/* Unit Price: compact centered input */}
                                                            <TableCell className="text-center align-middle">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min={0}
                                                                    value={String(p.unitPrice)}
                                                                    onChange={(e) => updateProductField(p.id, 'unitPrice', e.target.value)}
                                                                    onBlur={(e) => updateProductField(p.id, 'unitPrice', e.target.value)}
                                                                    className="focus-visible:ring-ring h-8 w-24 border-0 bg-transparent p-1 text-center focus-visible:ring-1 mx-auto"
                                                                    aria-label={`unit-${p.id}`}
                                                                />
                                                            </TableCell>

                                                            {/* Delete button in small column */}
                                                            <TableCell className="text-center align-middle">
                                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(p.id)} aria-label="Remove product">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>

                                        </Table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 pb-6 sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                            <ChevronLeftIcon />
                            Back
                        </Button>
                    </DialogClose>

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}