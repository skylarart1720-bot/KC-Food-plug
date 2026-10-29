import { NextResponse } from 'next/server'
import { orderStore } from '../../../lib/order-store'

export async function GET() {
  const today = new Date().toDateString()
  const ordersToday = orderStore.filter((order) => new Date(order.createdAt).toDateString() === today)
  return NextResponse.json({
    orders: orderStore,
    ordersToday: ordersToday.length,
    awaitingConfirmation: orderStore.filter((order) => order.status === 'received').length,
    estimatedSales: orderStore.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0),
    activeProducts: 6,
  })
}

