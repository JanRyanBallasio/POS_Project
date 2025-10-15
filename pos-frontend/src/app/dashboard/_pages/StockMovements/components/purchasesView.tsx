'use client'

import { useState, useMemo, useEffect } from 'react'
import axios from "@/lib/axios"
import useStockTransactions, { StockTransaction } from '@/hooks/stocks/useStockTransactions'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DateTime } from 'luxon'
import { ChevronRight, Home, Percent, Search } from 'lucide-react'
import PercentModal from './percentModal'
import AddProductModal from './addProductModal'
import AddSupplierModal from './addSupplierModal'
import useSWR from 'swr'

type ViewLevel = 'companies' | 'dates' | 'products'

interface DateGroup {
  dateKey: string
  displayDate: string
  total: number
  transactionIds: (string | number)[]  // Allow both types
}

interface ProductDetail {
  id: string | number
  product_id?: number
  product_name: string
  quantity: number
  purchased_price: number
  supplier_price?: number
  saved_price?: number
  created_at?: string
}

export default function PurchasesView() {
  const { data, loading, error, mutate: mutateTransactions } = useStockTransactions()
  const transactions: StockTransaction[] = data ?? []

  const [viewLevel, setViewLevel] = useState<ViewLevel>('companies')
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // stores PH dateKey (yyyy-MM-dd)
  const [selectedDateLabel, setSelectedDateLabel] = useState<string | null>(null) // human-readable
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [globalFilter, setGlobalFilter] = useState('')
  const [products, setProducts] = useState<ProductDetail[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Supplier selection state (for Add Product modal)
  const [selectedSupplierForProduct, setSelectedSupplierForProduct] = useState<string | null>(null)

  // Percent modal state
  const [percentModalOpen, setPercentModalOpen] = useState(false)
  const [percentModalCompany, setPercentModalCompany] = useState<string>('')

  // Fetch suppliers with percent data
  const { data: suppliersData, mutate: mutateSuppliers } = useSWR(
    '/stock-transactions/suppliers/list',
    async (url) => {
      const res = await axios.get(url)
      return res.data
    }
  )
  const suppliers = suppliersData?.data || []

  // Load selected supplier from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('selectedSupplierForProduct')
    if (saved) {
      setSelectedSupplierForProduct(saved)
    }
  }, [])

  // Save selected supplier to sessionStorage
  useEffect(() => {
    if (selectedSupplierForProduct) {
      sessionStorage.setItem('selectedSupplierForProduct', selectedSupplierForProduct)
    }
  }, [selectedSupplierForProduct])

  // Group transactions by company
  const companiesData = useMemo(() => {
    const grouped = transactions.reduce((acc, tx) => {
      const company = tx.company_name
      if (!acc[company]) {
        acc[company] = {
          company_name: company,
          transactions: [],
          total: 0
        }
      }
      acc[company].transactions.push(tx)
      acc[company].total += tx.total || 0
      return acc
    }, {} as Record<string, { company_name: string; transactions: StockTransaction[]; total: number }>)

    return Object.values(grouped).sort((a, b) => a.company_name.localeCompare(b.company_name))
  }, [transactions])

  // Get dates for selected company (PH timezone, aggregated per day)
  const datesData = useMemo<DateGroup[]>(() => {
    if (!selectedCompany) return []
    const map = new Map<string, DateGroup>()

    transactions
      .filter(tx => tx.company_name === selectedCompany)
      .filter(tx => {
        // Only include transactions that have actual items/products
        const hasItems = tx.items && Array.isArray(tx.items) && tx.items.length > 0
        const hasTotal = (tx.total ?? 0) > 0
        return hasItems || hasTotal
      })
      .forEach(tx => {
        const ph = DateTime.fromISO(tx.date).setZone('Asia/Manila')
        const dateKey = ph.toISODate() ?? ''
        const displayDate = ph.toFormat('MMMM dd, yyyy')

        if (!dateKey) return

        const existing = map.get(dateKey)
        if (existing) {
          existing.total += tx.total ?? 0
          existing.transactionIds.push(tx.id)
        } else {
          map.set(dateKey, {
            dateKey,
            displayDate,
            total: tx.total ?? 0,
            transactionIds: [tx.id]
          })
        }
      })

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [transactions, selectedCompany])

  // Toggle company expansion
  const toggleCompanyExpansion = (company: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(company)) {
      newExpanded.delete(company)
    } else {
      newExpanded.add(company)
    }
    setExpandedCompanies(newExpanded)
  }

  // Handle navigation
  const handleCompanyClick = (company: string) => {
    setSelectedCompany(company)
    setViewLevel('dates')
    setSelectedDate(null)
    setSelectedDateLabel(null)
  }

  // Handle supplier row click (select for Add Product)
  const handleSupplierSelect = (company: string) => {
    setSelectedSupplierForProduct(company)
    // Also navigate to dates view
    handleCompanyClick(company)
  }

  // Handle percent icon click
  const handlePercentClick = (e: React.MouseEvent, company: string) => {
    e.stopPropagation() // Prevent row click
    setPercentModalCompany(company)
    setPercentModalOpen(true)
  }

  // Handle percent save
  const handlePercentSaved = () => {
    mutateSuppliers() // Refresh suppliers list to get updated percent
  }

  // Get percent for a company
  const getCompanyPercent = (companyName: string): number | null => {
    const supplier = suppliers.find((s: any) => s.company_name === companyName)
    return supplier?.percent ?? null
  }

  const loadProducts = async (group: DateGroup, showLoading: boolean = true) => {
    if (showLoading) {
      setLoadingProducts(true)
    }

    try {
      // Load items for all transactions in the selected PH date group
      const transactionDataList = await Promise.all(
        group.transactionIds.map(async (transactionId) => {
          const res = await axios.get(`/stock-transactions/${transactionId}`)
          return {
            items: res.data?.items || [],
            percent: res.data?.transaction?.percent || null
          }
        })
      )

      // Flatten items and include the percent from their transaction
      const itemsWithPercent = transactionDataList.flatMap(({items, percent}) =>
        items.map((item: any) => ({ ...item, transactionPercent: percent }))
      )

      // Fetch current product prices and calculate supplier prices for each item
      const productsWithPrices = await Promise.all(
        itemsWithPercent.map(async (item: any) => {
          const adjustedPrice = Number(item.purchased_price || item.price || 0)

          // Calculate supplier price using the percent from the transaction
          const percent = item.transactionPercent
          const supplierPrice = percent ? adjustedPrice * percent : adjustedPrice

          return {
            id: item.id || `${item.product_id}-${item.created_at}-${Math.random()}`, // Unique ID for React key
            product_id: item.product_id,
            product_name: item.product?.name || item.product_name || `Product #${item.product_id || 'Unknown'}`,
            quantity: Number(item.quantity || 0),
            purchased_price: adjustedPrice,
            supplier_price: supplierPrice,
            saved_price: adjustedPrice,
            created_at: item.created_at
          }
        })
      )

      // Sort products by most recent first (by created_at timestamp)
      const sortedProducts = productsWithPrices.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA // Descending order (newest first)
      })

      setProducts(sortedProducts)
    } catch (err) {
      console.error('Error loading products:', err)
      setProducts([])
    } finally {
      if (showLoading) {
        setLoadingProducts(false)
      }
    }
  }

  const handleDateClick = async (group: DateGroup) => {
    setSelectedDate(group.dateKey)
    setSelectedDateLabel(group.displayDate)
    setViewLevel('products')
    await loadProducts(group, true)
  }

  // Function to refresh products when a new item is added - NO loading state
  const handleProductAdded = async () => {
    // Ensure transactions are fresh first
    await mutateTransactions()

    if (selectedDate) {
      const currentDateGroup = datesData.find(d => d.dateKey === selectedDate)
      if (currentDateGroup) {
        // Reload without showing loading state for seamless update
        await loadProducts(currentDateGroup, false)
      }
    }
  }

  const handleBreadcrumbNavigation = async (level: ViewLevel) => {
    // Ensure transactions are fresh before navigation
    await mutateTransactions()

    setViewLevel(level)
    if (level === 'companies') {
      setSelectedCompany(null)
      setSelectedDate(null)
      setSelectedDateLabel(null)
      setProducts([]) // Clear products when going back to companies
    } else if (level === 'dates') {
      setSelectedDate(null)
      setSelectedDateLabel(null)
      setProducts([]) // Clear products when going back to dates
    }
  }

  // Filter data based on search
  const filteredCompanies = useMemo(() => {
    if (!globalFilter.trim()) return companiesData
    const query = globalFilter.toLowerCase()
    return companiesData.filter(c =>
      c.company_name.toLowerCase().includes(query)
    )
  }, [companiesData, globalFilter])

  const filteredDates = useMemo(() => {
    if (!globalFilter.trim()) return datesData
    const query = globalFilter.toLowerCase()
    return datesData.filter(d =>
      d.displayDate.toLowerCase().includes(query)
    )
  }, [datesData, globalFilter])

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="space-y-4 relative z-10">
        {/* Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 relative z-20">
          <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => handleBreadcrumbNavigation('companies')}
              className="hover:text-gray-900 flex items-center gap-1.5 whitespace-nowrap transition-colors relative z-30 cursor-pointer"
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Purchases</span>
            </button>
            {selectedCompany && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbNavigation('dates')}
                  className="hover:text-gray-900 font-medium whitespace-nowrap transition-colors relative z-30 cursor-pointer"
                >
                  {selectedCompany}
                </button>
              </>
            )}
            {selectedDateLabel && viewLevel === 'products' && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-900 font-medium whitespace-nowrap">{selectedDateLabel}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <AddSupplierModal onAdded={mutateSuppliers} />
            <AddProductModal
              onAdd={() => {
                mutateSuppliers()
              }}
              preSelectedSupplier={selectedSupplierForProduct}
              onSuccess={handleProductAdded}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search purchases..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>
      </div>

      {/* Companies View */}
      {viewLevel === 'companies' && (
        <>
          {/* Desktop Table View */}
          <div className='hidden md:block rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white'>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="h-12 font-semibold text-gray-900">Supplier / Company</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900 text-right">Transactions</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900 text-right">Total Amount</TableHead>
                  <TableHead className="h-12 w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-32 text-center text-gray-500'>
                      No companies found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map(company => {
                    const percent = getCompanyPercent(company.company_name)
                    const divisorDisplay = percent ? percent.toFixed(2) : null

                    return (
                      <TableRow
                        key={company.company_name}
                        className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                        onClick={() => handleSupplierSelect(company.company_name)}
                      >
                        <TableCell className="py-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{company.company_name}</span>
                            {divisorDisplay !== null && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                                ÷{divisorDisplay}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right text-sm text-gray-600">
                          {company.transactions.length}
                        </TableCell>
                        <TableCell className="py-4 text-right font-semibold text-gray-900">
                          ₱{company.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={(e) => handlePercentClick(e, company.company_name)}
                              title="Edit percent"
                            >
                              <Percent className="h-4 w-4 text-gray-600" />
                            </Button>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredCompanies.length === 0 ? (
              <div className='h-32 flex items-center justify-center text-gray-500 text-sm'>
                No companies found.
              </div>
            ) : (
              filteredCompanies.map(company => {
                const percent = getCompanyPercent(company.company_name)
                const divisorDisplay = percent ? percent.toFixed(2) : null

                return (
                  <div
                    key={company.company_name}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSupplierSelect(company.company_name)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{company.company_name}</h3>
                        {divisorDisplay !== null && (
                          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                            Divisor: ÷{divisorDisplay}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg flex-shrink-0 ml-2"
                        onClick={(e) => handlePercentClick(e, company.company_name)}
                        title="Edit percent"
                      >
                        <Percent className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Transactions</p>
                          <p className="text-sm font-medium text-gray-900">{company.transactions.length}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ₱{company.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Percent Modal */}
      {percentModalOpen && (
        <PercentModal
          companyName={percentModalCompany}
          isOpen={percentModalOpen}
          onOpenChange={setPercentModalOpen}
          onSaved={handlePercentSaved}
        />
      )}

      {/* Dates View */}
      {viewLevel === 'dates' && selectedCompany && (
        <>
          {/* Desktop Table View */}
          <div className='hidden md:block rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white'>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="h-12 font-semibold text-gray-900">Purchase Date</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900 text-right">Total Amount</TableHead>
                  <TableHead className="h-12 w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className='h-32 text-center text-gray-500'>
                      No transactions found for this company.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDates.map(group => (
                    <TableRow
                      key={group.dateKey}
                      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                      onClick={() => handleDateClick(group)}
                    >
                      <TableCell className="py-4 font-medium text-gray-900">
                        {group.displayDate}
                      </TableCell>
                      <TableCell className="py-4 text-right font-semibold text-gray-900">
                        ₱{group.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="py-4">
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredDates.length === 0 ? (
              <div className='h-32 flex items-center justify-center text-gray-500 text-sm'>
                No transactions found for this company.
              </div>
            ) : (
              filteredDates.map(group => (
                <div
                  key={group.dateKey}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleDateClick(group)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{group.displayDate}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₱{group.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Products View */}
      {viewLevel === 'products' && selectedCompany && selectedDate && (
        <>
          {/* Desktop Table View */}
          <div className='hidden lg:block rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white'>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="h-12 font-semibold text-gray-900">Supplier / Company</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Product</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900 text-right">Quantity</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900 text-right">Supplier Price</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900 text-right">Saved Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-32 text-center text-gray-500'>
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-32 text-center text-gray-500'>
                      No products found for this transaction.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                      <TableCell className="py-4 font-medium text-sm text-gray-700">
                        {selectedCompany}
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-gray-900">
                        {product.product_name}
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm text-gray-700">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm text-gray-600">
                        ₱{product.supplier_price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="py-4 text-right font-semibold text-gray-900">
                        ₱{product.saved_price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {loadingProducts ? (
              <div className='h-32 flex items-center justify-center text-gray-500 text-sm'>
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className='h-32 flex items-center justify-center text-gray-500 text-sm'>
                No products found for this transaction.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{product.product_name}</h3>
                      <p className="text-xs text-gray-500">{selectedCompany}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-900 ml-2 flex-shrink-0">
                      Qty: {product.quantity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Supplier Price</p>
                      <p className="text-sm font-medium text-gray-700">
                        ₱{product.supplier_price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Saved Price</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₱{product.saved_price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
