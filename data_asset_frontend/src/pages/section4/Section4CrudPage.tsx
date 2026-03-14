import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "../../components/DataTable";
import { FormInput } from "../../components/FormInput";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../state/AuthContext";
import { useToasts } from "../../state/ToastContext";
import type { Role } from "../../api/types";
import { getUiCapabilities } from "../../lib/rbac";
import { extractErrors, validateRequiredStrings } from "../asset-details/crud/crudFormUtils";

type Banner = { title: string; message?: string } | null;

export type CrudItem = { id: string; siteId: string; name: string };

type Props = {
  title: string;
  description: string;
  nameLabel: string;

  list: (params?: { siteId?: string; limit?: number }) => Promise<unknown[]>;
  create: (body: { siteId: string; name: string; createdBy: string; correlationId: string }) => Promise<unknown>;
  update: (id: string, body: { siteId: string; name: string; modifiedBy: string; correlationId: string }) => Promise<unknown>;
  remove: (id: string, body: { modifiedBy: string; correlationId: string }) => Promise<void>;

  mapFromBackend: (row: any) => CrudItem;
};

function defaultString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// PUBLIC_INTERFACE
export function Section4CrudPage(props: Props) {
  /** Generic Section 4 CRUD Page
   * - Uses the same RBAC gating as Assets: Viewer read-only, Editor write, Admin delete.
   * - UX: table + modal create/edit + delete confirmation modal.
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();
  const caps = getUiCapabilities(user?.role as Role | null | undefined);

  const [rows, setRows] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [filterSiteId, setFilterSiteId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrudItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<CrudItem | null>(null);

  const [form, setForm] = useState({ siteId: "", name: "" });
  const [banner, setBanner] = useState<Banner>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const list = await props.list({ siteId: filterSiteId.trim() || undefined, limit: 500 });
    const mapped = Array.isArray(list) ? list.map(props.mapFromBackend) : [];
    setRows(mapped);
  }

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const list = await props.list({ limit: 200 });
        if (!mounted) return;
        const mapped = Array.isArray(list) ? list.map(props.mapFromBackend) : [];
        setRows(mapped);
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
  }, [props]);

  function openCreate(): void {
    setEditing(null);
    setForm({ siteId: "", name: "" });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: CrudItem): void {
    setEditing(r);
    setForm({ siteId: r.siteId ?? "", name: r.name ?? "" });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function onSave(): Promise<void> {
    if (!user?.username) {
      setBanner({ title: "Not signed in", message: "Please login again." });
      return;
    }

    setBanner(null);
    setFieldErrors({});

    const reqErrors = validateRequiredStrings({
      siteId: form.siteId,
      name: form.name,
    });

    if (Object.keys(reqErrors).length > 0) {
      setFieldErrors(reqErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      if (!editing) {
        await props.create({
          siteId: form.siteId.trim(),
          name: form.name.trim(),
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: `${props.title} created` });
      } else {
        await props.update(editing.id, {
          siteId: form.siteId.trim(),
          name: form.name.trim(),
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: `${props.title} updated` });
      }

      await reload();
      setModalOpen(false);
    } catch (e) {
      const ex = extractErrors(e);
      setBanner({ title: ex.title, message: ex.message });
      setFieldErrors(ex.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  function openDelete(r: CrudItem): void {
    setDeleting(r);
    setDeleteOpen(true);
  }

  async function onConfirmDelete(): Promise<void> {
    if (!deleting || !user?.username) return;

    try {
      const correlationId = crypto.randomUUID();
      await props.remove(deleting.id, { modifiedBy: user.username, correlationId });
      pushToast({ type: "success", title: `${props.title} deleted` });
      setDeleteOpen(false);
      setDeleting(null);
      await reload();
    } catch (e) {
      const ex = extractErrors(e);
      pushToast({ type: "error", title: ex.title, message: ex.message });
    }
  }

  const columns: Column<CrudItem>[] = useMemo(
    () => [
      { key: "siteId", header: "Site ID", render: (r) => <span className="text-sm">{r.siteId}</span> },
      { key: "name", header: props.nameLabel, render: (r) => <span className="text-sm font-semibold">{r.name}</span> },
      {
        key: "actions",
        header: "",
        widthClassName: "w-48",
        render: (r) => (
          <div className="flex items-center justify-end gap-2">
            {caps.canEdit ? (
              <button type="button" className="btn-ghost" onClick={() => openEdit(r)}>
                Edit
              </button>
            ) : (
              <button type="button" className="btn-ghost opacity-60" disabled title="Edit requires Editor or Admin role">
                Edit
              </button>
            )}

            {caps.canDelete ? (
              <button type="button" className="btn-danger" onClick={() => openDelete(r)}>
                Delete
              </button>
            ) : (
              <button type="button" className="btn-danger opacity-60" disabled title="Delete requires Admin role">
                Delete
              </button>
            )}
          </div>
        ),
      },
    ],
    [caps.canDelete, caps.canEdit, props.nameLabel],
  );

  const filteredRows = useMemo(() => {
    const s = filterSiteId.trim();
    if (!s) return rows;
    return rows.filter((r) => defaultString(r.siteId).includes(s));
  }, [filterSiteId, rows]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{props.title}</h1>
        <p className="muted mt-1">{props.description}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-sm">
            <FormInput label="Filter by Site ID" value={filterSiteId} onChange={(v) => setFilterSiteId(v)} placeholder="e.g. SITE-001" />
          </div>

          {caps.canCreate ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              Create
            </button>
          ) : (
            <button type="button" className="btn-primary opacity-60" disabled title="Create requires Editor or Admin role">
              Create
            </button>
          )}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="muted text-sm">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-700 dark:text-red-200">Failed to load rows.</div>
          ) : (
            <DataTable<CrudItem> columns={columns} rows={filteredRows} rowKey={(r) => r.id} emptyLabel="No records." />
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${props.title}` : `Create ${props.title}`}
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        {banner ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
            <div className="font-semibold">{banner.title}</div>
            {banner.message ? <div className="mt-1">{banner.message}</div> : null}
          </div>
        ) : null}

        <div className="space-y-3">
          <FormInput label="Site ID" value={form.siteId} onChange={(v) => setForm((s) => ({ ...s, siteId: v }))} error={fieldErrors.siteId} />
          <FormInput label={props.nameLabel} value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} error={fieldErrors.name} />
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Confirm delete"
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button className="btn-danger" type="button" onClick={onConfirmDelete}>
              Delete
            </button>
          </>
        }
      >
        <div className="text-sm">
          Delete <span className="font-semibold">{deleting?.name}</span>? This is a soft-delete in the backend.
        </div>
      </Modal>
    </div>
  );
}
