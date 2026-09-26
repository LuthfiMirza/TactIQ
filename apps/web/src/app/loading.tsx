export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-zinc-800 border-t-slate-900 dark:border-t-zinc-200 animate-spin" />
        <span className="text-xs font-mono font-medium text-slate-400 dark:text-zinc-500 tracking-wide">
          Loading...
        </span>
      </div>
    </div>
  );
}
