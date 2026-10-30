import { NextResponse } from 'next/server'
import { restaurantStore } from '../../../../lib/admin-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const restaurant = restaurantStore.find((item) => item.id === id)
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 })
  Object.assign(restaurant, body)
  return NextResponse.json({ restaurant })
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = restaurantStore.findIndex((item) => item.id === id)
  if (index < 0) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 })
  restaurantStore.splice(index, 1)
  return NextResponse.json({ ok: true })
}
