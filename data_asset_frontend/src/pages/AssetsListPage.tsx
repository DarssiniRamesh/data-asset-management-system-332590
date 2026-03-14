import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCopy, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { listAssets, deleteAsset } from "../api/endpoints";
import type { AssetDto } from "../api/types";
import { DataTable, type Column } from "../components/DataTable";
import { Icon } from "../components/Icon";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { Modal } from "../components/Modal";
import { useToasts } from "../state/ToastContext";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { ApiError } from "../api/client";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export function AssetsListPage() {
  /** Contract:
   * - Lists assets via GET /api/assets
   * - Client-side search/filter/pagination (backend may later provide query params)
   */
  const { pushToast } = useToasts();
  const { user } = useAuth();
  const [rows, setRows] = useState<AssetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [deleteId, setDeleteId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      setLoading(true);
      try {
        const data = await listAssets();
        if (mounted) setRows(data);
      } catch (e) {
        pushToast({ type: "error", title: "Failed to load assets" });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [pushToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.assetId,
        r.assetName,
        r.siteId,
        r.assetGroup,
        r.processGroup,
        r.globalUniqueAssetId,
        r.permitEuId,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [query, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const p = Math.min(Math.max(page, 1), totalPages);
    const start = (p - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, totalPages]);

  const columns: Column<AssetDto>[] = [
    { key: "assetName", header: "Asset", render: (r) => <div className="font-semibold">{r.assetName}</div> },
    { key: "siteId", header: "Site", render: (r) => r.siteId },
    { key: "assetGroup", header: "Asset Group", render: (r) => r.assetGroup },
    { key: "processGroup", header: "Process Group", render: (r) => r.processGroup },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/assets/${r.assetId}`} className="btn-ghost" title="View">
            <Icon icon={FaEye} className="h-4 w-4" />
          </Link>
          <Link to={`/app/assets/${r.assetId}/copy`} className="btn-ghost" title="Copy">
            <Icon icon={FaCopy} className="h-4 w-4" />
          </Link>
          <button className="btn-ghost" title="Delete" onClick={() => setDeleteId(r.assetId)}>
            <Icon icon={FaTrash} className="h-4 w-4" />
          </button>
        </div>
      ),
      widthClassName: "w-[160px]",
    },
  ];

  async function confirmDelete(): Promise<void> {
    const id = deleteId;
    setDeleteId("");
    try {
      await deleteAsset(id, {
        modifiedBy: user?.username || "frontend",
        correlationId: `corr-${Date.now()}`,
      });
      setRows((prev) => prev.filter((r) => r.assetId !== id));
      pushToast({ type: "success", title: "Asset deleted" });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.details.bodyText || `HTTP ${e.details.status}`
          : e instanceof Error
            ? e.message
            : String(e);

      pushToast({ type: "error", title: "Delete failed", message: msg });
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs crumbs={[{ label: "Dashboard", to: "/app" }, { label: "Assets" }]} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Assets</h1>
          <p className="muted mt-1">Search, filter, and manage your asset catalog.</p>
        </div>

        <Link to="/app/assets/create" className="btn-primary">
          <Icon icon={FaPlus} className="h-4 w-4" /> Create Asset
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <label className="block lg:col-span-2">
          <div className="label">Search</div>
          <input
            className="input mt-1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, site, group, IDs..."
          />
        </label>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <div className="font-semibold">Results</div>
          <div className="muted mt-1">
            {filtered.length} assets • page {page} / {totalPages}
          </div>
        </div>
      </div>

      {loading ? (
        <LoaderSpinner label="Loading assets..." />
      ) : (
        <>
          <DataTable columns={columns} rows={pageRows} rowKey={(r) => r.assetId} emptyLabel="No assets found." />
          <div className="flex items-center justify-between">
            <button className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </button>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      <Modal
        open={Boolean(deleteId)}
        title="Delete asset?"
        onClose={() => setDeleteId("")}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId("")}>
              Cancel
            </button>
            <button className="btn-primary" onClick={confirmDelete}>
              Confirm
            </button>
          </>
        }
      >
        <div className="text-sm text-slate-700 dark:text-slate-200">
          This action requires Admin role and cannot be undone.
        </div>
      </Modal>
    </div>
  );
}
