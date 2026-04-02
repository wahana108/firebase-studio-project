// c:\Users\ramaw\firebase-studio-project\src\middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

// Mengambil kredensial dari environment variables
// Pastikan BASIC_AUTH_USER_MW dan BASIC_AUTH_PASS_MW sudah di-set di environment hosting Anda
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER_MW;
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS_MW;
const REALM = "MindMapper Lite Access";

export function middleware(request: NextRequest) {
  // Log awal untuk setiap pemanggilan middleware
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, Timestamp: ${new Date().toISOString()}`);
  // Jangan log passwordnya langsung, cukup cek apakah sudah di-set
  console.log(`[Middleware] BASIC_AUTH_USER_MW (from env): ${BASIC_AUTH_USER ? 'SET' : 'NOT SET'}`);
  console.log(`[Middleware] BASIC_AUTH_PASS_MW (from env): ${BASIC_AUTH_PASS ? 'SET' : 'NOT SET'}`);

  if (
    request.nextUrl.pathname.startsWith('/_next') || // Aset Next.js
    request.headers.get('x-nextjs-data') || // Indikator lama untuk data request (digunakan oleh App Router)
    request.headers.get('RSC') === '1' || // Header standar untuk React Server Components
    request.headers.get('Next-Router-Prefetch') === '1' || // Header untuk prefetch navigasi
    request.nextUrl.searchParams.has('_rsc') // Query parameter untuk RSC
  ) {
    console.log("[Middleware] Allowing Next.js internal request.");
    return NextResponse.next();
  }

  // IZINKAN AKSES PUBLIK: Website ini sekarang terbuka untuk umum secara keseluruhan.
  // Diletakkan setelah pengecekan internal Next.js agar aset sistem tetap diproses cepat
  console.log("[Middleware] Bypassing authentication for public site.");
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Terapkan middleware ke semua path KECUALI yang secara eksplisit dikecualikan:
    // - /api/.* (semua rute API)
    // - /_next/static/.* (file statis Next.js)
    // - /_next/image/.* (optimasi gambar Next.js)
    // - /favicon.ico (file favicon)
    // Tambahkan 'public' ke dalam daftar pengecualian
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
