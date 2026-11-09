import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { productStore, mutateCatalog } from '../../../../lib/catalog-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  return mutateCatalog(() => {
    const product = productStore.find((item) => item.id === id)
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    if (body?.restaurant !== undefined && !['KFC', 'Chickenman'].includes(body.restaurant)) return NextResponse.json({ error: 'Restaurant must be KFC or Chickenman.' }, { status: 400 })
    if (body?.name !== undefined) product.name = String(body.name).trim()
    if (body?.description !== undefined) product.description = String(body.description).trim()
    if (body?.restaurant !== undefined) product.restaurant = body.restaurant
    if (body?.category !== undefined) product.category = body.category ? String(body.category).trim() : undefined
    if (body?.image !== undefined) product.image = String(body.image)
    if (body?.badge !== undefined) product.badge = body.badge ? String(body.badge).trim() : undefined
    if (body?.active !== undefined) product.active = Boolean(body.active)
    if (body?.price !== undefined) product.price = Number(body.price) || 0
    if (!product.name || !product.image) return NextResponse.json({ error: 'Name and image are required.' }, { status: 400 })
    return NextResponse.json({ product })
  })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return mutateCatalog(async () => {
    const index = productStore.findIndex((item) => item.id === id)
    if (index < 0) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    const product = productStore[index]
    productStore.splice(index, 1)
    if (product.image.includes('.blob.vercel-storage.com/')) await del(product.image).catch(() => {})
    return NextResponse.json({ ok: true })
  })
}
