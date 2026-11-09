import { NextResponse } from 'next/server'
import { carouselStore, persistCatalog } from '../../../../lib/catalog-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const slide = carouselStore.find((item) => item.id === id)
  if (!slide) return NextResponse.json({ error: 'Carousel slide not found.' }, { status: 404 })
  Object.assign(slide, body)
  persistCatalog()
  return NextResponse.json({ slide })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = carouselStore.findIndex((item) => item.id === id)
  if (index < 0) return NextResponse.json({ error: 'Carousel slide not found.' }, { status: 404 })
  carouselStore.splice(index, 1)
  persistCatalog()
  return NextResponse.json({ ok: true })
}
