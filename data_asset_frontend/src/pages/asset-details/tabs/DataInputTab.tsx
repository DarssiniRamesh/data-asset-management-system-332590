import { useEffect, useMemo, useState } from "react";
import { listDataInputValues } from "../../../api/endpoints";
import type { DataInputValueDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";

type Row = DataInputValueDto;

// PUBLIC_INTERFACE
export function DataInputTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - Manage data input values for the selected input parameter.
   *  - This step wires list-only.
   * Scope:
   *  - assetId + selected inputParameterId (from selection context)
   * Backend:
   *  - GET /api/assets/{assetId}/input-parameters/{inputParameterId}/data-input-values
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
        const list = await listDataInputValues(asset.assetId, selectedInputParameterId);
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
        key: "text",
        header: "Text",
        render: (r) => <span className="text-sm">{r.valueText ?? "-"}</span>,
      },
      {
        key: "number",
        header: "Number",
        render: (r) => <span className="font-mono text-xs">{r.valueNumber ?? "-"}</span>,
      },
      {
        key: "datetime",
        header: "Date/Time",
        render: (r) => <span className="text-sm">{r.valueDateTime ?? "-"}</span>,
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
        <div className="text-sm font-semibold">Data Input</div>
        <div className="muted mt-1">Manage data input values for the selected input parameter.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to manage Data
          Input values.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Data Input"
        description="Manage data input values for the selected input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No data input values"
        emptyMessage="No data input values were found for the selected input parameter."
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
            rowKey={(r) => r.dataInputValueId}
            emptyLabel="No data input values."
          />
        </div>
      </TabStatePanel>
    </div>
  );
}
