import { NextResponse } from 'next/server'
import { settingsStore } from '../../../lib/admin-store'

export async function GET() { return NextResponse.json({ settings: settingsStore }) }
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  Object.assign(settingsStore, body || {})
  return NextResponse.json({ settings: settingsStore })
}
