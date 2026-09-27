import React from 'react';

export default function ModulesLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse" aria-busy="true" aria-label="Loading module content">
      {/* Top Banner Skeleton */}
      <div className="h-28 sm:h-32 w-full rounded-2xl bg-[#121215] border border-[#27272A] p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/60" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-800/80" />
            <div className="h-3 w-48 rounded bg-zinc-800/40" />
          </div>
        </div>
        <div className="hidden sm:block h-9 w-28 rounded-lg bg-zinc-800/60" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-96 w-full rounded-2xl bg-[#121215] border border-[#27272A] p-4">
            <div className="h-6 w-40 rounded bg-zinc-800/60 mb-4" />
            <div className="h-72 w-full rounded-xl bg-zinc-900/60" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-64 w-full rounded-2xl bg-[#121215] border border-[#27272A] p-4 space-y-3">
            <div className="h-5 w-32 rounded bg-zinc-800/60" />
            <div className="h-10 w-full rounded-lg bg-zinc-800/40" />
            <div className="h-10 w-full rounded-lg bg-zinc-800/40" />
            <div className="h-10 w-full rounded-lg bg-zinc-800/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
