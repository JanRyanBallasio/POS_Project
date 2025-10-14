'use client'
import { useState, useEffect } from "react";
import { ChevronLeft as ChevronLeftIcon, Plus, X, Calendar as CalendarIcon, Wallet, Package, Hash, BadgeDollarSign, Calculator, Building2, Check, CalendarClock } from "lucide-react";
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
import { useProductModal } from "@/contexts/productRegister-context";

type ProductItem = { id: string; productId?: string | number | null; name: string; qty: number; unitPrice: number };
type StockPayload = { company: string; date: string; price: number; products: ProductItem[] };
type Props = { onSave?: (payload: StockPayload) => void };

export default function AddStockModal({ onSave }: Props) {
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState<Date | undefined>(new Date());
    const [datePopOpen, setDatePopOpen] = useState(false);
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
    const [products, setProducts] = useState<ProductItem[]>([])
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string>("");
    const { mutate } = useSWRConfig()

    const { openModal } = useProductModal();
    const handleSave = async () => {
        // Clear previous validation error
        setValidationError("")

        // Validate
        if (!company.trim()) {
            setValidationError("Company name is required")
            return
        }
        if (products.length === 0) {
            setValidationError("At least one product is required")
            return
        }

        // Calculate total from products
        const calculatedTotal = products.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0)

        const payload = {
            company_name: company,
            date: date ? date.toISOString() : new Date().toISOString(),
            total: calculatedTotal,
            items: products.map(p => ({
                product_id: p.productId ?? null,
                purchased_price: p.unitPrice,
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
                price: calculatedTotal,
                products,
            })

            // revalidate stock transactions SWR cache
            mutate(endpoint)

            // reset and close
            setCompany("")
            setDate(undefined)
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
        setValidationError("") // Clear validation error when adding products
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
    
    // handle date selected from Calendar
    const handleSelectDate = (d: Date | undefined) => {
        setDate(d)
        if (d) setMonth(d)
        setDatePopOpen(false)
    }

    const total = products.reduce((sum, p) => sum + p.qty * p.unitPrice, 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-11 flex items-center gap-2">
                    <Plus size={16} />
                    Add Purchase
                </Button>
            </DialogTrigger>

            {/* Taller modal height (no width change) */}
            <DialogContent className="flex flex-col gap-0 p-0 border-none shadow-xl sm:max-w-[95vw] lg:max-w-[1100px] max-h-[98vh]">
                <ScrollArea className="flex-1 max-h-[96vh]">
                    <div className="flex flex-col">
                        {/* Compact header */}
                        <DialogHeader className="px-6 pt-6 pb-4 space-y-2 border-b bg-muted/20">
                            <DialogTitle className="text-2xl font-bold tracking-tight">Add Purchase</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Enter supplier details and add products to record a new purchase.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-6">
                            <div className="flex flex-col lg:flex-row w-full gap-6">
                                {/* Left column - basic info */}
                                <div className="w-full lg:w-[320px] flex-shrink-0 space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Building2 className="h-4 w-4 opacity-70" />
                                            <span>Supplier / Company</span>
                                        </label>
                                        <Input
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            placeholder="Enter supplier name"
                                            className="h-11 text-sm border-muted-foreground/20 focus-visible:border-primary/50 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {/* Label row with Today quick-select on the right */}
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 opacity-70" />
                                                <span>Purchase Date</span>
                                            </label>
                                            <button
                                                type="button"
                                                aria-label="Set date to today"
                                                className="p-1 rounded-md hover:bg-muted/40"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const now = new Date();
                                                    setDate(now);
                                                    setMonth(now);
                                                    setDatePopOpen(false);
                                                }}
                                            >
                                                <CalendarClock className="opacity-80 h-4 w-4" />
                                            </button>
                                        </div>

                                        <Popover open={datePopOpen} onOpenChange={setDatePopOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-11 justify-between text-left px-3 text-sm border-muted-foreground/20 hover:border-foreground/40 hover:bg-muted/30 transition-all duration-200 rounded-lg"
                                                    type="button"
                                                    aria-label="Choose date"
                                                >
                                                    <span className="truncate text-foreground">
                                                        {date
                                                            ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                            : 'Select date'}
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            {/* Added padding around the calendar */}
                                            <PopoverContent className="w-auto p-3 border-0 shadow-none">
                                                <Calendar
                                                    mode="single"
                                                    defaultMonth={date}
                                                    selected={date}
                                                    onSelect={(d) => {
                                                        setDate(d);
                                                        setDatePopOpen(false);
                                                    }}
                                                    className="bg-transparent p-2"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="mt-6 p-5 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl shadow-sm">
                                        <label className="text-xs mb-2 text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
                                            <Wallet className="h-4 w-4 opacity-70" />
                                            <span>Total Purchase Amount</span>
                                        </label>
                                        <div className="text-2xl font-bold text-primary">
                                            ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right column - products */}
                                <div className="flex-1 flex flex-col min-w-0">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Package className="h-5 w-5 opacity-70" />
                                            <span>Products</span>
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <AddProductModal onAdd={handleAddProduct} />
                                            <Button className="h-10 gap-2" onClick={() => openModal("addProduct")}>
                                                <Plus className="h-4 w-4" />
                                                Add New Product
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-muted-foreground/10 shadow-sm bg-card">
                                        {/* show up to ~4 rows then scroll; responsive heights */}
                                        <div className="overflow-y-auto max-h-[16rem] sm:max-h-[18rem] md:max-h-[20rem] lg:max-h-[22rem]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-muted-foreground/10">
                                                        <TableHead className="h-12 text-xs font-bold uppercase tracking-wide">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Package className="h-3.5 w-3.5 opacity-60" /> Product Name
                                                            </span>
                                                        </TableHead>
                                                        <TableHead className="h-12 text-center text-xs font-bold uppercase tracking-wide w-[120px]">
                                                            <span className="inline-flex items-center justify-center gap-1.5">
                                                                <Hash className="h-3.5 w-3.5 opacity-60" /> Quantity
                                                            </span>
                                                        </TableHead>
                                                        <TableHead className="h-12 text-center text-xs font-bold uppercase tracking-wide w-[160px]">
                                                            <span className="inline-flex items-center justify-center gap-1.5">
                                                                <BadgeDollarSign className="h-3.5 w-3.5 opacity-60" /> Unit Price
                                                            </span>
                                                        </TableHead>
                                                        <TableHead className="h-12 text-right text-xs font-bold uppercase tracking-wide w-[140px]">
                                                            <span className="inline-flex items-center justify-end gap-1.5">
                                                                <Calculator className="h-3.5 w-3.5 opacity-60" /> Subtotal
                                                            </span>
                                                        </TableHead>
                                                        <TableHead className="h-12 w-[50px]" />
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {products.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-[200px]">
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                                                    <Package className="h-10 w-10 mb-3 opacity-30" />
                                                                    <p className="text-base font-medium">No products added yet</p>
                                                                    <p className="text-xs mt-1.5">Click "Add Product" to start building your purchase order</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        products.map(p => (
                                                            <TableRow key={p.id} className="hover:bg-muted/30 transition-colors border-b border-muted-foreground/5">
                                                                <TableCell className="py-4">
                                                                    {/* wrap long names, limit width on lg+ */}
                                                                    <div className="font-semibold text-sm break-words whitespace-normal max-w-full lg:max-w-[520px]">{p.name}</div>
                                                                </TableCell>

                                                                <TableCell className="text-center py-4">
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        value={String(p.qty)}
                                                                        onChange={(e) => updateProductField(p.id, 'qty', e.target.value)}
                                                                        onBlur={(e) => updateProductField(p.id, 'qty', e.target.value)}
                                                                        className="h-10 w-24 border-muted-foreground/20 bg-background text-center focus-visible:ring-2 focus-visible:border-primary/50 mx-auto text-sm rounded-lg"
                                                                        aria-label={`qty-${p.id}`}
                                                                    />
                                                                </TableCell>

                                                                <TableCell className="text-center py-4">
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <span className="text-muted-foreground font-medium text-sm">₱</span>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min={0}
                                                                            value={String(p.unitPrice)}
                                                                            onChange={(e) => updateProductField(p.id, 'unitPrice', e.target.value)}
                                                                            onBlur={(e) => updateProductField(p.id, 'unitPrice', e.target.value)}
                                                                            className="h-10 w-28 border-muted-foreground/20 bg-background text-center focus-visible:ring-2 focus-visible:border-primary/50 text-sm rounded-lg"
                                                                            aria-label={`unit-${p.id}`}
                                                                        />
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell className="text-right py-4">
                                                                    <div className="font-bold text-base">
                                                                        ₱{(p.qty * p.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell className="text-center py-4">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveProduct(p.id)}
                                                                        aria-label="Remove product"
                                                                        className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                                                                    >
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
                    </div>
                </ScrollArea>

                {/* Compact footer */}
                <DialogFooter className="px-6 py-5 border-t bg-muted/10 sm:justify-end flex-col sm:flex-row gap-3">
                    {validationError && (
                        <div className="w-full text-sm text-destructive bg-destructive/10 border border-destructive/30 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{validationError}</span>
                        </div>
                    )}
                    <div className="flex gap-3 justify-end w-full">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={saving}
                                className="h-11 px-6 text-sm rounded-lg border-muted-foreground/20 hover:bg-muted/50 transition-all font-medium"
                            >
                                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-11 px-8 text-sm rounded-lg shadow-sm hover:shadow-md transition-all font-semibold"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {saving ? 'Saving Purchase...' : 'Save Purchase'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
