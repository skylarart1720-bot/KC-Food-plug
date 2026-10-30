import { NextResponse } from 'next/server'
import { productStore } from '../../../../lib/catalog-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const product = productStore.find((item) => item.id === id)
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  Object.assign(product, { ...body, price: body?.price === undefined ? product.price : Number(body.price) || 0 })
  return NextResponse.json({ product })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = productStore.findIndex((item) => item.id === id)
  if (index < 0) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  productStore.splice(index, 1)
  return NextResponse.json({ ok: true })
}
