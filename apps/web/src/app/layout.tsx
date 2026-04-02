import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Navbar } from '@/components/layout/navbar';
import './globals.css';

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'AlgoArena — Master Algorithms Through Competition',
    template: '%s | AlgoArena',
  },
  description:
    'Practice Data Structures & Algorithms, battle opponents in real-time 1v1 coding matches, and track your progress with adaptive learning.',
  keywords: ['DSA', 'algorithms', 'data structures', 'competitive programming', 'LeetCode', 'coding practice'],
  authors: [{ name: 'AlgoArena Team' }],
  creator: 'AlgoArena',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://algoarena.io',
    siteName: 'AlgoArena',
    title: 'AlgoArena — Master Algorithms Through Competition',
    description:
      'Practice DSA, battle opponents in real-time 1v1 coding matches, and level up your skills.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlgoArena',
    description: 'Master DSA through competitive programming',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// ─────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50 font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              {/* Sticky top navigation */}
              <Navbar />

              {/* Page content */}
              <main className="flex flex-col">
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type React from 'react';
