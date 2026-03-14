import { useEffect, useMemo, useState } from "react";
import { listAdditionalAssetIds } from "../../../api/endpoints";
import type { AdditionalAssetIdDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";

type Row = AdditionalAssetIdDto;

// PUBLIC_INTERFACE
export function AdditionalAssetIdsTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - BRD-required additional identifiers module.
   * Backend:
   *  - GET /api/assets/{assetId}/additional-ids
   * RBAC:
   *  - Viewer: read-only (no create/update UI in this step).
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
        const list = await listAdditionalAssetIds(asset.assetId);
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
        key: "type",
        header: "Type",
        render: (r) => <span className="text-sm">{r.idType ?? "-"}</span>,
      },
      {
        key: "value",
        header: "Value",
        render: (r) => <span className="font-mono text-xs">{r.idValue ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => (
          <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Additional Asset IDs"
        description="BRD-required additional identifiers module."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No additional IDs"
        emptyMessage="No additional IDs were found for this asset."
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
            rowKey={(r) => r.additionalAssetId}
            emptyLabel="No additional IDs."
          />
        </div>
      </TabStatePanel>
    </div>
  );
}
