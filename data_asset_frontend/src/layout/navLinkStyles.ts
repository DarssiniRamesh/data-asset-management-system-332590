export function NAVLinkClassName({ isActive }: { isActive: boolean }): string {
  const base =
    "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20";
  const active =
    "bg-white/70 text-slate-900 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-950/35 dark:text-slate-100 dark:ring-slate-800/70";
  const inactive =
    "text-slate-700 hover:bg-white/55 hover:ring-1 hover:ring-slate-200/60 dark:text-slate-200 dark:hover:bg-slate-950/25 dark:hover:ring-slate-800/60";
  return `${base} ${isActive ? active : inactive}`;
}
