import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SuaraNiaga - Asisten Warung AI",
  description: "Aplikasi pencatat transaksi berbasis suara untuk UMKM",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <main className="mx-auto max-w-md min-h-screen bg-gray-50 shadow-xl overflow-hidden relative">
          {children}
        </main>
      </body>
    </html>
  );
}