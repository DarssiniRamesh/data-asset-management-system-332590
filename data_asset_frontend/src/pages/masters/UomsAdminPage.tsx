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
        { key: "col1", header: "UOM Name" },
        { key: "col2", header: "UOM Code", widthClassName: "w-40" },
      ]}
      fields={[
        { key: "col1", label: "UOM Name", placeholder: "e.g. Gallons", required: true },
        { key: "col2", label: "UOM Code", placeholder: "e.g. gal", required: true },
      ]}
      list={(p) => queryUomMasters({ activeOnly: p?.activeOnly, limit: p?.limit })}
      create={({ col1, col2, createdBy, correlationId }) =>
        createUomMaster({
          uomName: col1 ?? "",
          uomCode: col2 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, modifiedBy, correlationId }) =>
        updateUomMaster(id, {
          uomName: col1 ?? "",
          uomCode: col2 ?? "",
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
        col1: (r?.uomName ?? r?.UomName ?? "") as string,
        col2: (r?.uomCode ?? r?.UomCode ?? "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
