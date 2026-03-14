import { roleLabel } from "../../../lib/rbac";

type CrudActionBarProps = {
  title: string;
  description?: string;
  canCreate: boolean;
  onCreate: () => void;
  caps: {
    canEdit: boolean;
    canCreate: boolean;
    isViewer: boolean;
  };
  createLabel?: string;
};

// PUBLIC_INTERFACE
export function CrudActionBar({
  title,
  description,
  canCreate,
  onCreate,
  caps,
  createLabel,
}: CrudActionBarProps) {
  /** Contract:
   * - Standard header for tab CRUD lists with RBAC-aware create button.
   * - Shows read-only banner for non-edit roles.
   */
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {description ? <div className="muted mt-1">{description}</div> : null}
      </div>

      <div className="flex items-center gap-2">
        {!caps.canEdit ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
          </div>
        ) : null}

        {canCreate ? (
          <button type="button" className="btn-primary" onClick={onCreate}>
            {createLabel || "Create"}
          </button>
        ) : caps.canEdit ? (
          <button
            type="button"
            className="btn-primary opacity-60"
            disabled
            title="Create requires Editor or Admin role"
          >
            {createLabel || "Create"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
