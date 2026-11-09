import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { carouselStore, hydrateCatalog, persistCatalog } from '../../../../lib/catalog-store'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await hydrateCatalog()
  const body = await request.json().catch(() => null)
  const slide = carouselStore.find((item) => item.id === id)
  if (!slide) return NextResponse.json({ error: 'Carousel slide not found.' }, { status: 404 })
  Object.assign(slide, body)
  await persistCatalog()
  return NextResponse.json({ slide })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await hydrateCatalog()
  const index = carouselStore.findIndex((item) => item.id === id)
  if (index < 0) return NextResponse.json({ error: 'Carousel slide not found.' }, { status: 404 })
  const slide = carouselStore[index]
  carouselStore.splice(index, 1)
  if (slide.image.includes('.blob.vercel-storage.com/')) await del(slide.image).catch(() => {})
  await persistCatalog()
  return NextResponse.json({ ok: true })
}
