'use client'
import { useState, useEffect } from "react"
import { Percent, Check, ChevronLeft as ChevronLeftIcon } from "lucide-react"
import { useSWRConfig } from 'swr'
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Props = {
    companyName: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSaved?: () => void
}

export default function PercentModal({ companyName, isOpen, onOpenChange, onSaved }: Props) {
    const [percentValue, setPercentValue] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [validationError, setValidationError] = useState<string>("")
    const { mutate } = useSWRConfig()

    // Fetch current percent when modal opens
    useEffect(() => {
        if (isOpen && companyName) {
            setLoading(true)
            setValidationError("")

            axios.get(`/stock-transactions/suppliers/${encodeURIComponent(companyName)}/percent`)
                .then(res => {
                    const percent = res.data?.data?.percent
                    if (percent !== null && percent !== undefined) {
                        // Store as divisor directly (0.83 stays as "0.83")
                        setPercentValue(percent.toString())
                    } else {
                        setPercentValue("")
                    }
                })
                .catch(err => {
                    console.error('Error fetching percent:', err)
                    setPercentValue("")
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [isOpen, companyName])

    const handlePercentChange = (raw: string) => {
        // Allow only numbers and at most 2 decimal places
        if (/^\d*\.?\d{0,2}$/.test(raw) || raw === "") {
            setPercentValue(raw)
        }
    }

    const handlePercentBlur = () => {
        const v = parseFloat(percentValue)
        if (!isNaN(v)) {
            setPercentValue(v.toFixed(2))
        }
    }

    const handleSave = async () => {
        // Clear previous validation error
        setValidationError("")

        if (!percentValue.trim()) {
            setValidationError("Divisor value is required")
            return
        }

        const numValue = Number(percentValue)
        if (isNaN(numValue) || numValue <= 0) {
            setValidationError("Please enter a valid divisor greater than 0")
            return
        }

        // Use the value directly as the divisor (e.g., 0.83)
        const divisorValue = parseFloat(numValue.toFixed(4))

        try {
            setSaving(true)
            const endpoint = `/stock-transactions/suppliers/${encodeURIComponent(companyName)}/percent`
            await axios.put(endpoint, { percent: divisorValue })

            // Revalidate caches
            mutate('/stock-transactions/suppliers/list')
            mutate('/stock-transactions')

            // Notify parent
            onSaved?.()

            // Close modal
            onOpenChange(false)
        } catch (err: any) {
            console.error('Save percent error', err)
            alert(`Save failed: ${err?.response?.data?.message || err?.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Percent className="h-6 w-6" />
                        Edit Supplier Divisor
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Set the divisor for <strong>{companyName}</strong>. This will be used to calculate adjusted product prices.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Percent className="h-4 w-4 opacity-70" />
                            <span>Divisor</span>
                        </label>
                        {loading ? (
                            <div className="h-11 flex items-center justify-center border rounded-lg bg-muted/20">
                                <span className="text-sm text-muted-foreground">Loading...</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={percentValue}
                                    onChange={(e) => handlePercentChange(e.target.value)}
                                    onBlur={handlePercentBlur}
                                    placeholder="Enter divisor (e.g., 0.83)"
                                    className="h-11 text-sm border-muted-foreground/20 focus-visible:border-primary/50 rounded-lg"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !saving) {
                                            handleSave()
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            Example: Enter 0.83 for the divisor. The system will calculate: Supplier Price ÷ 0.83 = Retail Price
                        </p>
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
                                onClick={() => onOpenChange(false)}
                                disabled={saving || loading}
                                className="h-11 px-6 text-sm rounded-lg border-muted-foreground/20 hover:bg-muted/50 transition-all font-medium"
                            >
                                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="h-11 px-8 text-sm rounded-lg shadow-sm hover:shadow-md transition-all font-semibold"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Percent'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
