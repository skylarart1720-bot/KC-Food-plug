import { NextResponse } from 'next/server'
import { restaurantStore, RestaurantRecord } from '../../../lib/admin-store'

export async function GET() { return NextResponse.json({ restaurants: restaurantStore }) }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'Restaurant name is required.' }, { status: 400 })
  const restaurant: RestaurantRecord = { id: `restaurant-${Date.now()}`, name: String(body.name), description: String(body.description || ''), active: body.active !== false }
  restaurantStore.push(restaurant)
  return NextResponse.json({ restaurant }, { status: 201 })
}
