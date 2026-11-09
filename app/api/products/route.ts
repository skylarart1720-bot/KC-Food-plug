import { NextResponse } from 'next/server'
import { productStore, Product, hydrateCatalog, persistCatalog } from '../../../lib/catalog-store'

export async function GET() {
  await hydrateCatalog()
  return NextResponse.json({ products: productStore })
}

export async function POST(request: Request) {
  await hydrateCatalog()
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.image || !['KFC', 'Chickenman'].includes(body.restaurant)) return NextResponse.json({ error: 'Name, image and restaurant are required.' }, { status: 400 })
  const product: Product = { id: `product-${Date.now()}`, name: String(body.name).trim(), description: String(body.description || '').trim(), price: Number(body.price) || 0, restaurant: body.restaurant, category: body.category ? String(body.category).trim() : undefined, image: String(body.image), badge: body.badge ? String(body.badge).trim() : undefined, active: body.active !== false }
  productStore.unshift(product)
  await persistCatalog()
  return NextResponse.json({ product }, { status: 201 })
}
