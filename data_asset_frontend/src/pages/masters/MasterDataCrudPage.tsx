import { useEffect, useMemo, useState } from "react";
import type { Column } from "../../components/DataTable";
import { DataTable } from "../../components/DataTable";
import { FormInput } from "../../components/FormInput";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../state/AuthContext";
import { useToasts } from "../../state/ToastContext";
import type { Role } from "../../api/types";
import { getUiCapabilities } from "../../lib/rbac";
import { extractErrors, validateRequiredStrings } from "../asset-details/crud/crudFormUtils";

type Banner = { title: string; message?: string } | null;

export type MasterCrudRow = {
  id: string;
  // Display fields (stringified) – individual screens choose which to show.
  col1?: string | null;
  col2?: string | null;
  col3?: string | null;
  isActive?: boolean;
};

export type MasterCrudField = {
  key: "col1" | "col2" | "col3";
  label: string;
  placeholder?: string;
  required?: boolean;
};

type Props = {
  title: string;
  description: string;

  columns: { key: "col1" | "col2" | "col3"; header: string; widthClassName?: string }[];
  fields: MasterCrudField[];

  list: (params?: { activeOnly?: boolean; limit?: number }) => Promise<unknown[]>;
  create: (body: {
    col1?: string;
    col2?: string;
    col3?: string;
    createdBy: string;
    correlationId: string;
  }) => Promise<unknown>;
  update: (
    id: string,
    body: {
      col1?: string;
      col2?: string;
      col3?: string;
      modifiedBy: string;
      correlationId: string;
    },
  ) => Promise<unknown>;

  /**
   * Soft-disable supported by most masters (no DELETE in backend spec).
   * If omitted, UI will not show the Disable action.
   */
  disable?: (id: string, body: { modifiedBy: string; correlationId: string }) => Promise<unknown>;

  mapFromBackend: (row: any) => MasterCrudRow;
};

function defaultStr(v: unknown): string {
  return typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
}

function boolish(v: unknown): boolean {
  return v === true;
}

