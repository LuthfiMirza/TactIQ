'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TactIQ Module] Error:', error);
  }, [error]);

  return (
    <div className="w-full flex items-center justify-center py-24">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white">Modul Error</h2>
          <p className="text-sm text-zinc-400">
            Konten tidak dapat ditampilkan. Sidebar dan navigasi tetap aktif.
          </p>
          {error && (
            <pre className="text-xs text-rose-400 font-mono bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-left overflow-x-auto max-w-xl mx-auto whitespace-pre-wrap break-all">
              {error.message || String(error)}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n${error.stack}`}
            </pre>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Coba Lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
