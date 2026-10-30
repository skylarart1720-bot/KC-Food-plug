import { NextResponse } from 'next/server'
import { carouselStore, CarouselSlide } from '../../../lib/catalog-store'

export async function GET() { return NextResponse.json({ slides: carouselStore }) }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.image) return NextResponse.json({ error: 'Title and image are required.' }, { status: 400 })
  const slide: CarouselSlide = { id: `slide-${Date.now()}`, title: String(body.title), text: String(body.text || ''), image: String(body.image), active: body.active !== false }
  carouselStore.push(slide)
  return NextResponse.json({ slide }, { status: 201 })
}
