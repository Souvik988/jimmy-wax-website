import { useEffect, useState, useSyncExternalStore } from 'react'
import { ApiError, inr, session } from '../lib/api'
import { redirectToHostedCheckout } from '../lib/payment'
import { STATUS_LABEL, shop, type Order, type OrderSummary, type Shipment } from '../lib/shop'
import {PostPurchase} from '../components/PostPurchase'

const when = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')

function SignInPrompt({ onSignIn }: { onSignIn: (r: string) => void }) {
  return (
    <section className="checkout">
      <h1>Your orders</h1>
      <p className="auth-note">Sign in to see your orders and track deliveries.</p>
      <button className="solid-button" type="button" onClick={() => onSignIn('Sign in to see your orders.')}>Sign in</button>
    </section>
  )
}

export function Orders({ onNavigate, onSignIn }: { onNavigate: (p: string) => void; onSignIn: (r: string) => void }) {
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn)
  const [items, setItems] = useState<OrderSummary[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    if (!signedIn) return
    let live = true
    shop.orders().then((r) => { if (live) setItems(r) }).catch((e) => { if (live) setErr(msg(e)) })
    return () => { live = false }
  }, [signedIn])
  if (!signedIn) return <SignInPrompt onSignIn={onSignIn} />
  return (
    <section className="checkout">
      <h1>Your orders</h1>
      {err && <p className="form-error" role="alert">{err}</p>}
      {items === null && !err && <p className="auth-note">Loading…</p>}
      {items?.length === 0 && (<><p className="empty-cart">No orders yet.</p><button className="solid-button" type="button" onClick={() => onNavigate('/shop')}>Start shopping</button></>)}
      <div className="order-list">
        {items?.map((o) => (
          <button className="order-row" type="button" key={o.id} onClick={() => onNavigate(`/orders/${o.id}`)}>
            <span><strong>{o.orderNumber}</strong><small>{when(o.createdAt)}</small></span>
            <span className="order-status">{STATUS_LABEL[o.status] ?? o.status}</span>
            <span>{inr(o.totalPaise)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function OrderDetail({ id, placed, onNavigate, onSignIn }: { id: string; placed: boolean; onNavigate: (p: string) => void; onSignIn: (r: string) => void }) {
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn)
  const [order, setOrder] = useState<Order | null>(null)
  const [ships, setShips] = useState<Shipment[]>([])
  const [shipmentError,setShipmentError]=useState<string|null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)
  // Where the customer came back from: the API redirects here with ?pay=paid|pending|failed, or the provider's cancel link sends ?pay=cancelled.
  const pay = new URLSearchParams(window.location.search).get('pay')
  const awaiting = !!order && order.status === 'pending_payment' && order.paymentMethod === 'online'
  useEffect(() => {
    if (!signedIn) return
    let live = true
    shop.order(id).then((o) => { if (live) setOrder(o) }).catch((e) => { if (live) setErr(msg(e)) })
    setShipmentError(null)
    shop.shipments(id).then((s) => { if (live) setShips(s) }).catch(e=>{if(live)setShipmentError(msg(e))})
    return () => { live = false }
  }, [id, signedIn])
  // While the provider confirmation is still arriving, re-read the server-confirmed state (never trust the redirect alone).
  useEffect(() => {
    if (!signedIn || !awaiting || pay !== 'pending') return
    let live = true
    let tries = 0
    const timer = window.setInterval(() => {
      tries += 1
      shop.paymentState(id).then((p) => {
        if (!live) return
        if (p.paymentStatus === 'paid' || tries >= 20) { window.clearInterval(timer); shop.order(id).then((o) => { if (live) setOrder(o) }).catch(() => {}) }
      }).catch(() => {})
    }, 3000)
    return () => { live = false; window.clearInterval(timer) }
  }, [signedIn, awaiting, pay, id])

  if (!signedIn) return <SignInPrompt onSignIn={onSignIn} />
  if (err) return <section className="checkout"><p className="form-error" role="alert">{err}</p><button className="link-button" type="button" onClick={() => onNavigate('/orders')}>All orders</button></section>
  if (!order) return <section className="checkout"><p className="auth-note">Loading…</p></section>

  const cancellable = ['pending_payment', 'placed'].includes(order.status)
  const completePayment = async () => {
    setPaying(true); setErr(null)
    try {
      const attempt = await shop.paymentAttempt(order.id)
      if (!attempt.clientConfig) throw new Error('no payment configuration')
      redirectToHostedCheckout({
        keyId: attempt.clientConfig.keyId,
        providerOrderId: attempt.clientConfig.orderId,
        orderId: order.id,
        brandName: 'JIMMY & WAX',
        description: `Order ${order.orderNumber}`,
        prefill: { name: order.address.name, contact: order.address.phone, email: session.user()?.email ?? undefined },
      })
    } catch (e) { setErr(msg(e)); setPaying(false) }
  }
  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return
    setCancelling(true)
    try { setOrder(await shop.cancel(order.id, 'Cancelled by customer')) } catch (e) { setErr(msg(e)) } finally { setCancelling(false) }
  }
  return (
    <section className="checkout">
      {placed && (
        <div className="placed-banner" role="status">
          <h2>Thank you — your order is placed.</h2>
          <p>Order {order.orderNumber}. {order.paymentMethod === 'cod' ? `Please keep ${inr(order.totalPaise)} ready for Cash on Delivery.` : order.paymentStatus === 'paid' ? 'Your payment was received.' : ''}</p>
        </div>
      )}
      {awaiting && pay === 'pending' && <p className="auth-note" role="status">We are confirming your payment with the bank. This page updates by itself; please do not pay again.</p>}
      {awaiting && (pay === 'failed' || pay === 'cancelled') && <p className="form-error" role="alert">{pay === 'cancelled' ? 'Payment was cancelled.' : 'We could not confirm your payment.'} Your order is held for a short while; you can try again below.</p>}
      {awaiting && (
        <div className="co-step">
          <h2>Complete your payment</h2>
          <p className="auth-note">Your items are reserved for a short time. Pay {inr(order.totalPaise)} securely on Razorpay&rsquo;s page (UPI, cards, netbanking).</p>
          <button className="solid-button" type="button" disabled={paying} onClick={() => void completePayment()}>{paying ? 'Taking you to payment…' : `Complete payment · ${inr(order.totalPaise)}`}</button>
        </div>
      )}
      <button className="back-link" type="button" onClick={() => onNavigate('/orders')}>← All orders</button>
      <h1>{order.orderNumber}</h1>
      <p className="order-status big">{STATUS_LABEL[order.status] ?? order.status}</p>
      <PostPurchase order={order}/>
      {shipmentError&&<p className="form-error" role="alert">Tracking could not be loaded: {shipmentError} <button className="link-button" onClick={()=>{setShipmentError(null);void shop.shipments(id).then(setShips).catch(e=>setShipmentError(msg(e)))}}>Retry tracking</button></p>}
      <div className="checkout-grid">
        <div className="checkout-main">
          <div className="co-step">
            <h2>Items</h2>
            {order.lines.map((l) => (
              <div className="sum-line" key={l.variantId}><span>{l.productName}<small>{l.variantTitle} · × {l.quantity}</small></span><strong>{inr(l.lineTotalPaise)}</strong></div>
            ))}
          </div>
          <div className="co-step">
            <h2>Delivery</h2>
            <p>{order.address.name} · {order.address.phone}<br />{order.address.address}{order.address.landmark ? `, ${order.address.landmark}` : ''}<br />{order.address.city}, {order.address.state} {order.address.pin}</p>
            {ships.map((s) => (
              <div className="ship" key={s.id}>
                <p><strong>{s.courier}</strong> · {s.trackingNumber}{s.trackingUrl ? <> · <a href={s.trackingUrl} target="_blank" rel="noreferrer noopener">Track</a></> : null}</p>
                <ul>{s.events.map((e, i) => <li key={i}>{when(e.occurredAt)} — {e.description || e.status}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
        <aside className="checkout-summary">
          <h2>Payment</h2>
          <dl className="sum-totals">
            <div><dt>Subtotal</dt><dd>{inr(order.subtotalPaise)}</dd></div>
            {order.discountPaise > 0 && <div><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd>−{inr(order.discountPaise)}</dd></div>}
            <div><dt>Shipping</dt><dd>{order.shippingPaise === 0 ? 'Free' : inr(order.shippingPaise)}</dd></div>
            {order.codFeePaise > 0 && <div><dt>Cash on Delivery fee</dt><dd>{inr(order.codFeePaise)}</dd></div>}
            <div className="grand"><dt>Total</dt><dd>{inr(order.totalPaise)}</dd></div>
            <small>Includes {inr(order.taxPaise)} GST · {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'}</small>
          </dl>
          {cancellable && <button className="link-button" type="button" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? 'Cancelling…' : 'Cancel order'}</button>}
        </aside>
      </div>
    </section>
  )
}
