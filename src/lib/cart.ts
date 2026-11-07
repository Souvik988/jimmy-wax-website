import { useSyncExternalStore } from 'react'
import { ApiError, authedApi, publicApi, session } from './api'
import type { Product } from '../data/products'

/**
 * The cart lives on the SERVER (prices, stock and totals are never computed in the browser).
 * Signed out: an anonymous "guest cart" identified by a secret token kept in localStorage.
 * Signing in merges it into the customer's cart (the same cart the mobile app uses).
 */
export interface CartLine {
  variantId: string
  productId: string
  name: string
  variantTitle: string
  unitPricePaise: number
  quantity: number
  available: number
  purchasable: boolean
}
export interface Cart { version: number; lines: CartLine[]; subtotalPaise: number; couponCode: string | null }
interface State { cart: Cart; busy: boolean; error: string | null; loaded: boolean }

const GUEST_KEY = 'jw-guest-cart-v1'
const EMPTY: Cart = { version: 0, lines: [], subtotalPaise: 0, couponCode: null }

let state: State = { cart: EMPTY, busy: false, error: null, loaded: false }
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }

const guestToken = () => { try { return localStorage.getItem(GUEST_KEY) } catch { return null } }
const setGuestToken = (t: string | null) => { try { t ? localStorage.setItem(GUEST_KEY, t) : localStorage.removeItem(GUEST_KEY) } catch { /* private mode */ } }
const norm = (c: Partial<Cart> & { lines?: CartLine[] }): Cart => ({ version: c.version ?? 0, lines: c.lines ?? [], subtotalPaise: c.subtotalPaise ?? 0, couponCode: c.couponCode ?? null })

// One mutation at a time, so quick taps on "+" cannot race each other.
let queue: Promise<unknown> = Promise.resolve()
const enqueue = <T,>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn)
  queue = run.catch(() => undefined)
  return run
}

export async function loadCart(): Promise<void> {
  try {
    if (session.isSignedIn()) {
      set({ cart: norm(await authedApi<Cart>('GET', '/v1/cart')), error: null, loaded: true })
    } else if (guestToken()) {
      try {
        set({ cart: norm(await publicApi<Cart>('GET', '/v1/guest-cart', undefined, { 'x-guest-cart-token': guestToken()! })), error: null, loaded: true })
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 404)) { setGuestToken(null); set({ cart: EMPTY, loaded: true }) } else throw e
      }
    } else set({ cart: EMPTY, loaded: true })
  } catch (e) {
    set({ error: e instanceof ApiError ? e.message : 'Could not load your care list', loaded: true })
  }
}

async function put(variantId: string, quantity: number): Promise<Cart> {
  if (session.isSignedIn()) return norm(await authedApi<Cart>('PUT', `/v1/cart/lines/${encodeURIComponent(variantId)}`, { quantity }))
  let token = guestToken()
  if (!token) {
    const made = await publicApi<{ guestCartToken: string }>('POST', '/v1/guest-carts')
    token = made.guestCartToken
    setGuestToken(token)
  }
  return norm(await publicApi<Cart>('PUT', `/v1/guest-cart/lines/${encodeURIComponent(variantId)}`, { quantity }, { 'x-guest-cart-token': token }))
}

/** Set a line's quantity (0 removes). Updates the UI immediately and rolls back if the server refuses. */
export function setQuantity(variantId: string, quantity: number, hint?: Product): Promise<void> {
  const q = Math.max(0, Math.min(99, quantity))
  const before = state.cart
  const has = before.lines.some((l) => l.variantId === variantId)
  const lines = q === 0
    ? before.lines.filter((l) => l.variantId !== variantId)
    : has
      ? before.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l))
      : hint
        ? [...before.lines, { variantId, productId: hint.id, name: hint.name, variantTitle: hint.size, unitPricePaise: hint.pricePaise, quantity: q, available: hint.availableQuantity, purchasable: hint.available }]
        : before.lines
  set({ cart: { ...before, lines, subtotalPaise: lines.reduce((n, l) => n + l.unitPricePaise * l.quantity, 0) }, busy: true, error: null })
  return enqueue(async () => {
    try {
      set({ cart: await put(variantId, q), busy: false })
    } catch (e) {
      set({ cart: before, busy: false, error: e instanceof ApiError ? e.message : 'Could not update your care list' })
      await loadCart()
    }
  })
}

export async function mergeGuestIntoAccount(): Promise<void> {
  const token = guestToken()
  if (token && session.isSignedIn()) {
    try {
      await enqueue(() => authedApi('POST', '/v1/cart/merge', { guestCartToken: token }))
      setGuestToken(null)
    } catch (e) {
      // A dead guest cart (consumed/expired) is not worth blocking sign-in for.
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) setGuestToken(null)
    }
  }
  await loadCart()
}

export async function applyCoupon(code: string): Promise<void> {
  await authedApi('POST', '/v1/cart/coupon', { code })
  await loadCart()
}
export async function removeCoupon(): Promise<void> {
  await authedApi('DELETE', '/v1/cart/coupon')
  await loadCart()
}

let wasSignedIn = session.isSignedIn()
session.subscribe(() => {
  const now = session.isSignedIn()
  if (now && !wasSignedIn) void mergeGuestIntoAccount()
  if (!now && wasSignedIn) set({ cart: EMPTY })
  wasSignedIn = now
})
void loadCart()

export function useCartState(): State {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l) } }, () => state)
}

export function useCart() {
  const s = useCartState()
  const count = s.cart.lines.reduce((n, l) => n + l.quantity, 0)
  return {
    cart: s.cart,
    count,
    busy: s.busy,
    error: s.error,
    addToCart: (p: Product) => setQuantity(p.variantId, (s.cart.lines.find((l) => l.variantId === p.variantId)?.quantity ?? 0) + 1, p),
    updateQuantity: (variantId: string, delta: number) => setQuantity(variantId, (s.cart.lines.find((l) => l.variantId === variantId)?.quantity ?? 0) + delta),
    clearError: () => set({ error: null }),
  }
}
