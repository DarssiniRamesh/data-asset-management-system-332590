import { useEffect, useMemo, useState } from "react";
import { listControlDeviceMappings, queryControlDeviceMasters } from "../../../api/endpoints";
import type { ControlDeviceMappingDto, ControlDeviceMasterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";

type Row = ControlDeviceMappingDto;

function buildDeviceIndex(masters: ControlDeviceMasterDto[]): Map<string, ControlDeviceMasterDto> {
  const m = new Map<string, ControlDeviceMasterDto>();
  for (const d of masters) m.set(d.controlDeviceId, d);
  return m;
}

// PUBLIC_INTERFACE
export function ControlDevicesTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - BRD-required control device mappings for this asset.
   * Backend:
   *  - GET /api/assets/{assetId}/control-device-mappings
   *  - GET /api/masters/control-devices?siteId={siteId}
   * RBAC:
   *  - Viewer: read-only (no create/update UI in this step).
   */
  const [rows, setRows] = useState<Row[]>([]);
  const [masters, setMasters] = useState<ControlDeviceMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [mappings, devices] = await Promise.all([
          listControlDeviceMappings(asset.assetId),
          queryControlDeviceMasters({ siteId: asset.siteId, activeOnly: true, limit: 500 }),
        ]);

        if (!mounted) return;
        setRows(mappings);
        setMasters(devices);
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
  }, [asset.assetId, asset.siteId]);

  const deviceIndex = useMemo(() => buildDeviceIndex(masters), [masters]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "device",
        header: "Control Device",
        render: (r) => {
          const id = r.controlDeviceId ?? null;
          const master = id !== null ? deviceIndex.get(String(id)) : undefined;
          return (
            <div>
              <div className="text-sm font-semibold">
                {master?.deviceName ?? master?.deviceTag ?? "Unknown device"}
              </div>
              <div className="muted text-xs">
                ID: <span className="font-mono">{id ?? "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "tag",
        header: "Mapped Tag",
        render: (r) => <span className="font-mono text-xs">{r.controlDeviceTag ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span>,
      },
    ],
    [deviceIndex],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Associated Control Devices"
        description="BRD-required control device mappings for this asset."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No control device mappings"
        emptyMessage="No control devices are currently mapped to this asset."
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
            rowKey={(r) => r.controlDeviceMappingId}
            emptyLabel="No control device mappings."
          />

          <div className="muted text-xs">
            Master data loaded: <span className="font-mono">{masters.length}</span> control devices (siteId:{" "}
            <span className="font-mono">{asset.siteId}</span>).
          </div>
        </div>
      </TabStatePanel>
    </div>
  );
}
