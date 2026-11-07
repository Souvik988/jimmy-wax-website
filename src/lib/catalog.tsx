import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { publicApi, apiPages, ApiError } from './api'
import { toProduct, type ApiProduct, type Product } from '../data/products'

export interface StoreSettings {
  shippingFeePaise: number
  freeShippingThresholdPaise: number | null
  codEnabled: boolean
  codFeePaise: number
  onlinePaymentsEnabled?: boolean
  gstRateBps: number
  taxInclusive: boolean
  checkoutOpen: boolean
  ordersPaused: boolean
  pauseMessage: string
  brandName: string
  supportEmail: string | null
  supportPhone: string | null
  deliveryEstimate: string
}

export interface CatalogState {
  products: Product[]
  settings: StoreSettings | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
  reload: () => void
}

export const CatalogContext = createContext<CatalogState>({ products: [], settings: null, status: 'loading', error: null, reload: () => {} })

/** Loads the live catalogue and store policy once, and again whenever the tab regains focus (prices/stock may change). */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [status, setStatus] = useState<CatalogState['status']>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        apiPages<ApiProduct>('/v1/products?limit=50'),
        publicApi<StoreSettings>('GET', '/v1/store-settings'),
      ])
      setProducts(p.map(toProduct))
      setSettings(s)
      setStatus('ready')
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'The store is unavailable right now.')
      // Keep showing the last good catalogue if we have one; otherwise surface the error.
      setStatus((cur) => (cur === 'ready' ? 'ready' : 'error'))
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const value = useMemo(() => ({ products, settings, status, error, reload: () => void load() }), [products, settings, status, error, load])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export const useCatalog = () => useContext(CatalogContext)
export const useProducts = () => useContext(CatalogContext).products
