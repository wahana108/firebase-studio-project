// c:\Users\ramaw\firebase-studio-project\src\middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

// Mengambil kredensial dari environment variables
// Pastikan BASIC_AUTH_USER_MW dan BASIC_AUTH_PASS_MW sudah di-set di environment hosting Anda
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER_MW;
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS_MW;
const REALM = "MindMapper Lite Access";

export function middleware(request: NextRequest) {
  // Izinkan permintaan internal Next.js (RSC, aset statis, data, prefetch)
  if (
    request.nextUrl.pathname.startsWith('/_next') || // Aset Next.js
    request.headers.get('x-nextjs-data') || // Indikator lama untuk data request (digunakan oleh App Router)
    request.headers.get('RSC') === '1' || // Header standar untuk React Server Components
    request.headers.get('Next-Router-Prefetch') === '1' || // Header untuk prefetch navigasi
    request.nextUrl.searchParams.has('_rsc') // Query parameter untuk RSC
  ) {
    return NextResponse.next();
  }

  // Peringatan jika kredensial Basic Auth tidak di-set di environment variables
  // Middleware akan tetap mencoba autentikasi, namun kemungkinan besar akan gagal jika variabel tidak ada.
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASS) {
    console.warn(
      "Peringatan: Kredensial Basic Authentication (BASIC_AUTH_USER_MW, BASIC_AUTH_PASS_MW) tidak diatur atau kosong di environment variables. Autentikasi kemungkinan akan gagal."
    );
  }

  // 1. Cek header kustom x-password (opsional, bisa dihapus jika tidak digunakan)
  const xPassword = request.headers.get("x-password");
  if (xPassword && xPassword === BASIC_AUTH_PASS) {
    // Pastikan BASIC_AUTH_PASS ada dan cocok
    // Ini berguna jika Anda ingin metode akses cepat selain Basic Auth standar
    return NextResponse.next();
  }

  // 2. Cek Basic Authentication
  const authorizationHeader = request.headers.get("authorization");
  if (authorizationHeader) {
    const authType = authorizationHeader.split(" ")[0];
    const authValue = authorizationHeader.split(" ")[1];

    if (authType === "Basic" && authValue) {
      try {
        const [user, pass] = Buffer.from(authValue, "base64").toString().split(":");
        if (user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS) {
          return NextResponse.next(); // Autentikasi berhasil
        }
      } catch (e) {
        console.error("Error parsing Basic Auth header:", e);
        // Kesalahan parsing, lanjutkan untuk mengirim respons Unauthorized
      }
    }
  }

  // Jika semua metode autentikasi gagal, kirim respons Unauthorized
  const response = new NextResponse("Unauthorized", { status: 401 });
  response.headers.set('WWW-Authenticate', `Basic realm="${REALM}"`);
  return response;
}

export const config = {
  matcher: [
    // Terapkan middleware ke semua path KECUALI yang secara eksplisit dikecualikan:
    // - /api/.* (semua rute API)
    // - /_next/static/.* (file statis Next.js)
    // - /_next/image/.* (optimasi gambar Next.js)
    // - /favicon.ico (file favicon)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
