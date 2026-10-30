import { NextResponse } from 'next/server'
import { orderStore, StoredOrder } from '../../../lib/order-store'

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
  if (!Array.isArray(body?.items) || !body.items.length) {
    return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 })
  }

  const order: StoredOrder = {
    id: `PLUG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    customer: {
      name: body.customer?.name || '',
      phone: body.customer?.phone || '',
      area: body.customer?.area || '',
      address: body.customer?.address || '',
      notes: body.customer?.notes || '',
    },
    items: body.items,
    subtotal: Number(body.subtotal) || 0,
    delivery: Number(body.delivery) || 0,
    total: Number(body.total) || 0,
    status: 'received',
    createdAt: new Date().toISOString(),
  }
  orderStore.unshift(order)
  try { await sendOrderNotification(order) } catch (error) { console.error('Order email notification failed', error) }
  return NextResponse.json({ order }, { status: 201 })
}
