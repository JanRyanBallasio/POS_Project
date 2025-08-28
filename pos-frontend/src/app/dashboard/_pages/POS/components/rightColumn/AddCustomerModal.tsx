// ...existing code...
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

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
            const backendBase = (process.env.NEXT_PUBLIC_backend_api_url || "").replace(/\/$/, "");
            const url = `${backendBase}/customers?name=${encodeURIComponent(trimmed)}`;
            const checkRes = await fetch(url);
            const checkJson = await checkRes.json().catch(() => ({}));
            const candidates: any[] = Array.isArray(checkJson)
                ? checkJson
                : Array.isArray(checkJson?.data)
                    ? checkJson.data
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
            const createRes = await fetch(`${backendBase}/customers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });

            const createJson = await createRes.json().catch(() => ({}));
            if (!createRes.ok || createJson.success === false) {
                const msg = createJson.message || createJson.error || "Failed to add customer";
                throw new Error(msg);
            }

            // success: notify parent and close modal
            const newCustomer = createJson.data ?? createJson; // handle different backends
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