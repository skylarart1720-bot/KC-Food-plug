export type OrderStatus = 'received' | 'processed' | 'delivered' | 'cancelled'

export type StoredOrder = {
  id: string
  customer: { name: string; phone: string; area: string; address: string; notes?: string }
  items: Array<{ id: string; name: string; restaurant: string; quantity: number; price: number }>
  subtotal: number
  delivery: number
  total: number
  status: OrderStatus
  createdAt: string
}

const globalStore = globalThis as typeof globalThis & { plugOrders?: StoredOrder[] }
export const orderStore = globalStore.plugOrders ?? (globalStore.plugOrders = [])