// PUBLIC_INTERFACE
export function MasterDataCrudPage(props: Props) {
  /** Generic Master Data CRUD page
   * - UX: list with simple search + modal create/edit + confirmation modal for disable
   * - RBAC:
   *    - Viewer: read-only
   *    - Editor/Admin: create/edit
   *    - Admin: disable (destructive-ish)
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();
  const caps = getUiCapabilities(user?.role as Role | null | undefined);

  const [rows, setRows] = useState<MasterCrudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MasterCrudRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [disabling, setDisabling] = useState<MasterCrudRow | null>(null);

  const [banner, setBanner] = useState<Banner>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ col1: "", col2: "", col3: "" });

  async function reload(): Promise<void> {
    const list = await props.list({ activeOnly, limit: 500 });
    const mapped = Array.isArray(list) ? list.map(props.mapFromBackend) : [];
    setRows(mapped);
  }

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const list = await props.list({ activeOnly, limit: 200 });
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
  }, [activeOnly, props]);

  function openCreate(): void {
    setEditing(null);
    setForm({ col1: "", col2: "", col3: "" });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: MasterCrudRow): void {
    setEditing(r);
    setForm({
      col1: defaultStr(r.col1),
      col2: defaultStr(r.col2),
      col3: defaultStr(r.col3),
    });
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

    const required: Record<string, string> = {};
    for (const f of props.fields) {
      if (!f.required) continue;
      required[f.key] = (form as any)[f.key] as string;
    }
    const reqErrors = validateRequiredStrings(required);

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
          col1: form.col1.trim(),
          col2: form.col2.trim(),
          col3: form.col3.trim(),
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: `${props.title} created` });
      } else {
        await props.update(editing.id, {
          col1: form.col1.trim(),
          col2: form.col2.trim(),
          col3: form.col3.trim(),
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

  function openDisable(r: MasterCrudRow): void {
    setDisabling(r);
    setConfirmDisableOpen(true);
  }

  async function onConfirmDisable(): Promise<void> {
    if (!props.disable || !disabling || !user?.username) return;

    try {
      const correlationId = crypto.randomUUID();
      await props.disable(disabling.id, { modifiedBy: user.username, correlationId });
      pushToast({ type: "success", title: `${props.title} disabled` });
      setConfirmDisableOpen(false);
      setDisabling(null);
      await reload();
    } catch (e) {
      const ex = extractErrors(e);
      pushToast({ type: "error", title: ex.title, message: ex.message });
    }
  }

  const columns: Column<MasterCrudRow>[] = useMemo(() => {
    const cols: Column<MasterCrudRow>[] = props.columns.map((c) => ({
      key: c.key,
      header: c.header,
      widthClassName: c.widthClassName,
      render: (r) => <span className="text-sm">{defaultStr((r as any)[c.key])}</span>,
    }));

    cols.push({
      key: "active",
      header: "Active",
      widthClassName: "w-28",
      render: (r) => (
        <span
          className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
            r.isActive === false
              ? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-800"
              : "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40",
          ].join(" ")}
        >
          {r.isActive === false ? "No" : "Yes"}
        </span>
      ),
    });

    cols.push({
      key: "actions",
      header: "",
      widthClassName: "w-56",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          {caps.canEdit ? (
            <button type="button" className="btn-ghost" onClick={() => openEdit(r)}>
              Edit
            </button>
          ) : (
            <button
              type="button"
              className="btn-ghost opacity-60"
              disabled
              title="Edit requires Editor or Admin role"
            >
              Edit
            </button>
          )}

          {props.disable ? (
            caps.canDelete ? (
              <button
                type="button"
                className="btn-danger"
                onClick={() => openDisable(r)}
                disabled={r.isActive === false}
                title={r.isActive === false ? "Already disabled" : "Disable (soft-delete)"}
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                className="btn-danger opacity-60"
                disabled
                title="Disable requires Admin role"
              >
                Disable
              </button>
            )
          ) : null}
        </div>
      ),
    });

    return cols;
  }, [caps.canDelete, caps.canEdit, props.columns, props.disable]);

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = activeOnly ? rows.filter((r) => r.isActive !== false) : rows;
    if (!s) return base;

    return base.filter((r) => {
      const hay = [r.id, r.col1, r.col2, r.col3].map((x) => defaultStr(x).toLowerCase()).join(" ");
      return hay.includes(s);
    });
  }, [activeOnly, rows, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{props.title}</h1>
        <p className="muted mt-1">{props.description}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <div className="w-full max-w-sm">
              <FormInput
                label="Search"
                value={search}
                onChange={setSearch}
                placeholder="Search by any field…"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Active only
            </label>
          </div>

          {caps.canCreate ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              Create
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary opacity-60"
              disabled
              title="Create requires Editor or Admin role"
            >
              Create
            </button>
          )}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="muted text-sm">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-700 dark:text-red-200">Failed to load rows.</div>
          ) : (
            <DataTable<MasterCrudRow>
              columns={columns}
              rows={filteredRows}
              rowKey={(r) => r.id}
              emptyLabel="No records."
            />
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
              {saving ? "Saving…" : "Save"}
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
          {props.fields.map((f) => (
            <FormInput
              key={f.key}
              label={f.label}
              value={(form as any)[f.key] as string}
              onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
              placeholder={f.placeholder}
              error={fieldErrors[f.key]}
            />
          ))}
        </div>
      </Modal>

      <Modal
        open={confirmDisableOpen}
        title="Confirm disable"
        onClose={() => setConfirmDisableOpen(false)}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setConfirmDisableOpen(false)}>
              Cancel
            </button>
            <button className="btn-danger" type="button" onClick={onConfirmDisable}>
              Disable
            </button>
          </>
        }
      >
        <div className="text-sm">
          Disable this record? This is a soft-disable (sets <span className="font-mono">isActive=false</span>) and may
          affect asset configuration dropdowns.
          <div className="mt-2">
            Target: <span className="font-semibold">{defaultStr(disabling?.col1 || disabling?.col2 || disabling?.id)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
