import { FaBell, FaMoon, FaSun } from "react-icons/fa";
import { Icon } from "../components/Icon";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";

type TopbarProps = {
  title: string;
};

// PUBLIC_INTERFACE
export function Topbar({ title }: TopbarProps) {
  /** Contract: purely presentational; reads Theme/Auth contexts. */
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/70 px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/45 sm:px-6">
      <div className="min-w-0">
        <div className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Manage assets, mappings, and throughput setups
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-ghost" aria-label="Notifications">
          <Icon icon={FaBell} className="h-4 w-4" />
        </button>
        <button className="btn-ghost" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? (
            <Icon icon={FaSun} className="h-4 w-4" />
          ) : (
            <Icon icon={FaMoon} className="h-4 w-4" />
          )}
        </button>

        <div className="ml-2 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/40">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-accent/30 to-brand-primary/10 ring-1 ring-slate-200/60 dark:ring-slate-800/70" />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.username || "User"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role || ""}</div>
          </div>
          <button className="btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
