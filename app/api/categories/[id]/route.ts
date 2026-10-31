import { NextResponse } from 'next/server'
import { categoryStore } from '../../../../lib/catalog-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const category = categoryStore.find((item) => item.id === id)
  if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
  if (body?.restaurant !== undefined && !['KFC', 'Chickenman', 'Both'].includes(body.restaurant)) return NextResponse.json({ error: 'Restaurant must be KFC, Chickenman or Both.' }, { status: 400 })
  if (body?.name !== undefined) category.name = String(body.name).trim()
  if (body?.description !== undefined) category.description = String(body.description).trim()
  if (body?.image !== undefined) category.image = String(body.image)
  if (body?.restaurant !== undefined) category.restaurant = body.restaurant
  if (body?.badge !== undefined) category.badge = body.badge ? String(body.badge).trim() : undefined
  if (body?.active !== undefined) category.active = Boolean(body.active)
  if (!category.name || !category.image) return NextResponse.json({ error: 'Name and image are required.' }, { status: 400 })
  return NextResponse.json({ category })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = categoryStore.findIndex((item) => item.id === id)
  if (index < 0) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
  categoryStore.splice(index, 1)
  return NextResponse.json({ ok: true })
}
