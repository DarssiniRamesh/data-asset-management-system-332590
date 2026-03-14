import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../../api/client";
import { listInputParameters } from "../../../api/endpoints";
import { parseApiError } from "../../../api/errorHandling";
import type { InputParameterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { LoaderSpinner } from "../../../components/LoaderSpinner";
import { roleLabel } from "../../../lib/rbac";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";

type Row = InputParameterDto;

// PUBLIC_INTERFACE
export function InputParametersTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD step 04.01
   * Contract:
   * Purpose:
   *  - This tab is the canonical selector for the "current input parameter".
   *  - Downstream modules (EF Source Mapping / Throughput Setup / Data Input) MUST use this selection.
   * Behavior:
   *  - Loads via GET /api/assets/{assetId}/input-parameters
   *  - Selecting a row updates shared selection context
   * RBAC:
   *  - Viewer: read-only (no create/edit). Selection is still allowed to view downstream tabs.
   *  - Editor/Admin: will later get create/edit UX here; not part of this step.
   */
  const { pushToast } = useToasts();
  const { selectedInputParameterId, setSelectedInputParameterId } = useInputParameterSelection();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      try {
        const list = await listInputParameters(asset.assetId);
        if (!mounted) return;

        setRows(list);

        // If selection is empty or no longer exists, default to first row (if any).
        if (list.length > 0) {
          const stillExists = selectedInputParameterId
            ? list.some((r) => r.inputParameterId === selectedInputParameterId)
            : false;

          if (!selectedInputParameterId || !stillExists) {
            setSelectedInputParameterId(list[0].inputParameterId);
          }
        } else {
          setSelectedInputParameterId(null);
        }
      } catch (e) {
        const parsed = parseApiError(e);
        pushToast({
          type: "error",
          title: parsed?.title || "Failed to load input parameters",
          message:
            parsed?.message ||
            (e instanceof ApiError
              ? e.details.bodyText || `HTTP ${e.details.status}`
              : e instanceof Error
                ? e.message
                : String(e)),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [asset.assetId, pushToast, selectedInputParameterId, setSelectedInputParameterId]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "selected",
        header: "",
        widthClassName: "w-10",
        render: (r) => {
          const isSelected = r.inputParameterId === selectedInputParameterId;
          return (
            <div className="flex items-center justify-center">
              <input
                type="radio"
                aria-label={`Select ${r.inputParameterName || r.inputParameterId}`}
                checked={isSelected}
                onChange={() => setSelectedInputParameterId(r.inputParameterId)}
              />
            </div>
          );
        },
      },
      {
        key: "name",
        header: "Input Parameter",
        render: (r) => (
          <button
            type="button"
            className="text-left font-semibold text-slate-900 hover:underline dark:text-slate-100"
            onClick={() => setSelectedInputParameterId(r.inputParameterId)}
          >
            {r.inputParameterName || "(Unnamed)"}
            <div className="muted text-xs font-normal">ID: {r.inputParameterId}</div>
          </button>
        ),
      },
      {
        key: "uom",
        header: "UOM",
        render: (r) => <span className="text-sm">{r.uomId ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              (r.isActive ?? true)
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300"
            }`}
          >
            {(r.isActive ?? true) ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    [selectedInputParameterId, setSelectedInputParameterId],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Associated Input Parameters</div>
            <div className="muted mt-1">
              Select an input parameter. This selection drives EF Source Mapping, Throughput Setup, and Data Input tabs.
            </div>
          </div>

          {!caps.canEdit ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          {loading ? (
            <LoaderSpinner label="Loading input parameters..." />
          ) : (
            <DataTable<Row>
              columns={columns}
              rows={rows}
              rowKey={(r) => r.inputParameterId}
              emptyLabel="No input parameters found for this asset."
            />
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Current selection
          </div>
          <div className="mt-1">
            {selectedInputParameterId ? (
              <>
                Input Parameter ID: <span className="font-mono font-semibold">{selectedInputParameterId}</span>
              </>
            ) : (
              <span className="muted">None selected.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
