import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Blob storage is not configured.' }, { status: 503 })
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/')) return NextResponse.json({ error: 'An image file is required.' }, { status: 400 })
  if (file.size > 4_500_000) return NextResponse.json({ error: 'Images must be smaller than 4.5 MB.' }, { status: 413 })
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const blob = await put(`images/${crypto.randomUUID()}.${extension}`, file, { access: 'public', addRandomSuffix: false, contentType: file.type })
  return NextResponse.json({ url: blob.url })
}
