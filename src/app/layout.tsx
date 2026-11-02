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
<<<<<<< HEAD
  title: "DPRD Cloud — Satu Cloud, Banyak Drive",
  description:
    "Satu cloud virtual, banyak Google Drive di belakangnya. Kelola, kategorikan, dan arsipkan dokumen dengan elegan.",
  keywords: [
    "DPRD Cloud",
=======
  title: "Yudit Cloud — Satu Cloud, Banyak Drive",
  description:
    "Satu cloud virtual, banyak Google Drive di belakangnya. Kelola, kategorikan, dan arsipkan dokumen dengan elegan.",
  keywords: [
    "Yudit Cloud",
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
    "Cloud Storage",
    "Google Drive",
    "File Management",
    "Dokumen",
  ],
<<<<<<< HEAD
  authors: [{ name: "DPRD Cloud" }],
=======
  authors: [{ name: "Yudit Cloud" }],
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  icons: {
    icon:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="id" suppressHydrationWarning>
=======
    <html lang="id" suppressHydrationWarning className="dark">
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
