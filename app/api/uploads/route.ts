import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/')) return NextResponse.json({ error: 'An image file is required.' }, { status: 400 })
  if (file.size > 4_500_000) return NextResponse.json({ error: 'Images must be smaller than 4.5 MB.' }, { status: 413 })
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.VERCEL) {
    return NextResponse.json({ error: 'Image storage is not configured. Connect Vercel Blob storage and try again.' }, { status: 503 })
  }
  try {
    const blob = await put(`images/${crypto.randomUUID()}.${extension}`, file, { access: 'public', addRandomSuffix: false, contentType: file.type })
    return NextResponse.json({ url: blob.url })
  } catch {
    if (process.env.VERCEL) {
      return NextResponse.json({ error: 'Image upload failed. Check the Vercel Blob storage configuration and try again.' }, { status: 503 })
    }
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64')
    return NextResponse.json({ url: `data:${file.type};base64,${bytes}`, persistent: false, warning: 'Blob storage is not configured; this image is embedded in the catalog.' })
  }
}
