import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ApiError, inr, session } from '../lib/api'
import { applyCoupon, loadCart, removeCoupon, useCart } from '../lib/cart'
import { useCatalog } from '../lib/catalog'
import { redirectToHostedCheckout } from '../lib/payment'
import { shop, type Address, type AddressInput, type Quote } from '../lib/shop'

const BLANK: AddressInput = { recipientName: '', phone: '', line1: '', landmark: '', city: '', state: '', postalCode: '' }

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')

export function AddressForm({ onSaved, onCancel, initial }: { onSaved: (a: Address) => void; onCancel?: () => void; initial?:Address }) {
  const [a, setA] = useState<AddressInput>(()=>initial?{recipientName:initial.recipientName,phone:initial.phone,line1:initial.line1,landmark:initial.landmark,city:initial.city,state:initial.state,postalCode:initial.postalCode,isDefault:initial.isDefault}:BLANK)
  const [pin, setPin] = useState<{ ok: boolean | null; est: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const f = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) => setA((c) => ({ ...c, [k]: e.target.value }))

  useEffect(() => {
    setPin(null)
    if (!/^[1-9]\d{5}$/.test(a.postalCode)) return
    let live = true
    shop.serviceability(a.postalCode).then((r) => { if (live) setPin({ ok: r.serviceable, est: r.deliveryEstimate }) }).catch(() => { if (live) setPin({ ok: null, est: null }) })
    return () => { live = false }
  }, [a.postalCode])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    try { onSaved(await (initial?shop.updateAddress(initial.id,a):shop.addAddress({ ...a, isDefault: true }))) } catch (x) { setErr(msg(x)) } finally { setBusy(false) }
  }
  return (
    <form className="co-form" onSubmit={save}>
      <label className="field"><span>Full name</span><input required autoComplete="name" value={a.recipientName} onChange={f('recipientName')} /></label>
      <label className="field"><span>Mobile number</span><input required inputMode="tel" autoComplete="tel" value={a.phone} onChange={f('phone')} /></label>
      <label className="field"><span>Address</span><input required autoComplete="address-line1" value={a.line1} onChange={f('line1')} /></label>
      <label className="field"><span>Landmark (optional)</span><input value={a.landmark} onChange={f('landmark')} /></label>
      <div className="field-grid">
        <label className="field"><span>City</span><input required autoComplete="address-level2" value={a.city} onChange={f('city')} /></label>
        <label className="field"><span>State</span><input required autoComplete="address-level1" value={a.state} onChange={f('state')} /></label>
        <label className="field"><span>PIN code</span><input required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={a.postalCode} onChange={f('postalCode')} /></label>
      </div>
      {pin?.ok === true && <p className="pin-ok" role="status">We deliver here{pin.est ? ` · ${pin.est}` : ''}.</p>}
      {pin?.ok === false && <p className="form-error" role="status">We do not deliver to this PIN code yet.</p>}
      {pin?.ok === null && <p className="auth-note">We could not confirm delivery to this PIN yet; we will check again at the next step.</p>}
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="co-actions">
        <button className="solid-button" type="submit" disabled={busy || pin?.ok === false}>{busy ? 'Saving…' : 'Save address'}</button>
        {onCancel && <button className="link-button" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export function Checkout({ onNavigate, onSignIn }: { onNavigate: (p: string) => void; onSignIn: (reason: string) => void }) {
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn)
  const { cart } = useCart()
  const { settings, products } = useCatalog()
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [addressId, setAddressId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteErr, setQuoteErr] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [method, setMethod] = useState<'cod' | 'online'>('cod')
  const [placing, setPlacing] = useState(false)
  const [placeErr, setPlaceErr] = useState<string | null>(null)
  // One idempotency key per quote: a retry after a network failure can never create a second order.
  const key = useRef<{ quoteId: string; value: string } | null>(null)
  const byId = new Map(products.map((p) => [p.id, p]))

  useEffect(() => {
    if (!signedIn) { setAddresses(null); return }
    let live = true
    shop.addresses().then((list) => {
      if (!live) return
      setAddresses(list)
      setAddressId((cur) => cur ?? list.find((x) => x.isDefault)?.id ?? list[0]?.id ?? null)
      if (list.length === 0) setAdding(true)
    }).catch((e) => { if (live) setQuoteErr(msg(e)) })
    return () => { live = false }
  }, [signedIn])

  // If Cash on Delivery is switched off but online payment is on, start on the only available option.
  useEffect(() => { if (settings && !settings.codEnabled && settings.onlinePaymentsEnabled) setMethod('online') }, [settings])

  const requote = useCallback(async () => {
    if (!signedIn || !addressId || cart.lines.length === 0) { setQuote(null); return }
    setQuoting(true); setQuoteErr(null)
    try { setQuote(await shop.quote(addressId, method)) } catch (e) { setQuote(null); setQuoteErr(msg(e)) } finally { setQuoting(false) }
  }, [signedIn, addressId, method, cart.lines.length, cart.version, cart.couponCode])
  useEffect(() => { void requote() }, [requote])

  const doCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponMsg(null)
    try { await applyCoupon(coupon.trim()); setCoupon('') } catch (x) { setCouponMsg(msg(x)) }
  }
  const dropCoupon = async () => { setCouponMsg(null); try { await removeCoupon() } catch (x) { setCouponMsg(msg(x)) } }

  const place = async () => {
    if (!quote) return
    if (key.current?.quoteId !== quote.id) key.current = { quoteId: quote.id, value: crypto.randomUUID() }
    setPlacing(true); setPlaceErr(null)
    try {
      const order = await shop.placeOrder(quote.id, key.current.value)
      await loadCart()
      if (method === 'online') {
        // The order now holds the stock for a short window; hand the customer to the hosted payment page.
        try {
          const attempt = await shop.paymentAttempt(order.id)
          const address = addresses?.find((a) => a.id === addressId)
          if (!attempt.clientConfig) throw new Error('no payment configuration')
          redirectToHostedCheckout({
            keyId: attempt.clientConfig.keyId,
            providerOrderId: attempt.clientConfig.orderId,
            orderId: order.id,
            brandName: settings?.brandName ?? 'JIMMY & WAX',
            description: `Order ${order.orderNumber}`,
            prefill: { name: address?.recipientName, contact: address?.phone, email: session.user()?.email ?? undefined },
          })
          return
        } catch {
          // The order exists and is awaiting payment: the order page offers "Complete payment" again.
          onNavigate(`/orders/${order.id}?pay=retry`)
          return
        }
      }
      onNavigate(`/orders/${order.id}?placed=1`)
    } catch (e) {
      setPlaceErr(msg(e))
      // The cart or prices may have changed under us: fetch a fresh quote.
      if (e instanceof ApiError && ['QUOTE_EXPIRED', 'QUOTE_STALE', 'CART_VERSION_CONFLICT', 'STOCK_SHORTAGE', 'ITEM_UNAVAILABLE'].includes(e.code)) void requote()
    } finally { setPlacing(false) }
  }

  if (cart.lines.length === 0 && !placing) {
    return (
      <section className="checkout">
        <h1>Checkout</h1>
        <p className="empty-cart">Your care list is empty.</p>
        <button className="solid-button" type="button" onClick={() => onNavigate('/shop')}>Browse the collection</button>
      </section>
    )
  }

  return (
    <section className="checkout">
      <button className="back-link" type="button" onClick={() => onNavigate('/shop')}>← Keep shopping</button>
      <h1>Checkout</h1>
      {settings?.ordersPaused && <p className="form-error" role="status">{settings.pauseMessage || 'Orders are paused for a short while. Please check back soon.'}</p>}
      <div className="checkout-grid">
        <div className="checkout-main">
          <div className="co-step">
            <h2><span>1</span> Your account</h2>
            {signedIn ? <p className="auth-note">Signed in as {session.user()?.phone ?? session.user()?.email}.</p> : (
              <>
                <p className="auth-note">Sign in to save your address and track your order. Your care list comes with you.</p>
                <button className="solid-button" type="button" onClick={() => onSignIn('Sign in to place your order.')}>Sign in or create account</button>
              </>
            )}
          </div>

          {signedIn && (
            <div className="co-step">
              <h2><span>2</span> Delivery address</h2>
              {addresses === null ? <p className="auth-note">Loading…</p> : (
                <>
                  {addresses.map((a) => (
                    <label className={`co-address${addressId === a.id ? ' is-selected' : ''}`} key={a.id}>
                      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                      <span><strong>{a.recipientName}</strong> · {a.phone}<br />{a.line1}{a.landmark ? `, ${a.landmark}` : ''}<br />{a.city}, {a.state} {a.postalCode}</span>
                    </label>
                  ))}
                  {adding
                    ? <AddressForm onCancel={addresses.length ? () => setAdding(false) : undefined} onSaved={(a) => { setAddresses((l) => [a, ...(l ?? [])]); setAddressId(a.id); setAdding(false) }} />
                    : <button className="link-button" type="button" onClick={() => setAdding(true)}>+ Add a new address</button>}
                </>
              )}
            </div>
          )}

          {signedIn && (
            <div className="co-step">
              <h2><span>3</span> Payment</h2>
              {settings?.onlinePaymentsEnabled && (
                <label className={`co-address${method === 'online' ? ' is-selected' : ''}`}>
                  <input type="radio" name="payment" checked={method === 'online'} onChange={() => setMethod('online')} />
                  <span><strong>Pay online</strong><br />UPI, cards, netbanking and wallets on Razorpay&rsquo;s secure page. You will return here after paying.</span>
                </label>
              )}
              {settings?.codEnabled
                ? <label className={`co-address${method === 'cod' || !settings?.onlinePaymentsEnabled ? ' is-selected' : ''}`}><input type="radio" name="payment" checked={method === 'cod' || !settings?.onlinePaymentsEnabled} onChange={() => setMethod('cod')} /><span><strong>Cash on Delivery</strong><br />Pay when your order arrives. A {inr(settings.codFeePaise)} handling fee applies.</span></label>
                : <p className="form-error">Cash on Delivery is not available right now.</p>}
              {!settings?.onlinePaymentsEnabled && <p className="auth-note">Online payment (UPI / cards) is coming soon.</p>}
            </div>
          )}
        </div>

        <aside className="checkout-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          {cart.lines.map((l) => (
            <div className="sum-line" key={l.variantId}>
              <img src={byId.get(l.productId)?.image ?? ''} alt="" />
                <span>{l.name}<small>{l.variantTitle} · × {l.quantity}</small></span>
              <strong>{inr(l.unitPricePaise * l.quantity)}</strong>
            </div>
          ))}
          {signedIn && (
            cart.couponCode ? (
              <p className="coupon-on">Code <strong>{cart.couponCode}</strong> applied <button className="link-button" type="button" onClick={() => void dropCoupon()}>Remove</button></p>
            ) : (
              <form className="coupon-form" onSubmit={(e) => void doCoupon(e)}>
                <input aria-label="Coupon code" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
                <button type="submit" disabled={coupon.trim().length < 3}>Apply</button>
              </form>
            )
          )}
          {couponMsg && <p className="form-error" role="alert">{couponMsg}</p>}

          {quote ? (
            <dl className="sum-totals">
              <div><dt>Subtotal</dt><dd>{inr(quote.subtotalPaise)}</dd></div>
              {quote.discountPaise > 0 && <div><dt>Discount{quote.couponCode ? ` (${quote.couponCode})` : ''}</dt><dd>−{inr(quote.discountPaise)}</dd></div>}
              <div><dt>Shipping</dt><dd>{quote.shippingPaise === 0 ? 'Free' : inr(quote.shippingPaise)}</dd></div>
              {quote.codFeePaise > 0 && <div><dt>Cash on Delivery fee</dt><dd>{inr(quote.codFeePaise)}</dd></div>}
              <div className="grand"><dt>Total</dt><dd>{inr(quote.totalPaise)}</dd></div>
              <small>Includes {inr(quote.taxPaise)} GST.</small>
            </dl>
          ) : (
            <p className="auth-note">{quoting ? 'Calculating…' : signedIn ? 'Choose a delivery address to see your total.' : 'Sign in to see shipping and your total.'}</p>
          )}
          {quoteErr && <p className="form-error" role="alert">{quoteErr}</p>}
          {placeErr && <p className="form-error" role="alert">{placeErr}</p>}
          <button className="solid-button wide" type="button" disabled={!quote || placing || quoting || !!settings?.ordersPaused} onClick={() => void place()}>
            {placing ? (method === 'online' ? 'Taking you to payment…' : 'Placing order…') : quote ? `${method === 'online' ? 'Pay' : 'Place order'} · ${inr(quote.totalPaise)}` : method === 'online' ? 'Pay online' : 'Place order'}
          </button>
          <small className="legal">By placing this order you agree to our <a href="/policies/terms">terms</a>. Read our <a href="/policies/privacy">privacy</a>, <a href="/policies/shipping">shipping</a> and <a href="/policies/returns">return policies</a>.</small>
        </aside>
      </div>
    </section>
  )
}
