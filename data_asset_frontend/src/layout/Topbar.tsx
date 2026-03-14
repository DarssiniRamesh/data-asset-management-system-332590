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
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/60 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/50">
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
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

        <div className="ml-2 flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
          <div className="h-8 w-8 rounded-xl bg-brand-accent/30 ring-1 ring-brand-accent/30" />
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
