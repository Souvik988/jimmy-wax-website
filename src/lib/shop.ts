import { authedApi, publicApi, apiPages } from './api'

export interface Address {
  id: string
  recipientName: string
  phone: string
  line1: string
  landmark: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}
export type AddressInput = Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }

export interface QuoteLine { variantId: string; productId: string; productName: string; variantTitle: string; unitPricePaise: number; quantity: number; lineTotalPaise: number; discountPaise?: number }
export interface Quote {
  id: string
  lines: QuoteLine[]
  subtotalPaise: number
  discountPaise: number
  couponCode: string | null
  shippingPaise: number
  shippingDiscountPaise: number
  codFeePaise: number
  taxPaise: number
  taxInclusive: boolean
  totalPaise: number
  expiresAt: string
}
export interface OrderLine { orderItemId?: number; variantId: string; productId: string; productName: string; variantTitle: string; unitPricePaise: number; quantity: number; lineTotalPaise: number; discountPaise?: number }
export interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: 'cod' | 'online'
  subtotalPaise: number
  discountPaise: number
  couponCode: string | null
  shippingPaise: number
  codFeePaise: number
  taxPaise: number
  totalPaise: number
  address: Record<string, string>
  lines: OrderLine[]
  createdAt: string
}
export interface OrderSummary { id: string; orderNumber: string; status: string; paymentMethod: string; totalPaise: number; createdAt: string }
export interface Shipment { id: string; courier: string; trackingNumber: string; trackingUrl?: string | null; status: string; events: Array<{ status: string; description: string; occurredAt: string }> }

export interface PaymentAttempt {
  id: string
  orderId: string
  status: string
  amountPaise: number
  provider: string
  clientConfig: { orderId: string; keyId: string } | null
}
export interface PaymentState { orderId: string; orderStatus: string; paymentStatus: string }

export const shop = {
  serviceability: (pin: string) => publicApi<{ pin: string; serviceable: boolean | null; deliveryEstimate: string | null }>('GET', `/v1/serviceability/${pin}`),
  addresses: () => authedApi<{ items: Address[] }>('GET', '/v1/addresses').then((r) => r.items),
  addAddress: (a: AddressInput) => authedApi<Address>('POST', '/v1/addresses', a),
  updateAddress: (id:string,a:AddressInput) => authedApi<Address>('PUT','/v1/addresses/'+id,a),
  deleteAddress: (id:string) => authedApi('DELETE','/v1/addresses/'+id),
  quote: (addressId: string, paymentMethod: 'cod' | 'online') => authedApi<Quote>('POST', '/v1/checkout/quotes', { addressId, paymentMethod }),
  placeOrder: (quoteId: string, idempotencyKey: string) => authedApi<Order>('POST', '/v1/orders', { quoteId }, { 'idempotency-key': idempotencyKey }),
  paymentAttempt: (orderId: string) => authedApi<PaymentAttempt>('POST', `/v1/orders/${orderId}/payment-attempts`, {}, { 'idempotency-key': crypto.randomUUID() }),
  paymentState: (orderId: string) => authedApi<PaymentState>('GET', `/v1/orders/${orderId}/payment`),
  orders: () => apiPages<OrderSummary>('/v1/orders?limit=50',true),
  order: (id: string) => authedApi<Order>('GET', `/v1/orders/${id}`),
  shipments: (id: string) => authedApi<{ items: Shipment[] }>('GET', `/v1/orders/${id}/shipments`).then((r) => r.items),
  cancel: (id: string, reason: string) => authedApi<Order>('POST', `/v1/orders/${id}/cancel`, { reason }),
}

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  placed: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Being packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  expired: 'Expired',
}
