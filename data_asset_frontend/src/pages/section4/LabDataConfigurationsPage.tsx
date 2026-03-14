import { Section4CrudPage } from "./Section4CrudPage";
import { createLabDataConfiguration, deleteLabDataConfiguration, listLabDataConfigurations, updateLabDataConfiguration } from "../../api/endpoints";
import type { LabDataConfigurationDto } from "../../api/types";

function mapRow(r: any) {
  const row = r as LabDataConfigurationDto;
  return {
    id: row.labDataConfigurationId,
    siteId: row.siteId,
    name: row.configurationName,
  };
}

// PUBLIC_INTERFACE
export function LabDataConfigurationsPage() {
  return (
    <Section4CrudPage
      title="Lab Data Configuration"
      description="BRD §4 (conditional): Lab Data Configuration module."
      nameLabel="Configuration Name"
      list={listLabDataConfigurations as any}
      create={(b) => createLabDataConfiguration({ siteId: b.siteId, configurationName: b.name, createdBy: b.createdBy, correlationId: b.correlationId }) as any}
      update={(id, b) => updateLabDataConfiguration(id, { siteId: b.siteId, configurationName: b.name, modifiedBy: b.modifiedBy, correlationId: b.correlationId }) as any}
      remove={(id, b) => deleteLabDataConfiguration(id, { modifiedBy: b.modifiedBy, correlationId: b.correlationId } as any)}
      mapFromBackend={mapRow}
    />
  );
}
