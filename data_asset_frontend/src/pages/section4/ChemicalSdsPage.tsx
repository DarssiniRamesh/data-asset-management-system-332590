import { Section4CrudPage } from "./Section4CrudPage";
import { createChemicalSds, deleteChemicalSds, listChemicalSds, updateChemicalSds } from "../../api/endpoints";
import type { ChemicalSdsDto } from "../../api/types";

function mapRow(r: any) {
  const row = r as ChemicalSdsDto;
  return {
    id: row.chemicalSdsId,
    siteId: row.siteId,
    name: row.chemicalName,
  };
}

// PUBLIC_INTERFACE
export function ChemicalSdsPage() {
  return (
    <Section4CrudPage
      title="Chemical SDS"
      description="BRD §4: Chemical SDS Details Configuration module."
      nameLabel="Chemical Name"
      list={listChemicalSds as any}
      create={(b) => createChemicalSds({ siteId: b.siteId, chemicalName: b.name, createdBy: b.createdBy, correlationId: b.correlationId }) as any}
      update={(id, b) => updateChemicalSds(id, { siteId: b.siteId, chemicalName: b.name, modifiedBy: b.modifiedBy, correlationId: b.correlationId }) as any}
      remove={(id, b) => deleteChemicalSds(id, { modifiedBy: b.modifiedBy, correlationId: b.correlationId } as any)}
      mapFromBackend={mapRow}
    />
  );
}
