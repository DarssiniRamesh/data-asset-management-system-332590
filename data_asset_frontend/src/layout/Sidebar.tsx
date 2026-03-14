import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAV_ITEMS } from "./nav";

type SidebarProps = {
  collapsed: boolean;
  // PUBLIC_INTERFACE
  onToggle: () => void;
};

// PUBLIC_INTERFACE
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  /** Contract:
   * - collapsed controls width
   * - onToggle called when user toggles
   */
  return (
    <motion.aside
      className={clsx(
        "relative h-full border-r border-slate-200 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/60",
        collapsed ? "w-20" : "w-72",
      )}
      initial={false}
      animate={{ width: collapsed ? 80 : 288 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-primary/10 ring-1 ring-brand-primary/20" />
          {!collapsed ? (
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Asset Config
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Enterprise UI</div>
            </div>
          ) : null}
        </div>
        <button className="btn-ghost" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className="px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 px-4 py-4">
        {!collapsed ? (
          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
            Tip: Use the dark mode toggle in the top bar.
          </div>
        ) : null}
      </div>
    </motion.aside>
  );
}
