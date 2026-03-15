import { MasterDataCrudPage } from "./MasterDataCrudPage";
import {
  createEquationMaster,
  disableEquationMaster,
  queryEquationMasters,
  updateEquationMaster,
} from "../../api/endpoints";

// PUBLIC_INTERFACE
export function EquationsAdminPage() {
  /** Admin UI for Equation masters. */
  return (
    <MasterDataCrudPage
      title="Equations"
      description="Manage equation master data used for throughput calculations and other configuration."
      columns={[
        { key: "col1", header: "Equation Key", widthClassName: "w-64" },
        { key: "col2", header: "Version Label" },
      ]}
      fields={[
        { key: "col1", label: "Equation Key", placeholder: "e.g. THROUGHPUT_DEFAULT", required: true },
        { key: "col2", label: "Version Label", placeholder: "e.g. v1", required: true },
      ]}
      list={(p) =>
        queryEquationMasters({ activeOnly: p?.activeOnly, limit: p?.limit })
      }
      create={({ col1, col2, createdBy, correlationId }) =>
        createEquationMaster({
          equationKey: col1 ?? "",
          versionLabel: col2 ?? "",
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, modifiedBy, correlationId }) =>
        updateEquationMaster(id, {
          equationKey: col1 ?? "",
          versionLabel: col2 ?? "",
          modifiedBy,
          correlationId,
        })
      }
      disable={undefined}
      mapFromBackend={(r: any) => ({
        id: String(r?.equationMasterId ?? r?.EquationMasterId ?? ""),
        col1: (r?.equationKey ?? r?.EquationKey ?? r?.equationName ?? r?.EquationName ?? "") as string,
        col2: (r?.versionLabel ?? r?.VersionLabel ?? r?.equationText ?? r?.EquationText ?? "") as string,
        isActive: true,
      })}
    />
  );
}
