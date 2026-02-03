import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Ambil token dari cookie 'sb-access-token'
  const token = request.cookies.get('sb-access-token')?.value;
  const { pathname } = request.nextUrl;

  // 2. PROTEKSI HALAMAN ADMIN
  // Jika mencoba masuk ke folder /admin tapi TIDAK ada token di cookie
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Tendang paksa balik ke halaman login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. PROTEKSI HALAMAN LOGIN (REVERSE AUTH)
  // Jika sudah login (punya token) tapi iseng buka halaman /login lagi
  if (pathname.startsWith('/login')) {
    if (token) {
      // Lempar otomatis ke dashboard admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

// 4. KONFIGURASI MATCHER
// Menentukan rute mana saja yang akan diproses oleh middleware ini
export const config = {
  matcher: [
    '/admin/:path*', // Semua halaman di dalam folder admin
    '/login',        // Halaman login itu sendiri
  ],
};