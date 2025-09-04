// ...existing code...
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

    const handleAdd = async () => {
        const trimmed = name.trim();
        setError(null);

        if (trimmed.length === 0) {
            setError("Name cannot be empty.");
            return;
        }

        setLoading(true);
        setValidating(true);

        try {
            // 1) Check for exact case-insensitive duplicate (only when Add is pressed)

            // Backend may return a list under `data` or a raw array; handle both.
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
                setValidating(false);
                return;
            }

            // 2) No exact duplicate -> create customer

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
            setValidating(false);
        }
    };

    const isAddDisabled = loading || validating || name.trim().length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Customer</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 my-2">
                    <Label htmlFor="customer-name">Name</Label>
                    <Input
                        id="customer-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError(null);
                        }}
                        placeholder="Enter customer name"
                        disabled={loading}
                    />
                    {validating && <span className="text-gray-500 text-sm">Checking name...</span>}
                    {error && <span className="text-red-500 text-sm">{error}</span>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={isAddDisabled}>
                        {loading ? "Adding..." : "Add"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};