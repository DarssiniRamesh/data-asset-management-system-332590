import type { IconBaseProps } from "react-icons";
import { FaClipboardList, FaHome, FaPlusCircle, FaTable } from "react-icons/fa";

/**
 * react-icons IconType is typed as returning ReactNode, which breaks TS4 JSX checks (TS2786).
 * We define a local, stricter contract: our nav icons must be renderable as JSX Elements.
 */
export type NavIcon = (props: IconBaseProps) => JSX.Element;

export type NavItem = {
  to: string;
  label: string;
  icon: NavIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Overview", icon: FaHome as unknown as NavIcon },
  { to: "/app/assets", label: "Assets", icon: FaTable as unknown as NavIcon },
  { to: "/app/assets/create", label: "Create", icon: FaPlusCircle as unknown as NavIcon },
  { to: "/", label: "Landing", icon: FaClipboardList as unknown as NavIcon },
];
