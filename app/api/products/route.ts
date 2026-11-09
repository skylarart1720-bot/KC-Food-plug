import { NextResponse } from 'next/server'
import { productStore, Product, hydrateCatalog, mutateCatalog } from '../../../lib/catalog-store'

export async function GET() {
  await hydrateCatalog()
  return NextResponse.json({ products: productStore })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.image || !['KFC', 'Chickenman'].includes(body.restaurant)) return NextResponse.json({ error: 'Name, image and restaurant are required.' }, { status: 400 })
  return mutateCatalog(() => {
    const product: Product = { id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: String(body.name).trim(), description: String(body.description || '').trim(), price: Number(body.price) || 0, restaurant: body.restaurant, category: body.category ? String(body.category).trim() : undefined, image: String(body.image), badge: body.badge ? String(body.badge).trim() : undefined, active: body.active !== false }
    productStore.unshift(product)
    return NextResponse.json({ product }, { status: 201 })
  })
}
