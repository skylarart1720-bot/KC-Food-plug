import { orderStore } from '../../../../../lib/order-store'

export const dynamic = 'force-dynamic'

function pdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function createPdf(lines: string[]) {
  const contentLines = ['BT', '/F1 18 Tf', '50 790 Td', `(${pdfText(lines[0])}) Tj`, '/F1 10 Tf']
  lines.slice(1).forEach((line) => {
    contentLines.push('0 -18 Td', `(${pdfText(line)}) Tj`)
  })
  contentLines.push('ET')
  const content = contentLines.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const requestUrl = new URL(_request.url)
  let order = orderStore.find((item) => item.id === id)
  const token = requestUrl.searchParams.get('token')
  if (!order && token) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
      if (decoded?.id === id && decoded?.customer && Array.isArray(decoded?.items)) order = decoded
    } catch { /* The link is invalid; return the normal not-found response. */ }
  }
  if (!order) return new Response('Receipt not found.', { status: 404 })

  const lines = [
    'KFC - CHICKEN MAN PLUG | ORDER RECEIPT',
    `Reference: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleString('en-GH')}`,
    `Customer: ${order.customer.name || 'Not provided'}`,
    `Phone: ${order.customer.phone || 'Not provided'}`,
    `Delivery: ${order.customer.area || 'Not provided'}`,
    '----------------------------------------',
    ...order.items.map((item) => `${item.name} x${item.quantity} - GHS ${(item.price * item.quantity).toFixed(2)}`),
    '----------------------------------------',
    `Subtotal: GHS ${order.subtotal.toFixed(2)}`,
    `Delivery: GHS ${order.delivery.toFixed(2)}`,
    `TOTAL: GHS ${order.total.toFixed(2)}`,
    'Please confirm availability and delivery on WhatsApp.',
  ]

  return new Response(createPdf(lines), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${order.id}-receipt.pdf"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
