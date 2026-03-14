import { useEffect, useMemo, useState } from "react";
import { listAssetStatusLogs } from "../../../api/endpoints";
import type { AssetStatusLogDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";

type Row = AssetStatusLogDto;

// PUBLIC_INTERFACE
export function StatusLogTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - BRD-required Status Log module for an asset.
   * Backend:
   *  - GET /api/assets/{assetId}/status-logs
   * RBAC:
   *  - Viewer: read-only (no create/update UI in this step).
   * Notes:
   *  - This step focuses on wiring + consistent state handling; create/edit forms are added later.
   */
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const list = await listAssetStatusLogs(asset.assetId);
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
  }, [asset.assetId]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "statusCodeId",
        header: "Status Code ID",
        render: (r) => <span className="font-mono text-xs">{r.statusCodeId ?? "-"}</span>,
      },
      {
        key: "start",
        header: "Start",
        render: (r) => <span className="text-sm">{r.statusStartDate ?? "-"}</span>,
      },
      {
        key: "end",
        header: "End",
        render: (r) => <span className="text-sm">{r.statusEndDate ?? "-"}</span>,
      },
      {
        key: "comment",
        header: "Comment",
        render: (r) => <span className="text-sm">{r.comment ?? "-"}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Status Log"
        description="BRD-required status log module for the asset."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No status log entries"
        emptyMessage="No status log entries were found for this asset."
      >
        <div className="space-y-4">
          {!caps.canEdit ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
            </div>
          ) : null}

          <DataTable<Row>
            columns={columns}
            rows={rows}
            rowKey={(r) => r.assetStatusLogId}
            emptyLabel="No status log entries."
          />
        </div>
      </TabStatePanel>
    </div>
  );
}
