import { MasterDataCrudPage } from "./MasterDataCrudPage";
import {
  createReportingProgramMaster,
  disableReportingProgramMaster,
  queryReportingProgramMasters,
  updateReportingProgramMaster,
} from "../../api/endpoints";

// PUBLIC_INTERFACE
export function ReportingProgramsAdminPage() {
  /** Admin UI for Reporting Program masters. */
  return (
    <MasterDataCrudPage
      title="Reporting Programs"
      description="Manage reporting program master data used in input parameter configuration and reporting mappings."
      columns={[{ key: "col1", header: "Program Name" }]}
      fields={[
        { key: "col1", label: "Program Name", placeholder: "e.g. EPA GHGRP", required: true },
      ]}
      list={(p) =>
        queryReportingProgramMasters({ activeOnly: p?.activeOnly, limit: p?.limit })
      }
      create={({ col1, createdBy, correlationId }) =>
        createReportingProgramMaster({
          programName: col1 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, modifiedBy, correlationId }) =>
        updateReportingProgramMaster(id, {
          programName: col1 ?? "",
          isActive: true,
          modifiedBy,
          correlationId,
        })
      }
      disable={(id, { modifiedBy, correlationId }) =>
        disableReportingProgramMaster(id, modifiedBy, correlationId)
      }
      mapFromBackend={(r: any) => ({
        id: String(r?.reportingProgramId ?? r?.ReportingProgramId ?? ""),
        col1: (r?.programName ?? r?.ProgramName ?? "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
