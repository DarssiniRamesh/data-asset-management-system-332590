import type { Role } from "../api/types";

/**
 * RBAC helper utilities.
 *
 * This file intentionally centralizes all UI authorization decisions so that:
 * - navigation visibility
 * - action button enablement/visibility
 * - route-level gating (where desired)
 *
 * all use the same canonical permission model.
 */

/** UI actions we need to gate per BRD implementation guide. */
export type RbacAction = "read" | "create" | "edit" | "copy" | "delete";

/** A normalized, always-safe role type (null/undefined => unauthenticated). */
export type MaybeRole = Role | null | undefined;

type PermissionMatrix = Record<RbacAction, Role[]>;

/**
 * Canonical BRD-driven permission matrix:
 * - Viewer: read-only
 * - Editor: create/edit/copy (non-destructive)
 * - Admin: everything including destructive delete
 */
const PERMISSIONS: PermissionMatrix = {
  read: ["Viewer", "Editor", "Admin"],
  create: ["Editor", "Admin"],
  edit: ["Editor", "Admin"],
  copy: ["Editor", "Admin"],
  delete: ["Admin"],
};

/**
 * PUBLIC_INTERFACE
 */
export function can(role: MaybeRole, action: RbacAction): boolean {
  /** Contract:
   * Inputs:
   *  - role: 'Admin' | 'Editor' | 'Viewer' | null | undefined
   *  - action: 'read' | 'create' | 'edit' | 'copy' | 'delete'
   * Output:
   *  - boolean: true iff role is present and permitted for the action
   * Errors:
   *  - none (pure function)
   */
  if (!role) return false;
  return PERMISSIONS[action].includes(role);
}

/**
 * PUBLIC_INTERFACE
 */
export function getUiCapabilities(role: MaybeRole) {
  /** Contract:
   * Output:
   *  - a stable set of booleans for common UI gating.
   * Notes:
   *  - Use this in components to avoid sprinkling `can(role, "...")` everywhere.
   */
  return {
    canRead: can(role, "read"),
    canCreate: can(role, "create"),
    canEdit: can(role, "edit"),
    canCopy: can(role, "copy"),
    canDelete: can(role, "delete"),
    isViewer: role === "Viewer",
    isEditor: role === "Editor",
    isAdmin: role === "Admin",
  } as const;
}

/**
 * PUBLIC_INTERFACE
 */
export function roleLabel(role: MaybeRole): string {
  /** Contract:
   * Output:
   *  - human-readable role label for UI messages/tooltips.
   */
  return role ?? "Unauthenticated";
}
