import { useEffect, useId, useRef } from 'react'
import { motion } from 'motion/react'
import type { Cart } from '../lib/cart'
import { lockPageScroll } from '../lib/smoothScroll'
import { inr } from '../lib/api'
import type { Product } from '../data/products'
import type { StoreSettings } from '../lib/catalog'

export function CartDrawer({ cart, count, products, settings, error, onClose, onUpdate, onAdd, onCheckout }: {
  cart: Cart
  count: number
  products: Product[]
  settings: StoreSettings | null
  error: string | null
  onClose: () => void
  onUpdate: (variantId: string, delta: number) => void
  onAdd: (product: Product) => void
  onCheckout: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    lockPageScroll(true)
    return () => lockPageScroll(false)
  }, [])
  useEffect(() => { closeRef.current?.focus() }, [])

  const byId = new Map(products.map((p) => [p.id, p]))
  const inCart = new Set(cart.lines.map((line) => line.productId))
  const suggestions = cart.lines.length > 0 && cart.lines.length < products.length
    ? products.filter((p) => !inCart.has(p.id) && p.available).slice(0, 2)
    : []
  const blocked = cart.lines.some((l) => !l.purchasable)
  const paused = settings?.ordersPaused
  const free = settings?.freeShippingThresholdPaise
  const toFree = free != null ? free - cart.subtotalPaise : null

  return (
    <motion.div className="drawer-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}>
      <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Close care list" tabIndex={-1} />
      <motion.aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 320 }}
      >
        <header>
          <p className="kicker">Your selection</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close care list">×</button>
        </header>
        <h2 id={titleId}>Care list <sup>{count}</sup></h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        {cart.lines.length === 0 ? (
          <p className="empty-cart">Your care list is waiting for its first finishing touch.</p>
        ) : (
          <div className="cart-lines">
            {cart.lines.map((line) => {
              const p = byId.get(line.productId)
              return (
                <div className="cart-line" key={line.variantId}>
                  <img src={p?.image ?? '/media/products/collection-still.jpg'} alt="" />
                  <div>
                      <p>{line.variantTitle || p?.format}</p>
                    <h3>{line.name}</h3>
                    {!line.purchasable && <p className="line-warn">{line.available > 0 ? `Only ${line.available} left` : 'Currently unavailable'}</p>}
                    <div className="line-foot">
                      <div className="quantity">
                        <button onClick={() => onUpdate(line.variantId, -1)} aria-label={`Decrease ${line.name} quantity`}>−</button>
                        <output>{line.quantity}</output>
                        <button onClick={() => onUpdate(line.variantId, 1)} aria-label={`Increase ${line.name} quantity`}>+</button>
                      </div>
                      <span className="line-price">{inr(line.unitPricePaise * line.quantity)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="cart-suggest" role="group" aria-label="Complete the ritual">
            <p className="kicker">Complete the ritual</p>
            {suggestions.map((p) => (
              <div className="cart-suggest-row" key={p.id}>
                <img src={p.image} alt="" />
                <div>
                  <h4>{p.name}</h4>
                  <p>{inr(p.pricePaise)}</p>
                </div>
                <button type="button" onClick={() => onAdd(p)} aria-label={`Add ${p.name} to care list`}>+</button>
              </div>
            ))}
          </div>
        )}
        {cart.lines.length > 0 && (
          <div className="cart-total">
            <div className="row"><span>Subtotal</span><strong>{inr(cart.subtotalPaise)}</strong></div>
            <small>
              Prices include GST. Shipping{settings ? ` (${inr(settings.shippingFeePaise)}${free != null ? `, free from ${inr(free)}` : ''})` : ''} and any Cash on Delivery fee are shown at checkout.
              {toFree != null && toFree > 0 && toFree < 100000 ? ` Add ${inr(toFree)} more for free shipping.` : ''}
            </small>
            {paused && <p className="form-error" role="status">{settings?.pauseMessage || 'Orders are paused for a short while.'}</p>}
            <button className="solid-button wide" type="button" disabled={blocked || !!paused} onClick={onCheckout}>
              Checkout <span className="arr" aria-hidden="true">↗</span>
            </button>
            {blocked && <small>Please fix the items marked above to continue.</small>}
          </div>
        )}
        <footer>Cash on Delivery is available. Delivery {settings?.deliveryEstimate ? `in ${settings.deliveryEstimate}` : 'timing is shown at checkout'}.</footer>
      </motion.aside>
    </motion.div>
  )
}
