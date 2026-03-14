import { Section4CrudPage } from "./Section4CrudPage";
import { createWaterProcessConfiguration, deleteWaterProcessConfiguration, listWaterProcessConfigurations, updateWaterProcessConfiguration } from "../../api/endpoints";
import type { WaterProcessConfigurationDto } from "../../api/types";

function mapRow(r: any) {
  const row = r as WaterProcessConfigurationDto;
  return {
    id: row.waterProcessConfigurationId,
    siteId: row.siteId,
    name: row.configurationName,
  };
}

// PUBLIC_INTERFACE
export function WaterProcessConfigurationsPage() {
  return (
    <Section4CrudPage
      title="Water Process Configuration"
      description="BRD §4 (conditional): WWTS / Water Process related screens."
      nameLabel="Configuration Name"
      list={listWaterProcessConfigurations as any}
      create={(b) => createWaterProcessConfiguration({ siteId: b.siteId, configurationName: b.name, createdBy: b.createdBy, correlationId: b.correlationId }) as any}
      update={(id, b) => updateWaterProcessConfiguration(id, { siteId: b.siteId, configurationName: b.name, modifiedBy: b.modifiedBy, correlationId: b.correlationId }) as any}
      remove={(id, b) => deleteWaterProcessConfiguration(id, { modifiedBy: b.modifiedBy, correlationId: b.correlationId } as any)}
      mapFromBackend={mapRow}
    />
  );
}
