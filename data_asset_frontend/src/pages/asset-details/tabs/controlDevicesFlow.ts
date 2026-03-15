import type { ControlDeviceMappingDto, ControlDeviceMasterDto } from "../../../api/types";

/**
 * Control Devices domain/flow helpers.
 *
 * Why this file exists:
 * - This tab needs consistent, reusable logic for:
 *   - labeling masters (including inactive)
 *   - validating mapping forms
 *   - rendering a mapping row with master lookup
 * - This prevents one-off inline patches and keeps behavior uniform across create/edit + table rendering.
 */

export type ControlDeviceMappingFormState = {
  controlDeviceId: string;
  controlDeviceTag: string;
  isActive: boolean;
};

export type ControlDeviceMappingValidationResult = {
  isValid: boolean;
  banner?: { title: string; message?: string };
  fieldErrors: Record<string, string>;
};

export type ControlDeviceOption = { value: string; label: string; disabled?: boolean };

function normalizeId(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

// PUBLIC_INTERFACE
export function buildControlDeviceIndex(
  masters: ControlDeviceMasterDto[],
): Map<string, ControlDeviceMasterDto> {
  /** Contract:
   * Inputs:
   *  - masters: array of master control devices
   * Output:
   *  - Map keyed by controlDeviceId (string) -> master row
   * Invariants:
   *  - Key is always a string; missing IDs are skipped.
   */
  const idx = new Map<string, ControlDeviceMasterDto>();
  for (const d of masters) {
    const id = normalizeId(d.controlDeviceId);
    if (id) idx.set(id, d);
  }
  return idx;
}

// PUBLIC_INTERFACE
export function formatControlDeviceMasterLabel(d: ControlDeviceMasterDto): string {
  /** Contract:
   * Output: a stable, human-friendly label.
   * Behavior:
   *  - prefers displayLabel, falls back to deviceKey, falls back to id
   *  - appends " (inactive)" if isActive === false
   */
  const base = (d.displayLabel || d.deviceKey || d.controlDeviceId || "Unknown device") as string;
  const suffix = d.isActive === false ? " (inactive)" : "";
  return `${base}${suffix}`;
}

// PUBLIC_INTERFACE
export function buildControlDeviceOptions(masters: ControlDeviceMasterDto[]): ControlDeviceOption[] {
  /** Contract:
   * Outputs options for FormSelect.
   * Notes:
   *  - We do NOT disable inactive masters because BRD requires editing existing mappings reliably
   *    and some environments may have masters created but not activated yet.
   */
  return masters.map((d) => ({
    value: normalizeId(d.controlDeviceId),
    label: formatControlDeviceMasterLabel(d),
  }));
}

// PUBLIC_INTERFACE
export function validateControlDeviceMappingForm(args: {
  form: ControlDeviceMappingFormState;
  deviceIndex: Map<string, ControlDeviceMasterDto>;
  mode: "create" | "edit";
}): ControlDeviceMappingValidationResult {
  /** Contract:
   * Inputs:
   *  - form: controlled form state
   *  - deviceIndex: master index for existence checks
   *  - mode: create | edit (used only for messaging)
   * Output:
   *  - validation result with fieldErrors + optional banner
   *
   * Validation rules (UI-level; backend remains source of truth):
   *  - controlDeviceId is required
   *  - controlDeviceId must exist in master data (prevents saving unknown IDs that won't render)
   *  - if selected master is inactive, allow save but show a banner warning (non-blocking)
   */
  const fieldErrors: Record<string, string> = {};
  const id = (args.form.controlDeviceId || "").trim();

  if (!id) fieldErrors.controlDeviceId = "Required";

  const master = id ? args.deviceIndex.get(id) : undefined;
  if (id && !master) {
    fieldErrors.controlDeviceId = "Selected control device is not in master data for this site.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      isValid: false,
      fieldErrors,
      banner: {
        title: "Validation failed",
        message: "Please correct the highlighted fields.",
      },
    };
  }

  if (master?.isActive === false) {
    return {
      isValid: true,
      fieldErrors: {},
      banner: {
        title: "Selected device is inactive",
        message:
          "This mapping can be saved, but the selected control device is marked inactive in master data.",
      },
    };
  }

  return { isValid: true, fieldErrors: {} };
}

// PUBLIC_INTERFACE
export function getControlDeviceDisplayForMapping(args: {
  row: ControlDeviceMappingDto;
  deviceIndex: Map<string, ControlDeviceMasterDto>;
}): { primaryLabel: string; secondaryLabel: string } {
  /** Contract:
   * Produces the table display labels for a mapping row.
   * Invariants:
   *  - Always returns strings safe to render.
   */
  const id = args.row.controlDeviceId ?? null;
  const master = id !== null ? args.deviceIndex.get(String(id)) : undefined;

  const primaryLabel = master
    ? formatControlDeviceMasterLabel(master)
    : id !== null
      ? `Unknown device (ID ${String(id)})`
      : "Unknown device";

  const secondaryLabel = id !== null ? `ID: ${String(id)}` : "ID: -";
  return { primaryLabel, secondaryLabel };
}
