import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-1">
          <p className="text-7xl font-black text-zinc-700 tabular-nums">404</p>
          <h1 className="text-xl font-bold text-white">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-zinc-400">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/scouting"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Search className="w-4 h-4" />
            Scouting
          </Link>
        </div>
      </div>
    </div>
  );
}
