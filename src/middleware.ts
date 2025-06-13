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

  // Izinkan permintaan internal Next.js (RSC, aset statis, data, prefetch)
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

  // Peringatan jika kredensial Basic Auth tidak di-set di environment variables
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASS) {
    console.error(
      "[Middleware] CRITICAL: Basic Auth credentials (BASIC_AUTH_USER_MW or BASIC_AUTH_PASS_MW) are NOT SET or empty in environment variables. Authentication will fail or be bypassed if logic is flawed."
    );
    // Pertimbangkan untuk langsung mengembalikan 401 atau 500 di sini jika kredensial tidak ada,
    // daripada membiarkan logika autentikasi berpotensi gagal secara diam-diam.
    // Contoh: return new NextResponse("Configuration error: Auth credentials missing", { status: 500 });
    // Untuk sekarang, kita biarkan lanjut agar bisa melihat log lainnya saat debugging.
  }

  // 1. Cek header kustom x-password (opsional, bisa dihapus jika tidak digunakan)
  const xPassword = request.headers.get("x-password");
  if (xPassword && xPassword === BASIC_AUTH_PASS) {
    // Pastikan BASIC_AUTH_PASS ada dan cocok
    console.log("[Middleware] Access granted via x-password header.");
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
          console.log("[Middleware] Basic Auth successful for user:", user);
          return NextResponse.next(); // Autentikasi berhasil
        } else {
          // Jangan log password yang salah dari pengguna, cukup username jika perlu
          console.warn("[Middleware] Basic Auth failed: Credentials mismatch for user:", user);
        }
      } catch (e) {
        console.error("[Middleware] Error parsing Basic Auth header:", e);
        // Kesalahan parsing, lanjutkan untuk mengirim respons Unauthorized
      }
    } else {
      console.log("[Middleware] Authorization header found, but not 'Basic' type or value is missing.");
    }
  } else {
    console.log("[Middleware] No authorization header found. Proceeding to send 401.");
  }

  // Jika semua metode autentikasi gagal, kirim respons Unauthorized
  console.log("[Middleware] All authentication checks failed or no credentials provided by client. Sending 401 Unauthorized.");
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
    // Tambahkan 'public' ke dalam daftar pengecualian
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
