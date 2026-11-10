import { NextResponse } from 'next/server'
import { carouselStore, CarouselSlide, hydrateCatalog, mutateCatalog } from '../../../lib/catalog-store'

export async function GET() { const ready = await hydrateCatalog(); if (!ready && carouselStore.length === 0) return NextResponse.json({ error: 'Catalog storage is temporarily unavailable.' }, { status: 503 }); return NextResponse.json({ slides: carouselStore }) }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.image) return NextResponse.json({ error: 'Title and image are required.' }, { status: 400 })
  return mutateCatalog(() => {
    const slide: CarouselSlide = { id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: String(body.title), text: String(body.text || ''), image: String(body.image), active: body.active !== false }
    carouselStore.push(slide)
    return NextResponse.json({ slide }, { status: 201 })
  })
}
