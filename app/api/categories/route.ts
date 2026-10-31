import { NextResponse } from 'next/server'
import { categoryStore, Category } from '../../../lib/catalog-store'

export async function GET() {
  return NextResponse.json({ categories: categoryStore })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.image || !['KFC', 'Chickenman', 'Both'].includes(body.restaurant)) return NextResponse.json({ error: 'Name, image and restaurant are required.' }, { status: 400 })
  const id = String(body.id || body.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `category-${Date.now()}`
  if (categoryStore.some((category) => category.id === id)) return NextResponse.json({ error: 'A category with that name already exists.' }, { status: 409 })
  const category: Category = { id, name: String(body.name).trim(), description: String(body.description || '').trim(), image: String(body.image), restaurant: body.restaurant, badge: body.badge ? String(body.badge).trim() : undefined, active: body.active !== false }
  categoryStore.unshift(category)
  return NextResponse.json({ category }, { status: 201 })
}
