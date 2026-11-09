import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DPRD Cloud — Satu Cloud, Banyak Drive",
  description:
    "Satu cloud virtual, banyak Google Drive di belakangnya. Kelola, kategorikan, dan arsipkan dokumen dengan elegan.",
  keywords: [
    "DPRD Cloud",
    "Cloud Storage",
    "Google Drive",
    "File Management",
    "Dokumen",
  ],
  authors: [{ name: "DPRD Cloud" }],
  icons: {
    icon:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>",
  },
};

/**
 * ⭐ INLINE SCRIPT ANTI-FOUC
 *
 * Script ini dieksekusi SEBELUM React hydration & SEBELUM browser
 * melakukan paint pertama kali. Tujuannya:
 *
 * 1. Baca theme dari localStorage (yang sudah diset dari login sebelumnya)
 * 2. Kalau "system" → cek prefers-color-scheme OS
 * 3. Set `class="dark"` atau `class="light"` di <html>
 * 4. Set `color-scheme` CSS property agar native form elements ikut
 *
 * Hasil: TIDAK ADA flash putih saat user dengan preferensi dark membuka app.
 *
 * Kalau localStorage kosong (user baru) → default ke "system".
 */
const ANTI_FOUC_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('yudit_theme') || 'system';
    var resolved;
    if (theme === 'dark') {
      resolved = 'dark';
    } else if (theme === 'light') {
      resolved = 'light';
    } else {
      // system
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  } catch (e) {
    // Fail-safe: kalau apapun error, pakai light
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* ⭐ Anti-FOUC script — WAJIB paling awal di <head> */}
        <script
          dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }}
          suppressHydrationWarning
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
