import { NextResponse } from 'next/server'
import { orderStore, StoredOrder } from '../../../lib/order-store'
import { productStore } from '../../../lib/catalog-store'

const clean = (value: unknown, max: number) => String(value || '').trim().slice(0, max)
const deliveryFee = (itemCount: number) => itemCount <= 0 ? 0 : itemCount === 1 ? 20 : itemCount === 2 ? 40 : itemCount === 3 ? 50 : itemCount * 20

async function sendOrderNotification(order: StoredOrder) {
  const apiKey = process.env.RESEND_API_KEY
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL
  const sender = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !recipient || !sender) return

  const itemLines = order.items.map((item) => `${item.name} ×${item.quantity} — GH₵ ${item.price.toFixed(2)}`).join('<br />')
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject: `New food order ${order.id}`,
      html: `<h2>New food order ${order.id}</h2><p><strong>Customer:</strong> ${order.customer.name || 'Not provided'}</p><p><strong>Phone:</strong> ${order.customer.phone || 'Not provided'}</p><p><strong>Area:</strong> ${order.customer.area || 'Not provided'}</p><p><strong>Address:</strong> ${order.customer.address || 'Not provided'}</p><p><strong>Items:</strong><br />${itemLines}</p><p><strong>Total:</strong> GH₵ ${order.total.toFixed(2)}</p><p><strong>Notes:</strong> ${order.customer.notes || 'None'}</p>`,
    }),
  })
}

export async function GET() {
  return NextResponse.json({ orders: orderStore })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!Array.isArray(body?.items) || !body.items.length || body.items.length > 50) {
    return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 })
  }

  const items = body.items.map((item: unknown) => {
    const requested = item as { id?: unknown; quantity?: unknown }
    const product = productStore.find((candidate) => candidate.id === requested.id && candidate.active)
    const quantity = Math.floor(Number(requested.quantity))
    if (!product || !Number.isFinite(quantity) || quantity < 1 || quantity > 20) return null
    return { id: product.id, name: product.name, restaurant: product.restaurant, quantity, price: product.price }
  })
  if (items.some((item: StoredOrder['items'][number] | null) => !item)) return NextResponse.json({ error: 'One or more order items are invalid or unavailable.' }, { status: 400 })
  const verifiedItems = items as StoredOrder['items']
  const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const delivery = deliveryFee(verifiedItems.reduce((sum, item) => sum + item.quantity, 0))

  const order: StoredOrder = {
    id: `PLUG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    customer: {
      name: clean(body.customer?.name, 100),
      phone: clean(body.customer?.phone, 40),
      area: clean(body.customer?.area, 100),
      address: clean(body.customer?.address, 240),
      notes: clean(body.customer?.notes, 500),
    },
    items: verifiedItems,
    subtotal,
    delivery,
    total: subtotal + delivery,
    status: 'received',
    createdAt: new Date().toISOString(),
  }
  orderStore.unshift(order)
  try { await sendOrderNotification(order) } catch (error) { console.error('Order email notification failed', error) }
  const receiptToken = Buffer.from(JSON.stringify(order), 'utf8').toString('base64url')
  return NextResponse.json({ order, receiptToken }, { status: 201 })
}
