import useSWR from 'swr'
import { useCallback } from 'react'

export type StockTransaction = {
  id: number | string
  company_name: string
  date: string
  total?: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return (json?.data ?? []) as StockTransaction[]
}

export default function useStockTransactions() {
  const base = process.env.NEXT_PUBLIC_backend_api_url ?? ''
  const endpoint = `${base}/stock-transactions`

  const { data, error, isValidating, mutate } = useSWR<StockTransaction[], Error>(endpoint, fetcher, {
    revalidateOnFocus: false
  })

  return {
    data,
    loading: !error && !data && isValidating,
    error: error ? error.message : null
  }
}