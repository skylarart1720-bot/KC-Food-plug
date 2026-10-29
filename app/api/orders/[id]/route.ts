import { NextResponse } from 'next/server'
import { orderStore, OrderStatus } from '../../../../lib/order-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const allowed: OrderStatus[] = ['received', 'processed', 'delivered', 'cancelled']
  if (!allowed.includes(body?.status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  const order = orderStore.find((item) => item.id === id)
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  order.status = body.status
  return NextResponse.json({ order })
}

