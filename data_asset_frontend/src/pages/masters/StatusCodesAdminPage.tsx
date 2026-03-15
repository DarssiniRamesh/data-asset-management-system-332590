import { MasterDataCrudPage } from "./MasterDataCrudPage";
import {
  createStatusCodeMaster,
  disableStatusCodeMaster,
  queryStatusCodeMasters,
  updateStatusCodeMaster,
} from "../../api/endpoints";

// PUBLIC_INTERFACE
export function StatusCodesAdminPage() {
  /** Admin UI for Status Code masters. */
  return (
    <MasterDataCrudPage
      title="Status Codes"
      description="Manage status code master data used by Asset Status Logs and other state tracking."
      columns={[
        { key: "col1", header: "Status Code", widthClassName: "w-44" },
        { key: "col2", header: "Business Meaning" },
      ]}
      fields={[
        { key: "col1", label: "Status Code", placeholder: "e.g. ACTIVE", required: true },
        { key: "col2", label: "Business Meaning", placeholder: "e.g. Asset is in operation", required: true },
      ]}
      list={(p) =>
        queryStatusCodeMasters({ activeOnly: p?.activeOnly, limit: p?.limit })
      }
      create={({ col1, col2, createdBy, correlationId }) =>
        createStatusCodeMaster({
          statusCode: col1 ?? "",
          businessMeaning: col2 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, modifiedBy, correlationId }) =>
        updateStatusCodeMaster(id, {
          statusCode: col1 ?? "",
          businessMeaning: col2 ?? "",
          isActive: true,
          modifiedBy,
          correlationId,
        })
      }
      disable={(id, { modifiedBy, correlationId }) =>
        disableStatusCodeMaster(id, modifiedBy, correlationId)
      }
      mapFromBackend={(r: any) => ({
        id: String(r?.statusCodeId ?? r?.StatusCodeId ?? ""),
        col1: (r?.statusCode ?? r?.StatusCode ?? "") as string,
        col2: (r?.businessMeaning ??
          r?.BusinessMeaning ??
          r?.statusDescription ??
          r?.StatusDescription ??
          "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
