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
        { key: "col1", header: "Equation Name", widthClassName: "w-64" },
        { key: "col2", header: "Equation Text" },
      ]}
      fields={[
        { key: "col1", label: "Equation Name", placeholder: "e.g. Default Throughput", required: true },
        { key: "col2", label: "Equation Text", placeholder: "e.g. A * B / C", required: true },
      ]}
      list={(p) =>
        queryEquationMasters({ activeOnly: p?.activeOnly, limit: p?.limit })
      }
      create={({ col1, col2, createdBy, correlationId }) =>
        createEquationMaster({
          equationName: col1 ?? "",
          equationText: col2 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, modifiedBy, correlationId }) =>
        updateEquationMaster(id, {
          equationName: col1 ?? "",
          equationText: col2 ?? "",
          isActive: true,
          modifiedBy,
          correlationId,
        })
      }
      disable={(id, { modifiedBy, correlationId }) =>
        disableEquationMaster(id, modifiedBy, correlationId)
      }
      mapFromBackend={(r: any) => ({
        id: String(r?.equationMasterId ?? r?.EquationMasterId ?? ""),
        col1: (r?.equationName ?? r?.EquationName ?? "") as string,
        col2: (r?.equationText ?? r?.EquationText ?? "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
