import { NextResponse } from 'next/server'
import { categoryStore, Category, hydrateCatalog, persistCatalog } from '../../../lib/catalog-store'

export async function GET() {
  await hydrateCatalog()
  return NextResponse.json({ categories: categoryStore })
}

export async function POST(request: Request) {
  await hydrateCatalog()
  const body = await request.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 })
  const id = String(body.id || body.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `category-${Date.now()}`
  if (categoryStore.some((category) => category.id === id)) return NextResponse.json({ error: 'A category with that name already exists.' }, { status: 409 })
  const category: Category = { id, name: String(body.name).trim(), description: String(body.description || '').trim(), image: String(body.image || ''), restaurant: 'Both', badge: body.badge ? String(body.badge).trim() : undefined, active: body.active !== false }
  categoryStore.unshift(category)
  await persistCatalog()
  return NextResponse.json({ category }, { status: 201 })
}
