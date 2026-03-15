import { MasterDataCrudPage } from "./MasterDataCrudPage";
import {
  createUomMaster,
  disableUomMaster,
  queryUomMasters,
  updateUomMaster,
} from "../../api/endpoints";

// PUBLIC_INTERFACE
export function UomsAdminPage() {
  /** Admin UI for UOM masters. */
  return (
    <MasterDataCrudPage
      title="UOMs"
      description="Manage Unit of Measure (UOM) master data used across asset configurations."
      columns={[
        { key: "col1", header: "UOM Key", widthClassName: "w-56" },
        { key: "col2", header: "Display Label" },
      ]}
      fields={[
        { key: "col1", label: "UOM Key", placeholder: "e.g. gal", required: true },
        { key: "col2", label: "Display Label", placeholder: "e.g. Gallons", required: true },
      ]}
      list={(p) => queryUomMasters({ activeOnly: p?.activeOnly, limit: p?.limit })}
      create={({ col1, col2, createdBy, correlationId }) =>
        createUomMaster({
          uomKey: col1 ?? "",
          displayLabel: col2 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, modifiedBy, correlationId }) =>
        updateUomMaster(id, {
          uomKey: col1 ?? "",
          displayLabel: col2 ?? "",
          isActive: true,
          modifiedBy,
          correlationId,
        })
      }
      disable={(id, { modifiedBy, correlationId }) =>
        disableUomMaster(id, modifiedBy, correlationId)
      }
      mapFromBackend={(r: any) => ({
        id: String(r?.uomId ?? r?.UomId ?? ""),
        col1: (r?.uomKey ?? r?.UomKey ?? r?.uomName ?? r?.UomName ?? "") as string,
        col2: (r?.displayLabel ??
          r?.DisplayLabel ??
          r?.uomCode ??
          r?.UomCode ??
          "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
