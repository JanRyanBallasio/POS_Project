import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AddCustomerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerAdded: (customer: { id: string; name: string; points: number }) => void; // pass new customer
}

export default function AddCustomerModal({ open, onOpenChange, onCustomerAdded }: AddCustomerModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_backend_api_url}/customers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Failed to add customer");
            setName("");
            onOpenChange(false);
            onCustomerAdded(json.data); // <-- pass the new customer object
        } catch (err: any) {
            setError(err.message || "Failed to add customer");
        } finally {
            setLoading(false);
        }
    };

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
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter customer name"
                        disabled={loading}
                    />
                    {error && <span className="text-red-500 text-sm">{error}</span>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={loading || !name.trim()}>
                        {loading ? "Adding..." : "Add"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}