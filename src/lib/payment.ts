import { API_ORIGIN } from './api'

/**
 * Online payment uses Razorpay's HOSTED checkout (a full-page redirect), not their checkout.js: this site keeps the
 * customer's refresh token in localStorage and must not run third-party scripts on its own origin (see lib/api.ts).
 *
 * Flow: we POST a form to Razorpay -> the customer pays on Razorpay's page -> Razorpay POSTs the result to our API
 * (`/v1/payments/razorpay/return`), which verifies it server-side and 303-redirects back to /orders/<id>.
 * Success is never decided here: the order page reads the server-confirmed state.
 */
const HOSTED_CHECKOUT_URL = 'https://api.razorpay.com/v1/checkout/embedded'

export interface HostedCheckoutInput {
  keyId: string
  providerOrderId: string
  orderId: string
  brandName: string
  description: string
  prefill: { name?: string; contact?: string; email?: string }
}

export function redirectToHostedCheckout(input: HostedCheckoutInput): void {
  const fields: Record<string, string> = {
    key_id: input.keyId,
    order_id: input.providerOrderId,
    name: input.brandName,
    description: input.description,
    callback_url: `${API_ORIGIN}/v1/payments/razorpay/return`,
    cancel_url: `${window.location.origin}/orders/${input.orderId}?pay=cancelled`,
  }
  if (input.prefill.name) fields['prefill[name]'] = input.prefill.name
  if (input.prefill.contact) fields['prefill[contact]'] = input.prefill.contact
  if (input.prefill.email) fields['prefill[email]'] = input.prefill.email

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = HOSTED_CHECKOUT_URL
  for (const [name, value] of Object.entries(fields)) {
    const el = document.createElement('input')
    el.type = 'hidden'
    el.name = name
    el.value = value
    form.appendChild(el)
  }
  document.body.appendChild(form)
  form.submit()
}
