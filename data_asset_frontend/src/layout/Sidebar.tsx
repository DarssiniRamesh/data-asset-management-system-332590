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
        "hidden shrink-0 border-r border-slate-200 bg-white px-3 py-5 dark:border-slate-800 dark:bg-slate-950 lg:block",
        collapsed ? "w-20" : "w-64",
      ].join(" ")}
      aria-label="Sidebar navigation"
    >
      <div className="px-2 pb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Menu</div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const IconEl = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => NAVLinkClassName({ isActive })} end>
              <IconEl className="h-4 w-4" />
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
