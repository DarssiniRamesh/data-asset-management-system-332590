import type { AssetDto } from "../../api/types";

/**
 * Props shared across Asset Details tab components.
 */
export type AssetDetailsTabProps = {
  asset: AssetDto;
  /** Normalized capabilities from src/lib/rbac.ts */
  caps: {
    canRead: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canCopy: boolean;
    canDelete: boolean;
    isViewer: boolean;
    isEditor: boolean;
    isAdmin: boolean;
  };
};
