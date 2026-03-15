import { useEffect, useMemo, useState } from "react";
import {
  createThroughputEquation,
  createThroughputScalar,
  listThroughputEquations,
  listThroughputScalars,
  queryEquationMasters,
  queryUomMasters,
  updateThroughputEquation,
  updateThroughputScalar,
} from "../../../api/endpoints";
import type {
  EquationMasterDto,
  ThroughputEquationDto,
  ThroughputScalarDto,
  UomMasterDto,
} from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { FormSelect } from "../../../components/FormSelect";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";
import { AuthRequiredPanel, shouldShowAuthRequired } from "../AuthRequiredPanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt, validateRequiredStrings } from "../crud/crudFormUtils";

type EqRow = ThroughputEquationDto;
type ScalarRow = ThroughputScalarDto;

function buildEquationIndex(masters: EquationMasterDto[]): Map<string, EquationMasterDto> {
  const m = new Map<string, EquationMasterDto>();
  for (const e of masters) m.set(e.equationMasterId, e);
  return m;
}

function buildUomIndex(masters: UomMasterDto[]): Map<string, UomMasterDto> {
  const m = new Map<string, UomMasterDto>();
  for (const u of masters) m.set(u.uomId, u);
  return m;
}

// PUBLIC_INTERFACE
export function ThroughputSetupTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Calculated Throughput Setup CRUD (equations + scalars)
   * Scope: assetId + selected inputParameterId
   * Backend:
   *  - GET/POST/PUT throughput-equations
   *  - GET/POST/PUT throughput-scalars (scoped under equation)
   * Masters:
   *  - GET /api/masters/equations
   *  - GET /api/masters/uoms
   */
  const { selectedInputParameterId } = useInputParameterSelection();
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<EqRow[]>([]);
  const [equations, setEquations] = useState<EquationMasterDto[]>([]);
  const [uoms, setUoms] = useState<UomMasterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [eqModalOpen, setEqModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<EqRow | null>(null);
  const [eqSaving, setEqSaving] = useState(false);
  const [eqForm, setEqForm] = useState({ equationMasterId: "", equationText: "", isActive: true });
  const [eqBanner, setEqBanner] = useState<{ title: string; message?: string } | null>(null);
  const [eqFieldErrors, setEqFieldErrors] = useState<Record<string, string>>({});

  const [scalarModalOpen, setScalarModalOpen] = useState(false);
  const [scalarEq, setScalarEq] = useState<EqRow | null>(null);
  const [scalars, setScalars] = useState<ScalarRow[]>([]);
  const [scalarLoading, setScalarLoading] = useState(false);

  const [scalarEdit, setScalarEdit] = useState<ScalarRow | null>(null);
  const [scalarSaving, setScalarSaving] = useState(false);
  const [scalarForm, setScalarForm] = useState({ scalarName: "", scalarValue: "", uomId: "", isActive: true });
  const [scalarBanner, setScalarBanner] = useState<{ title: string; message?: string } | null>(null);
  const [scalarFieldErrors, setScalarFieldErrors] = useState<Record<string, string>>({});

  async function reloadEquations(): Promise<void> {
    if (!selectedInputParameterId) return;
    const list = await listThroughputEquations(asset.assetId, selectedInputParameterId);
    setRows(list);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      if (!selectedInputParameterId) {
        setRows([]);
        setEquations([]);
        setUoms([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [list, masters, uomMasters] = await Promise.all([
          listThroughputEquations(asset.assetId, selectedInputParameterId),
          queryEquationMasters({ activeOnly: true, limit: 1000 }),
          queryUomMasters({ activeOnly: true, limit: 1000 }),
        ]);
        if (!mounted) return;
        setRows(list);
        setEquations(masters);
        setUoms(uomMasters);
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
  const uomIndex = useMemo(() => buildUomIndex(uoms), [uoms]);

  function openCreateEquation(): void {
    setEditingEq(null);
    setEqForm({ equationMasterId: "", equationText: "", isActive: true });
    setEqBanner(null);
    setEqFieldErrors({});
    setEqModalOpen(true);
  }

  function openEditEquation(r: EqRow): void {
    setEditingEq(r);
    setEqForm({
      equationMasterId: r.equationMasterId !== null && r.equationMasterId !== undefined ? String(r.equationMasterId) : "",
      equationText: r.equationText ?? "",
      isActive: r.isActive ?? true,
    });
    setEqBanner(null);
    setEqFieldErrors({});
    setEqModalOpen(true);
  }

  async function saveEquation(): Promise<void> {
    if (!selectedInputParameterId) return;
    if (!user?.username) {
      setEqBanner({ title: "Not signed in", message: "Please login again." });
      return;
    }

    setEqBanner(null);
    setEqFieldErrors({});

    const reqErrors = validateRequiredStrings({ equationMasterId: eqForm.equationMasterId });
    const eqId = requireInt(eqForm.equationMasterId, "Equation Master");
    if (eqId.error) reqErrors.equationMasterId = eqId.error;

    if (Object.keys(reqErrors).length > 0) {
      setEqFieldErrors(reqErrors);
      setEqBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setEqSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      if (!editingEq) {
        await createThroughputEquation(asset.assetId, selectedInputParameterId, {
          equationMasterId: eqId.value!,
          equationText: eqForm.equationText.trim() ? eqForm.equationText.trim() : null,
          isActive: eqForm.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Equation created" });
      } else {
        await updateThroughputEquation(asset.assetId, selectedInputParameterId, editingEq.throughputEquationId, {
          equationMasterId: eqId.value!,
          equationText: eqForm.equationText.trim() ? eqForm.equationText.trim() : null,
          isActive: eqForm.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Equation updated" });
      }

      await reloadEquations();
      setEqModalOpen(false);
    } catch (e) {
      const ex = extractErrors(e);
      setEqBanner({ title: ex.title, message: ex.message });
      setEqFieldErrors(ex.fieldErrors);
    } finally {
      setEqSaving(false);
    }
  }

  async function openScalars(eq: EqRow): Promise<void> {
    if (!selectedInputParameterId) return;
    setScalarEq(eq);
    setScalarModalOpen(true);
    setScalarEdit(null);
    setScalarBanner(null);
    setScalarFieldErrors({});
    setScalarForm({ scalarName: "", scalarValue: "", uomId: "", isActive: true });

    setScalarLoading(true);
    try {
      const list = await listThroughputScalars(asset.assetId, selectedInputParameterId, eq.throughputEquationId);
      setScalars(list);
    } catch (e) {
      const ex = extractErrors(e);
      pushToast({ type: "error", title: ex.title, message: ex.message });
      setScalars([]);
    } finally {
      setScalarLoading(false);
    }
  }

  function openCreateScalar(): void {
    setScalarEdit(null);
    setScalarBanner(null);
    setScalarFieldErrors({});
    setScalarForm({ scalarName: "", scalarValue: "", uomId: "", isActive: true });
  }

  function openEditScalar(r: ScalarRow): void {
    setScalarEdit(r);
    setScalarBanner(null);
    setScalarFieldErrors({});
    setScalarForm({
      scalarName: r.scalarName ?? "",
      scalarValue: r.scalarValue !== null && r.scalarValue !== undefined ? String(r.scalarValue) : "",
      uomId: r.uomId !== null && r.uomId !== undefined ? String(r.uomId) : "",
      isActive: r.isActive ?? true,
    });
  }

  async function saveScalar(): Promise<void> {
    if (!selectedInputParameterId || !scalarEq) return;
    if (!user?.username) {
      setScalarBanner({ title: "Not signed in", message: "Please login again." });
      return;
    }

    setScalarBanner(null);
    setScalarFieldErrors({});

    const reqErrors = validateRequiredStrings({
      scalarName: scalarForm.scalarName,
      scalarValue: scalarForm.scalarValue,
    });

    const val = Number(scalarForm.scalarValue);
    if (!Number.isFinite(val)) reqErrors.scalarValue = "Scalar Value must be a number";

    const uom = scalarForm.uomId ? requireInt(scalarForm.uomId, "UOM") : { value: null as number | null };

    if (Object.keys(reqErrors).length > 0) {
      setScalarFieldErrors(reqErrors);
      setScalarBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setScalarSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      if (!scalarEdit) {
        await createThroughputScalar(asset.assetId, selectedInputParameterId, scalarEq.throughputEquationId, {
          scalarName: scalarForm.scalarName.trim(),
          scalarValue: val,
          uomId: uom.value,
          isActive: scalarForm.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Scalar created" });
      } else {
        await updateThroughputScalar(
          asset.assetId,
          selectedInputParameterId,
          scalarEq.throughputEquationId,
          scalarEdit.throughputScalarId,
          {
            scalarName: scalarForm.scalarName.trim(),
            scalarValue: val,
            uomId: uom.value,
            isActive: scalarForm.isActive,
            modifiedBy: user.username,
            correlationId,
          },
        );
        pushToast({ type: "success", title: "Scalar updated" });
      }

      const list = await listThroughputScalars(asset.assetId, selectedInputParameterId, scalarEq.throughputEquationId);
      setScalars(list);
      openCreateScalar();
    } catch (e) {
      const ex = extractErrors(e);
      setScalarBanner({ title: ex.title, message: ex.message });
      setScalarFieldErrors(ex.fieldErrors);
    } finally {
      setScalarSaving(false);
    }
  }

  const columns: Column<EqRow>[] = useMemo(
    () => [
      {
        key: "equation",
        header: "Equation",
        render: (r) => {
          const id = r.equationMasterId ?? null;
          const master = id !== null ? equationIndex.get(String(id)) : undefined;
          return (
            <div>
              <div className="text-sm font-semibold">
                {master?.equationKey ?? master?.versionLabel ?? "Unknown equation"}
              </div>
              <div className="muted text-xs">
                Master ID: <span className="font-mono">{id ?? "-"}</span>
              </div>
            </div>
          );
        },
      },
      { key: "text", header: "Equation Text", render: (r) => <span className="text-sm">{r.equationText ?? "-"}</span> },
      { key: "active", header: "Active", render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span> },
      {
        key: "actions",
        header: "",
        widthClassName: "w-64",
        render: (r) => (
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={() => openScalars(r)}>
              Scalars…
            </button>
            {caps.canEdit ? (
              <button type="button" className="btn-ghost" onClick={() => openEditEquation(r)}>
                Edit
              </button>
            ) : (
              <button type="button" className="btn-ghost opacity-60" disabled title="Edit requires Editor or Admin role">
                Edit
              </button>
            )}
          </div>
        ),
      },
    ],
    [caps.canEdit, equationIndex],
  );

  const scalarColumns: Column<ScalarRow>[] = useMemo(
    () => [
      { key: "name", header: "Scalar", render: (r) => <span className="text-sm font-semibold">{r.scalarName ?? "-"}</span> },
      { key: "value", header: "Value", render: (r) => <span className="font-mono text-xs">{r.scalarValue ?? "-"}</span> },
      {
        key: "uom",
        header: "UOM",
        render: (r) => {
          const id = r.uomId !== null && r.uomId !== undefined ? String(r.uomId) : "";
          const u = id ? uomIndex.get(id) : undefined;
          return <span className="text-sm">{u?.uomKey ?? u?.displayLabel ?? (id || "-")}</span>;
        },
      },
      { key: "active", header: "Active", render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span> },
      {
        key: "actions",
        header: "",
        widthClassName: "w-28",
        render: (r) =>
          caps.canEdit ? (
            <button type="button" className="btn-ghost" onClick={() => openEditScalar(r)}>
              Edit
            </button>
          ) : (
            <button type="button" className="btn-ghost opacity-60" disabled title="Edit requires Editor or Admin role">
              Edit
            </button>
          ),
      },
    ],
    [caps.canEdit, uomIndex],
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

  if (shouldShowAuthRequired(error)) {
    return <AuthRequiredPanel title="Throughput Setup" />;
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Throughput Setup"
        description="Configure throughput equations and scalars for the selected input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No throughput equations"
        emptyMessage="No throughput equations were found for the selected input parameter."
        emptyActions={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs opacity-80">
              Next step: create a throughput equation for InputParameterId{" "}
              <span className="font-mono font-semibold">{selectedInputParameterId}</span>. You can then add scalars from the equation row.
            </div>
            {caps.canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreateEquation}>
                Create Equation
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary opacity-60"
                disabled
                title="Create requires Editor or Admin role"
              >
                Create Equation
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Throughput Equations"
            description={`InputParameterId: ${selectedInputParameterId}`}
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreateEquation}
            createLabel="Create Equation"
          />

          <DataTable<EqRow> columns={columns} rows={rows} rowKey={(r) => r.throughputEquationId} emptyLabel="No throughput equations." />
        </div>
      </TabStatePanel>

      <Modal
        open={eqModalOpen}
        title={editingEq ? "Edit Throughput Equation" : "Create Throughput Equation"}
        onClose={() => (eqSaving ? null : setEqModalOpen(false))}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setEqModalOpen(false)} disabled={eqSaving}>
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={saveEquation} disabled={eqSaving}>
              {eqSaving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        {eqBanner ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
            <div className="font-semibold">{eqBanner.title}</div>
            {eqBanner.message ? <div className="mt-1">{eqBanner.message}</div> : null}
          </div>
        ) : null}

        <div className="space-y-3">
          <FormSelect
            label="Equation Master"
            value={eqForm.equationMasterId}
            onChange={(v) => setEqForm((s) => ({ ...s, equationMasterId: v }))}
            options={equations.map((e) => ({
              value: e.equationMasterId,
              label: (e.equationKey || e.versionLabel || e.equationMasterId) as string,
            }))}
            error={eqFieldErrors.equationMasterId}
            placeholder="Select…"
            helpText={
              equations.length === 0
                ? "No active equation masters were returned. Check master data setup."
                : null
            }
          />

          <FormInput
            label="Equation Text (optional)"
            value={eqForm.equationText}
            onChange={(v) => setEqForm((s) => ({ ...s, equationText: v }))}
            error={eqFieldErrors.equationText}
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={eqForm.isActive} onChange={(e) => setEqForm((s) => ({ ...s, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
      </Modal>

      <Modal
        open={scalarModalOpen}
        title="Throughput Scalars"
        onClose={() => (scalarSaving ? null : setScalarModalOpen(false))}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setScalarModalOpen(false)} disabled={scalarSaving}>
              Close
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="muted text-xs">
            EquationId: <span className="font-mono font-semibold">{scalarEq?.throughputEquationId ?? "-"}</span>
          </div>

          {scalarLoading ? (
            <div className="muted text-sm">Loading scalars…</div>
          ) : (
            <DataTable<ScalarRow>
              columns={scalarColumns}
              rows={scalars}
              rowKey={(r) => r.throughputScalarId}
              emptyLabel="No scalars."
            />
          )}

          {caps.canEdit ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">{scalarEdit ? "Edit Scalar" : "Create Scalar"}</div>

              {scalarBanner ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
                  <div className="font-semibold">{scalarBanner.title}</div>
                  {scalarBanner.message ? <div className="mt-1">{scalarBanner.message}</div> : null}
                </div>
              ) : null}

              <div className="mt-3 space-y-3">
                <FormInput
                  label="Scalar Name"
                  value={scalarForm.scalarName}
                  onChange={(v) => setScalarForm((s) => ({ ...s, scalarName: v }))}
                  error={scalarFieldErrors.scalarName}
                />

                <FormInput
                  label="Scalar Value"
                  value={scalarForm.scalarValue}
                  onChange={(v) => setScalarForm((s) => ({ ...s, scalarValue: v }))}
                  error={scalarFieldErrors.scalarValue}
                />

                <FormSelect
                  label="UOM (optional)"
                  value={scalarForm.uomId}
                  onChange={(v) => setScalarForm((s) => ({ ...s, uomId: v }))}
                  options={uoms.map((u) => ({
                    value: u.uomId,
                    label: `${u.uomKey ? `${u.uomKey} — ` : ""}${(u.displayLabel || u.uomId) as string}`,
                  }))}
                  placeholder="—"
                  helpText={
                    uoms.length === 0
                      ? "No active UOM masters were returned. Check master data setup."
                      : null
                  }
                />

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={scalarForm.isActive} onChange={(e) => setScalarForm((s) => ({ ...s, isActive: e.target.checked }))} />
                  Active
                </label>

                <div className="flex gap-2">
                  <button className="btn-ghost" type="button" onClick={openCreateScalar} disabled={scalarSaving}>
                    New
                  </button>
                  <button className="btn-primary" type="button" onClick={saveScalar} disabled={scalarSaving}>
                    {scalarSaving ? "Saving..." : "Save Scalar"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Read-only mode: scalar editing is disabled.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
