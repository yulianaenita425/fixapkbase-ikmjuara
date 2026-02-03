import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Ambil token dari cookie (Sesuaikan nama ini dengan yang ada di browser Anda)
  // Berdasarkan kode Anda sebelumnya: 'sb-access-token'
  const token = request.cookies.get('sb-access-token')?.value;
  const { pathname } = request.nextUrl;

  // 2. PROTEKSI HALAMAN ADMIN
  // Jika akses /admin tapi tidak punya token
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Redirect ke login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. PROTEKSI HALAMAN LOGIN (REVERSE AUTH)
  // Jika sudah punya token tapi mau buka halaman login
  if (pathname === '/login') {
    if (token) {
      // Lempar balik ke admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

// 4. KONFIGURASI MATCHER
export const config = {
  matcher: [
    '/admin/:path*', 
    '/login',
  ],
};