export function NAVLinkClassName({ isActive }: { isActive: boolean }): string {
  const base =
    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40";
  const active = "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200";
  const inactive = "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60";
  return `${base} ${isActive ? active : inactive}`;
}
