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
      columns={[
        { key: "col1", header: "Program Key", widthClassName: "w-56" },
        { key: "col2", header: "Display Label" },
      ]}
      fields={[
        { key: "col1", label: "Program Key", placeholder: "e.g. EPA_GHGRP", required: true },
        { key: "col2", label: "Display Label", placeholder: "e.g. EPA GHGRP", required: true },
      ]}
      list={(p) =>
        queryReportingProgramMasters({ activeOnly: p?.activeOnly, limit: p?.limit })
      }
      create={({ col1, col2, createdBy, correlationId }) =>
        createReportingProgramMaster({
          programKey: col1 ?? "",
          displayLabel: col2 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, modifiedBy, correlationId }) =>
        updateReportingProgramMaster(id, {
          programKey: col1 ?? "",
          displayLabel: col2 ?? "",
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
        col1: (r?.programKey ?? r?.ProgramKey ?? "") as string,
        col2: (r?.displayLabel ?? r?.DisplayLabel ?? r?.programName ?? r?.ProgramName ?? "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
