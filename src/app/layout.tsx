
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'MindMapper Lite',
  description: 'A simple mind mapping log application.',
  robots: 'noindex, nofollow', // Mencegah indeksasi oleh mesin pencari
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
