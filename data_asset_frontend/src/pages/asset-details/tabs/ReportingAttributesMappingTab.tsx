import { useEffect, useMemo, useState } from "react";
import { listReportingAttributeMappings, queryReportingProgramMasters } from "../../../api/endpoints";
import type { ReportingAttributeMappingDto, ReportingProgramMasterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";

type Row = ReportingAttributeMappingDto;

function buildProgramIndex(masters: ReportingProgramMasterDto[]): Map<string, ReportingProgramMasterDto> {
  const m = new Map<string, ReportingProgramMasterDto>();
  for (const p of masters) m.set(p.reportingProgramId, p);
  return m;
}

// PUBLIC_INTERFACE
export function ReportingAttributesMappingTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - BRD-required reporting attributes mapping module.
   * Backend:
   *  - GET /api/assets/{assetId}/reporting-attribute-mappings
   *  - GET /api/masters/reporting-programs
   * RBAC:
   *  - Viewer: read-only (no create/update UI in this step).
   */
  const [rows, setRows] = useState<Row[]>([]);
  const [programs, setPrograms] = useState<ReportingProgramMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [mappings, masters] = await Promise.all([
          listReportingAttributeMappings(asset.assetId),
          queryReportingProgramMasters({ activeOnly: true, limit: 500 }),
        ]);
        if (!mounted) return;
        setRows(mappings);
        setPrograms(masters);
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

  const programIndex = useMemo(() => buildProgramIndex(programs), [programs]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "program",
        header: "Reporting Program",
        render: (r) => {
          const id = r.reportingProgramId ?? null;
          const p = id !== null ? programIndex.get(String(id)) : undefined;
          return (
            <div>
              <div className="text-sm font-semibold">{p?.programName ?? "Unknown program"}</div>
              <div className="muted text-xs">
                ID: <span className="font-mono">{id ?? "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "name",
        header: "Attribute",
        render: (r) => <span className="text-sm font-semibold">{r.reportingAttributeName ?? "-"}</span>,
      },
      {
        key: "value",
        header: "Value",
        render: (r) => <span className="text-sm">{r.reportingAttributeValue ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span>,
      },
    ],
    [programIndex],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Reporting Attributes Mapping"
        description="BRD-required reporting attributes mapping module."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No reporting attribute mappings"
        emptyMessage="No reporting attribute mappings were found for this asset."
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
            rowKey={(r) => r.reportingAttributeMappingId}
            emptyLabel="No reporting attribute mappings."
          />
        </div>
      </TabStatePanel>
    </div>
  );
}
