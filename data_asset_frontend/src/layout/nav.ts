import type { IconBaseProps } from "react-icons";
import { FaClipboardList, FaHome, FaPlusCircle, FaTable } from "react-icons/fa";
import type { Role } from "../api/types";
import { can } from "../lib/rbac";

/**
 * react-icons IconType is typed as returning ReactNode, which breaks TS4 JSX checks (TS2786).
 * We define a local, stricter contract: our nav icons must be renderable as JSX Elements.
 */
export type NavIcon = (props: IconBaseProps) => JSX.Element;

export type NavItem = {
  to: string;
  label: string;
  icon: NavIcon;
  /**
   * Optional RBAC guard for whether this nav item should be shown.
   * If omitted, the item is visible to all authenticated users (subject to route guards).
   */
  requiredAction?: "read" | "create" | "edit" | "copy" | "delete";
};

const ALL_NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Overview", icon: FaHome as unknown as NavIcon, requiredAction: "read" },
  { to: "/app/assets", label: "Assets", icon: FaTable as unknown as NavIcon, requiredAction: "read" },
  { to: "/app/assets/create", label: "Create", icon: FaPlusCircle as unknown as NavIcon, requiredAction: "create" },
  { to: "/", label: "Landing", icon: FaClipboardList as unknown as NavIcon },
];

/**
 * PUBLIC_INTERFACE
 */
export function getNavItemsForRole(role: Role | null | undefined): NavItem[] {
  /** Contract:
   * - Returns the set of sidebar nav items that should be visible for a given role.
   * - Visibility is a UX feature; backend remains the security boundary.
   */
  return ALL_NAV_ITEMS.filter((item) => {
    if (!item.requiredAction) return true;
    return can(role, item.requiredAction);
  });
}
