import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'TactIQ | Data-Driven Football Analytics & Tactical Tracking',
  description: 'Production-grade football analytics platform powered by computer vision, radar metrics, and machine learning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-tactiq-bg text-slate-100 antialiased selection:bg-tactiq-emerald selection:text-black">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-tactiq-border py-6 text-center text-xs text-tactiq-muted">
          <p>© 2026 TactIQ Platform. Engineered by Luthfi (API), Fuad (ML), and Ferrel (Front-End).</p>
        </footer>
      </body>
    </html>
  );
}
