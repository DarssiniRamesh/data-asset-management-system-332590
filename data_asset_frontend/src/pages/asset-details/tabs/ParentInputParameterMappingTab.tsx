import { useEffect, useMemo, useState } from "react";
import { listParentInputMappings } from "../../../api/endpoints";
import type { ParentInputMappingDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";

type Row = ParentInputMappingDto;

// PUBLIC_INTERFACE
export function ParentInputParameterMappingTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - BRD-required parent mapping module for the selected child input parameter.
   * Scope:
   *  - assetId + selected childInputParameterId (from selection context)
   * Backend:
   *  - GET /api/assets/{assetId}/input-parameters/{childInputParameterId}/parent-input-mappings
   * RBAC:
   *  - Viewer: read-only (no create/update UI in this step).
   */
  const { selectedInputParameterId } = useInputParameterSelection();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      if (!selectedInputParameterId) {
        setRows([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const list = await listParentInputMappings(asset.assetId, selectedInputParameterId);
        if (!mounted) return;
        setRows(list);
      } catch (e) {
        if (!mounted) return;
        setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [asset.assetId, selectedInputParameterId]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "parentId",
        header: "Parent Input Parameter ID",
        render: (r) => <span className="font-mono text-xs">{r.parentInputParameterId ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span>,
      },
    ],
    [],
  );

  if (!selectedInputParameterId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Parent Input Parameter Mapping</div>
        <div className="muted mt-1">Select an input parameter in Associated Input Parameters to view mappings.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to view Parent
          Input Parameter Mapping.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Parent Input Parameter Mapping"
        description="BRD-required parent mapping module for the selected child input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No parent mappings"
        emptyMessage="No parent mappings were found for the selected input parameter."
      >
        <div className="space-y-4">
          {!caps.canEdit ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
            </div>
          ) : null}

          <div className="muted text-xs">
            Child inputParameterId: <span className="font-mono font-semibold">{selectedInputParameterId}</span>
          </div>

          <DataTable<Row>
            columns={columns}
            rows={rows}
            rowKey={(r) => r.parentInputMappingId}
            emptyLabel="No parent mappings."
          />
        </div>
      </TabStatePanel>
    </div>
  );
}
