import { NextRequest, NextResponse } from 'next/server'
import { clientKey, isRateLimited, isTrustedMutation } from './lib/security'

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  for (const [name, value] of Object.entries(securityHeaders)) response.headers.set(name, value)
  if (process.env.NODE_ENV === 'production') response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  if (!request.nextUrl.pathname.startsWith('/api/')) return response
  const method = request.method.toUpperCase()
  if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
    if (!isTrustedMutation(request)) return NextResponse.json({ error: 'Untrusted request origin.' }, { status: 403, headers: securityHeaders })
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > 1_000_000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413, headers: securityHeaders })
    if (isRateLimited(`${clientKey(request)}:${request.nextUrl.pathname}`, request.nextUrl.pathname.includes('/orders') ? 15 : 60)) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { ...securityHeaders, 'Retry-After': '60' } })
  }
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
