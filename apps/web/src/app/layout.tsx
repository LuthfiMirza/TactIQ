import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'TactIQ — Football Intelligence & Matchday Hub',
  description: 'Real-time tactical analytics, xG tracking, and scouting intelligence for the modern game.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F0F2F5] dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-150">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
