import { NextResponse } from 'next/server'
import { orderStore, StoredOrder } from '../../../lib/order-store'

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
    customer: body.customer,
    items: body.items,
    subtotal: Number(body.subtotal) || 0,
    delivery: Number(body.delivery) || 0,
    total: Number(body.total) || 0,
    status: 'received',
    createdAt: new Date().toISOString(),
  }
  orderStore.unshift(order)
  return NextResponse.json({ order }, { status: 201 })
}
