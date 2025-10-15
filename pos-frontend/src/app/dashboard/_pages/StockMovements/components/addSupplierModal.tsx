'use client'
import { useState } from "react";
import { Building2, Check, ChevronLeft as ChevronLeftIcon, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";

type Props = {
    onAdded?: () => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export default function AddSupplierModal({ onAdded, isOpen: controlledOpen, onOpenChange }: Props) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const [supplierName, setSupplierName] = useState("");
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string>("");
    const { mutate } = useSWRConfig();

    const handleSave = async () => {
        // Clear previous validation error
        setValidationError("");

        // Validate
        if (!supplierName.trim()) {
            setValidationError("Supplier name is required");
            return;
        }

        const payload = {
            company_name: supplierName.trim(),
            date: new Date().toISOString(),
            total: 0,
            items: []
        };

        try {
            setSaving(true);
            const endpoint = `/stock-transactions`;
            const res = await axios.post(endpoint, payload);
            const json = res.data;
            if (res.status >= 400) throw new Error(json?.message || json?.error || 'Save failed');

            // Notify parent to refresh suppliers list
            onAdded?.();

            // Revalidate stock transactions SWR cache
            mutate(endpoint);

            // Reset and close
            setSupplierName("");
            setOpen(false);
        } catch (err: any) {
            console.error('save supplier error', err);
            alert(`Save failed: ${err?.message ?? err}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 flex items-center gap-2 px-4">
                        <Plus className="h-4 w-4" />
                        Add Supplier
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Add Supplier</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Enter the supplier or company name to add to your database.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4 opacity-70" />
                            <span>Supplier / Company Name</span>
                        </label>
                        <Input
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            placeholder="Enter supplier name"
                            className="h-11 text-sm border-muted-foreground/20 focus-visible:border-primary/50 rounded-lg"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !saving) {
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3">
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
                            {saving ? 'Saving Supplier...' : 'Save Supplier'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
