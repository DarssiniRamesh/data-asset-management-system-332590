import { MasterDataCrudPage } from "./MasterDataCrudPage";
import {
  createControlDeviceMaster,
  disableControlDeviceMaster,
  queryControlDeviceMasters,
  updateControlDeviceMaster,
} from "../../api/endpoints";

// PUBLIC_INTERFACE
export function ControlDevicesAdminPage() {
  /** Admin UI for Control Device masters. */
  return (
    <MasterDataCrudPage
      title="Control Devices"
      description="Manage Control Device master data. These can be referenced when configuring an asset's control device mappings."
      columns={[
        { key: "col1", header: "Site ID", widthClassName: "w-40" },
        { key: "col2", header: "Device Name" },
        { key: "col3", header: "Device Tag", widthClassName: "w-48" },
      ]}
      fields={[
        { key: "col1", label: "Site ID", placeholder: "e.g. SITE-001", required: true },
        { key: "col2", label: "Device Name", placeholder: "e.g. Thermal Oxidizer", required: true },
        { key: "col3", label: "Device Tag", placeholder: "e.g. TO-01", required: true },
      ]}
      list={(p) =>
        queryControlDeviceMasters({ activeOnly: p?.activeOnly, limit: p?.limit })
      }
      create={({ col1, col2, col3, createdBy, correlationId }) =>
        createControlDeviceMaster({
          siteId: col1 ?? "",
          deviceName: col2 ?? "",
          deviceTag: col3 ?? "",
          isActive: true,
          createdBy,
          correlationId,
        })
      }
      update={(id, { col1, col2, col3, modifiedBy, correlationId }) =>
        updateControlDeviceMaster(id, {
          siteId: col1 ?? "",
          deviceName: col2 ?? "",
          deviceTag: col3 ?? "",
          isActive: true,
          modifiedBy,
          correlationId,
        })
      }
      disable={(id, { modifiedBy, correlationId }) =>
        disableControlDeviceMaster(id, modifiedBy, correlationId)
      }
      mapFromBackend={(r: any) => ({
        id: String(r?.controlDeviceId ?? r?.ControlDeviceId ?? ""),
        col1: (r?.siteId ?? r?.SiteId ?? "") as string,
        col2: (r?.deviceName ?? r?.DeviceName ?? "") as string,
        col3: (r?.deviceTag ?? r?.DeviceTag ?? "") as string,
        isActive: (r?.isActive ?? r?.IsActive ?? true) as boolean,
      })}
    />
  );
}
