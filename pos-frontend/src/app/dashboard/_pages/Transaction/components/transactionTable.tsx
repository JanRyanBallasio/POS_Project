'use client'

import { Button } from '@/components/ui/button'
import { Eye, Printer } from 'lucide-react'
import { useSales } from '@/hooks/global/fetching/useSales'
import ViewTransactionModal from './viewTransactionModal'
import { useState, useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import { usePrint } from '@/hooks/printing/usePrint'

export default function TransactionTable() {
  const { sales, loading } = useSales()
  const [viewSaleId, setViewSaleId] = useState<number | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const { printReceipt } = usePrint()
  const [printingId, setPrintingId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [availableHeight, setAvailableHeight] = useState<number>(0)

  // Dynamically calculate available height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const top = containerRef.current.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        const height = windowHeight - top - 20
        setAvailableHeight(height)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const handlePrint = async (saleId: number) => {
    if (printingId !== null) return
    try {
      setPrintingId(saleId)
      const res = await axios.get(`/sales/${saleId}`)
      const payload = res?.data?.data
      if (!payload || !payload.items || !payload.sale) {
        throw new Error('Invalid sale details returned')
      }

      const items = (payload.items as Array<{
        name: string
        quantity: number
        price: number
        total: number
      }>).map(it => ({
        desc: it.name,
        qty: Number(it.quantity || 0),
        price: Number(it.price || 0),
        amount: Number(it.total || 0)
      }))

      await printReceipt({
        store: { name: 'YZY STORE', address1: 'Eastern Slide, Tuding' },
        customer: payload.sale.customer || { name: 'N/A' },
        cartTotal: Number(payload.sale.total_purchase || 0),
        amount: Number(payload.sale.total_purchase || 0),
        change: 0,
        points: 0,
        items,
        printerName: null
      })

      alert('Printed successfully')
    } catch (e: any) {
      alert(e?.message || String(e))
    } finally {
      setPrintingId(null)
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col bg-white rounded-2xl shadow-sm border border-border/40"
    >
      <div
        className="overflow-auto rounded-2xl"
        style={{ height: availableHeight ? `${availableHeight}px` : 'auto' }}
      >
        <table className="min-w-full border-collapse">
          <thead
            className="sticky top-0 z-30 backdrop-blur-sm bg-white/90 border-b border-border/40"
          >
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Date
              </th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Customer
              </th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 px-4 text-left text-sm text-muted-foreground">
                  Loading...
                </td>
                <td className="text-center text-muted-foreground">—</td>
                <td className="text-center text-muted-foreground">—</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td className="py-4 px-4 text-left text-sm text-muted-foreground">
                  No transactions found.
                </td>
                <td className="text-center text-muted-foreground">—</td>
                <td className="text-center text-muted-foreground">—</td>
              </tr>
            ) : (
              sales.map(s => (
                <tr
                  key={s.id}
                  className="hover:bg-muted/30 transition-colors border-b border-border/30"
                >
                  <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td
                    className="py-3 px-4 text-sm text-center truncate max-w-[200px]"
                    title={s.customer?.name || 'N/A'}
                  >
                    {s.customer?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View"
                        className="hover:bg-muted rounded-full"
                        onClick={() => {
                          setViewSaleId(s.id)
                          setViewOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Print"
                        className="hover:bg-muted rounded-full"
                        onClick={() => handlePrint(s.id)}
                        disabled={printingId === s.id}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ViewTransactionModal
        open={viewOpen}
        saleId={viewSaleId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  )
}
