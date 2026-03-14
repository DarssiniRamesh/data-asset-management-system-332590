import { NavLink } from "react-router-dom";
import { NAVLinkClassName } from "./navLinkStyles";
import { getNavItemsForRole } from "./nav";
import { useAuth } from "../state/AuthContext";

export type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

// PUBLIC_INTERFACE
export function Sidebar({ collapsed }: SidebarProps) {
  /** Contract:
   * - Renders sidebar navigation items.
   * - Supports collapsed layout (controlled by parent DashboardLayout).
   * - Navigation visibility is filtered via centralized RBAC rules (getNavItemsForRole).
   *
   * Note:
   * - onToggle is part of the public props contract (used by DashboardLayout). This component
   *   does not currently render a toggle button; the prop is kept to preserve the existing layout contract.
   */
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role);

  return (
    <aside
      className={[
        "hidden shrink-0 border-r border-slate-200/70 bg-white/70 px-3 py-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/45 lg:block",
        collapsed ? "w-20" : "w-64",
      ].join(" ")}
      aria-label="Sidebar navigation"
    >
      {/* Brand / section header */}
      <div className="px-2 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-accent/15 ring-1 ring-slate-200/60 dark:ring-slate-800/70">
            <div className="grid h-full w-full place-items-center">
              <span className="block h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
            </div>
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Dashboard
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Navigation
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Menu
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const IconEl = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => NAVLinkClassName({ isActive })} end>
              <IconEl className="h-4 w-4" />
              {!collapsed ? <span className="min-w-0 truncate">{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      {/* subtle bottom fade (premium depth) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 hidden h-12 bg-gradient-to-t from-white/70 to-transparent dark:from-slate-950/45 lg:block" />
    </aside>
  );
}
