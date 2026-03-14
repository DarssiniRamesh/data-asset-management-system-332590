import { useEffect, useMemo, useState } from "react";
import { listThroughputEquations, queryEquationMasters } from "../../../api/endpoints";
import type { EquationMasterDto, ThroughputEquationDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";

type Row = ThroughputEquationDto;

function buildEquationIndex(masters: EquationMasterDto[]): Map<string, EquationMasterDto> {
  const m = new Map<string, EquationMasterDto>();
  for (const e of masters) m.set(e.equationMasterId, e);
  return m;
}

// PUBLIC_INTERFACE
export function ThroughputSetupTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - Configure throughput equations/scalars for the selected input parameter.
   *  - This step wires list-only for equations (scalars UI later).
   * Scope:
   *  - assetId + selected inputParameterId (from selection context)
   * Backend:
   *  - GET /api/assets/{assetId}/input-parameters/{inputParameterId}/throughput-equations
   *  - GET /api/masters/equations
   * RBAC:
   *  - Viewer: read-only (no create/update UI in this step).
   */
  const { selectedInputParameterId } = useInputParameterSelection();

  const [rows, setRows] = useState<Row[]>([]);
  const [equations, setEquations] = useState<EquationMasterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      if (!selectedInputParameterId) {
        setRows([]);
        setEquations([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [list, masters] = await Promise.all([
          listThroughputEquations(asset.assetId, selectedInputParameterId),
          queryEquationMasters({ activeOnly: true, limit: 500 }),
        ]);
        if (!mounted) return;
        setRows(list);
        setEquations(masters);
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

  const equationIndex = useMemo(() => buildEquationIndex(equations), [equations]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "equation",
        header: "Equation",
        render: (r) => {
          const id = r.equationMasterId ?? null;
          const master = id !== null ? equationIndex.get(String(id)) : undefined;
          return (
            <div>
              <div className="text-sm font-semibold">{master?.equationName ?? "Unknown equation"}</div>
              <div className="muted text-xs">
                Master ID: <span className="font-mono">{id ?? "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "text",
        header: "Equation Text",
        render: (r) => <span className="text-sm">{r.equationText ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span>,
      },
    ],
    [equationIndex],
  );

  if (!selectedInputParameterId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Throughput Setup</div>
        <div className="muted mt-1">Configure throughput equations/scalars for the selected input parameter.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to configure
          Throughput Setup.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Throughput Setup"
        description="Configure throughput equations for the selected input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No throughput equations"
        emptyMessage="No throughput equations were found for the selected input parameter."
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
            rowKey={(r) => r.throughputEquationId}
            emptyLabel="No throughput equations."
          />

          <div className="muted text-xs">
            Master data loaded: <span className="font-mono">{equations.length}</span> equation masters.
          </div>
        </div>
      </TabStatePanel>
    </div>
  );
}
