import { useEffect, useMemo, useState } from "react";
import {
  createControlDeviceMapping,
  listControlDeviceMappings,
  queryControlDeviceMasters,
  updateControlDeviceMapping,
} from "../../../api/endpoints";
import type { ControlDeviceMappingDto, ControlDeviceMasterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { FormSelect } from "../../../components/FormSelect";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";
import { AuthRequiredPanel, shouldShowAuthRequired } from "../AuthRequiredPanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt } from "../crud/crudFormUtils";
import {
  buildControlDeviceIndex,
  buildControlDeviceOptions,
  getControlDeviceDisplayForMapping,
  validateControlDeviceMappingForm,
  type ControlDeviceMappingFormState,
} from "./controlDevicesFlow";

type Row = ControlDeviceMappingDto;

// PUBLIC_INTERFACE
export function ControlDevicesTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Associated Control Devices CRUD
   * Backend:
   *  - GET/POST /api/assets/{assetId}/control-device-mappings
   *  - PUT /api/assets/{assetId}/control-device-mappings/{controlDeviceMappingId}
   * Masters:
   *  - GET /api/masters/control-devices?siteId={siteId}
   *
   * Contract (tab behavior):
   * - Loads master data + existing mappings on mount and on asset change.
   * - Allows create/edit only when caps permit it (RBAC handled by caller via caps).
   * - Validates required fields before save; surfaces backend validation errors via extractErrors.
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [masters, setMasters] = useState<ControlDeviceMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ControlDeviceMappingFormState>({
    controlDeviceId: "",
    controlDeviceTag: "",
    isActive: true,
  });

  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reloadMappings(): Promise<void> {
    const list = await listControlDeviceMappings(asset.assetId);
    setRows(list);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [mappings, devices] = await Promise.all([
          listControlDeviceMappings(asset.assetId),
          // IMPORTANT:
          // Do not hard-filter to ActiveOnly=true here; some environments have master rows present but not flagged active yet,
          // which causes an empty dropdown and blocks mapping creation/editing.
          queryControlDeviceMasters({ siteId: asset.siteId, limit: 1000 }),
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

  const deviceIndex = useMemo(() => buildControlDeviceIndex(masters), [masters]);
  const masterOptions = useMemo(() => buildControlDeviceOptions(masters), [masters]);

  function openCreate(): void {
    setEditing(null);
    setForm({ controlDeviceId: "", controlDeviceTag: "", isActive: true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      controlDeviceId: r.controlDeviceId !== null && r.controlDeviceId !== undefined ? String(r.controlDeviceId) : "",
      controlDeviceTag: r.controlDeviceTag ?? "",
      isActive: r.isActive ?? true,
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

    const validation = validateControlDeviceMappingForm({
      form,
      deviceIndex,
      mode: editing ? "edit" : "create",
    });

    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      setBanner(validation.banner ?? { title: "Validation failed" });
      return;
    }

    // Non-blocking warning (e.g. inactive master)
    if (validation.banner) setBanner(validation.banner);

    const cd = requireInt(form.controlDeviceId, "Control Device");
    if (cd.error || cd.value === null) {
      setFieldErrors({ controlDeviceId: cd.error || "Required" });
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();

      if (!editing) {
        await createControlDeviceMapping(asset.assetId, {
          controlDeviceId: cd.value,
          controlDeviceTag: form.controlDeviceTag.trim() ? form.controlDeviceTag.trim() : null,
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Control device mapping created" });
      } else {
        await updateControlDeviceMapping(asset.assetId, editing.controlDeviceMappingId, {
          controlDeviceId: cd.value,
          controlDeviceTag: form.controlDeviceTag.trim() ? form.controlDeviceTag.trim() : null,
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Control device mapping updated" });
      }

      await reloadMappings();
      setModalOpen(false);
    } catch (e) {
      const ex = extractErrors(e);
      setBanner({ title: ex.title, message: ex.message });
      setFieldErrors(ex.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "device",
        header: "Control Device",
        render: (r) => {
          const display = getControlDeviceDisplayForMapping({ row: r, deviceIndex });
          return (
            <div>
              <div className="text-sm font-semibold">{display.primaryLabel}</div>
              <div className="muted text-xs">
                <span className="font-mono">{display.secondaryLabel}</span>
              </div>
            </div>
          );
        },
      },
      { key: "tag", header: "Mapped Tag", render: (r) => <span className="font-mono text-xs">{r.controlDeviceTag ?? "-"}</span> },
      { key: "active", header: "Active", render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span> },
      {
        key: "actions",
        header: "",
        widthClassName: "w-28",
        render: (r) =>
          caps.canEdit ? (
            <button type="button" className="btn-ghost" onClick={() => openEdit(r)}>
              Edit
            </button>
          ) : (
            <button type="button" className="btn-ghost opacity-60" disabled title="Edit requires Editor or Admin role">
              Edit
            </button>
          ),
      },
    ],
    [caps.canEdit, deviceIndex],
  );

  if (shouldShowAuthRequired(error)) {
    return <AuthRequiredPanel title="Associated Control Devices" />;
  }

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
        emptyActions={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs opacity-80">
              Next step: Create control devices in <span className="font-semibold">Masters → Control Devices</span>, then map one or more
              to this asset here.
            </div>
            {caps.canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Create Mapping
              </button>
            ) : (
              <button type="button" className="btn-primary opacity-60" disabled title="Create requires Editor or Admin role">
                Create Mapping
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Associated Control Devices"
            description="Map site control devices to this asset."
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Mapping"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.controlDeviceMappingId} emptyLabel="No control device mappings." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Control Device Mapping" : "Create Control Device Mapping"}
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
          <FormSelect
            label="Control Device"
            value={form.controlDeviceId}
            onChange={(v) => setForm((s) => ({ ...s, controlDeviceId: v }))}
            options={masterOptions}
            error={fieldErrors.controlDeviceId}
            placeholder="Select…"
            helpText={
              masters.length === 0 ? (
                <>
                  No control devices were returned for this site.
                  <br />
                  Create them in <span className="font-semibold">Masters → Control Devices</span>, or verify the asset’s Site ID.
                </>
              ) : null
            }
          />

          <FormInput
            label="Control Device Tag (optional)"
            value={form.controlDeviceTag}
            onChange={(v) => setForm((s) => ({ ...s, controlDeviceTag: v }))}
            error={fieldErrors.controlDeviceTag}
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
