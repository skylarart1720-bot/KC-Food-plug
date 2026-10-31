import { NextResponse } from 'next/server'
import { productStore, Product } from '../../../lib/catalog-store'

export async function GET() {
  return NextResponse.json({ products: productStore })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.image || !['KFC', 'Chickenman'].includes(body.restaurant)) return NextResponse.json({ error: 'Name, image and restaurant are required.' }, { status: 400 })
  const product: Product = { id: `product-${Date.now()}`, name: String(body.name).trim(), description: String(body.description || '').trim(), price: Number(body.price) || 0, restaurant: body.restaurant, category: String(body.category || 'Meals').trim(), image: String(body.image), badge: body.badge ? String(body.badge).trim() : undefined, active: body.active !== false }
  productStore.unshift(product)
  return NextResponse.json({ product }, { status: 201 })
}
