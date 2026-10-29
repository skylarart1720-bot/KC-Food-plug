import { NextResponse } from 'next/server'
import { orderStore } from '../../../lib/order-store'

export async function GET() {
  return NextResponse.json({
    orders: orderStore,
    activeProducts: 6,
    awaitingConfirmation: orderStore.filter((order) => order.status === 'received').length,
    estimatedSales: orderStore.reduce((sum, order) => sum + order.total, 0),
    email: 'bayiviellajude1738quansavage@gmail.com',
  })
}

