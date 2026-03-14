import { useEffect, useMemo, useState } from "react";
import { listEfSourceMappings } from "../../../api/endpoints";
import type { EfSourceMappingDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";

type Row = EfSourceMappingDto;

// PUBLIC_INTERFACE
export function EfSourceMappingTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - EF Source Mapping is scoped to (assetId, inputParameterId).
   *  - inputParameterId MUST come from Associated Input Parameters tab selection (no manual entry).
   * Backend:
   *  - GET /api/assets/{assetId}/input-parameters/{inputParameterId}/ef-source-mappings
   * RBAC:
   *  - Viewer: can view; cannot create/update (no edit UI in this step).
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
        const list = await listEfSourceMappings(asset.assetId, selectedInputParameterId);
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
        key: "efSourceId",
        header: "EF Source ID",
        render: (r) => <span className="font-mono text-xs">{r.efSourceId ?? "-"}</span>,
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
        <div className="text-sm font-semibold">EF Source Mapping</div>
        <div className="muted mt-1">Configure EF source mapping for the selected input parameter.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to configure EF
          Source Mapping.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="EF Source Mapping"
        description="Configure EF source mapping for the selected input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No EF source mappings"
        emptyMessage="No EF source mappings were found for the selected input parameter."
      >
        <div className="space-y-4">
          {!caps.canEdit ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
            </div>
          ) : null}

          <div className="muted text-xs">
            InputParameterId: <span className="font-mono font-semibold">{selectedInputParameterId}</span>
          </div>

          <DataTable<Row>
            columns={columns}
            rows={rows}
            rowKey={(r) => r.efSourceMappingId}
            emptyLabel="No EF source mappings."
          />
        </div>
      </TabStatePanel>
    </div>
  );
}
