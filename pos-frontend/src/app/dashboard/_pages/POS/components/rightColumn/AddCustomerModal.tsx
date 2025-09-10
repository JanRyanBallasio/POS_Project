import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";

interface AddCustomerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerAdded: (customer: { id: string; name: string; points: number }) => void;
}

export default function AddCustomerModal({ open, onOpenChange, onCustomerAdded }: AddCustomerModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setName("");
            setError(null);
            setLoading(false);
            setValidating(false);
        }
    }, [open]);

    // Utility: normalize a name for exact, case-insensitive comparison
    const normalize = (s: string) => s.trim().toLowerCase();

    // Validate name by querying /customers?name=xxx for exact case-insensitive match
    const validateName = async (trimmed: string): Promise<boolean> => {
        if (!trimmed) {
            setError(null);
            return true;
        }

        setValidating(true);
        try {
            const resp = await axios.get("/customers", { params: { name: trimmed } });
            const list = resp?.data?.data ?? resp?.data ?? [];
            const duplicate = Array.isArray(list) && list.some((c: any) => {
                const candidate = c?.name ?? c?.full_name ?? "";
                return normalize(candidate) === normalize(trimmed);
            });

            if (duplicate) {
                setError("A customer with this name already exists.");
                return false;
            } else {
                setError(null);
                return true;
            }
        } catch (err) {
            console.warn("Customer validation failed:", err);
            // On network/server errors, do not block the user — clear validation error
            setError(null);
            return true;
        } finally {
            setValidating(false);
        }
    };

    const handleAdd = async () => {
        const trimmed = name.trim();

        if (trimmed.length === 0) {
            setError("Name cannot be empty.");
            return;
        }

        // Run final validation before creating the customer
        const ok = await validateName(trimmed);
        if (!ok) {
            return;
        }

        setLoading(true);
        try {
            // Final server-side duplicate check / create customer
            const checkRes = await axios.get(`/customers`, { params: { name: trimmed } });
            const checkData = checkRes.data;
            const candidates: any[] = Array.isArray(checkData)
                ? checkData
                : Array.isArray(checkData?.data)
                    ? checkData.data
                    : [];

            const foundExact = candidates.some((c: any) => {
                if (!c || typeof c.name !== "string") return false;
                return normalize(c.name) === normalize(trimmed);
            });

            if (foundExact) {
                setError("A customer with this name already exists.");
                setLoading(false);
                return;
            }

            const createRes = await axios.post(`/customers`, { name: trimmed });
            const createData = createRes.data;
            if (createRes.status >= 400 || createData?.success === false) {
                const msg = createData?.message || createData?.error || "Failed to add customer";
                throw new Error(msg);
            }

            const newCustomer = createData?.data ?? createData; // handle different backends
            setName("");
            onOpenChange(false);
            onCustomerAdded(newCustomer);
        } catch (err: any) {
            setError(err?.message || "Failed to add customer");
        } finally {
            setLoading(false);
        }
    };

    const isAddDisabled = loading || validating || !!error || name.trim().length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent data-add-customer-modal="true">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleAdd();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="mb-2">Add Customer</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Label htmlFor="add-customer-name">Name</Label>
                        <Input
                            id="add-customer-name"
                            autoFocus
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                // Clear duplicate/error feedback while the user types;
                                // final check still runs onBlur / onSubmit.
                                if (error) setError(null);
                            }}
                            onBlur={() => {
                                const trimmed = name.trim();
                                if (trimmed) void validateName(trimmed);
                            }}
                        />
                        {error && <span className="text-red-500 text-sm">{error}</span>}
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isAddDisabled}>
                                {loading ? "Adding..." : "Add"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
