import type { Metadata } from 'next';
import { Syne, Inter } from 'next/font/google';
import { TubelightNavbar } from '@/components/ui/tubelight-navbar';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TactIQ — Football Intelligence, Redefined',
  description: 'Real-time tactical analytics for scouts, analysts, and the modern game.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${syne.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#0B0E14] text-white font-sans antialiased">
        <TubelightNavbar />
        {children}
      </body>
    </html>
  );
}
