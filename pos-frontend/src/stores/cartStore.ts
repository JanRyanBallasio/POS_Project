import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/hooks/products/useProductApi'

export interface CartItem {
  product: Product
  quantity: number
  id: string
}

interface CartState {
  cart: CartItem[]
  lastAddedItemId: string | null
  scanError: string | null
  isScanning: boolean
  
  // Actions
  addProductToCart: (product: Product) => string
  updateCartItemQuantity: (id: string, quantity: number) => void
  updateCartItemPrice: (id: string, price: number) => void
  deleteCartItem: (id: string) => void
  clearCart: () => void
  setScanError: (error: string | null) => void
  setIsScanning: (scanning: boolean) => void
  setLastAddedItemId: (id: string | null) => void
}

const genId = () =>
  typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : Date.now().toString()

const productEqual = (a: Product, b: Product) => {
  if (a?.id && b?.id) return a.id === b.id
  return Boolean(a?.barcode && b?.barcode && a.barcode === b.barcode)
}

// Generate a unique tab ID for per-tab cart isolation
const getTabId = (): string => {
  // Use sessionStorage to maintain tab ID across page reloads
  if (typeof window === 'undefined') return 'default-tab'
  
  let tabId = sessionStorage.getItem('pos-tab-id')
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('pos-tab-id', tabId)
  }
  return tabId
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      lastAddedItemId: null,
      scanError: null,
      isScanning: false,

      addProductToCart: (product: Product) => {
        const { cart } = get()
        const existing = cart.find((item) => productEqual(item.product, product))
        
        if (existing) {
          const updatedCart = cart.map((item) =>
            productEqual(item.product, product) 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          )
          set({ 
            cart: updatedCart, 
            lastAddedItemId: existing.id 
          })
          return existing.id
        } else {
          const cartItem: CartItem = { 
            product, 
            quantity: 1, 
            id: genId() 
          }
          set({ 
            cart: [cartItem, ...cart], 
            lastAddedItemId: cartItem.id 
          })
          return cartItem.id
        }
      },

      updateCartItemQuantity: (id: string, quantity: number) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id 
              ? { ...item, quantity: Math.max(0, Number(quantity) || 0) } 
              : item
          )
        }))
      },

      updateCartItemPrice: (id: string, price: number) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id
              ? { 
                  ...item, 
                  product: { 
                    ...item.product, 
                    price: Number(isFinite(Number(price)) ? price : 0) 
                  } 
                }
              : item
          )
        }))
      },

      deleteCartItem: (id: string) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
          lastAddedItemId: state.lastAddedItemId === id ? null : state.lastAddedItemId
        }))
      },

      clearCart: () => {
        set({ 
          cart: [], 
          lastAddedItemId: null 
        })
      },

      setScanError: (error: string | null) => {
        set({ scanError: error })
      },

      setIsScanning: (scanning: boolean) => {
        set({ isScanning: scanning })
      },

      setLastAddedItemId: (id: string | null) => {
        set({ lastAddedItemId: id })
      }
    }),
    {
      name: `pos-cart-storage-${getTabId()}`, // unique name per tab for localStorage key
      partialize: (state) => ({ 
        cart: state.cart, 
        lastAddedItemId: state.lastAddedItemId 
      }), // only persist cart and lastAddedItemId
    }
  )
)

// Computed values
export const useCartTotal = () => {
  const cart = useCartStore((state) => state.cart)
  return cart.reduce((total, item) => total + Number(item.product.price || 0) * item.quantity, 0)
}
