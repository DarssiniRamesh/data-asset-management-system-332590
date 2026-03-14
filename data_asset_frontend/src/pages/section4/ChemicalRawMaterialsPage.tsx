import { Section4CrudPage } from "./Section4CrudPage";
import { createChemicalRawMaterial, deleteChemicalRawMaterial, listChemicalRawMaterials, updateChemicalRawMaterial } from "../../api/endpoints";
import type { ChemicalRawMaterialDto } from "../../api/types";

function mapRow(r: any) {
  const row = r as ChemicalRawMaterialDto;
  return {
    id: row.chemicalRawMaterialId,
    siteId: row.siteId,
    name: row.chemicalName,
  };
}

// PUBLIC_INTERFACE
export function ChemicalRawMaterialsPage() {
  return (
    <Section4CrudPage
      title="Chemical Raw Material"
      description="BRD §4: Chemical Raw Material Configuration and Usage module."
      nameLabel="Chemical Name"
      list={listChemicalRawMaterials as any}
      create={(b) => createChemicalRawMaterial({ siteId: b.siteId, chemicalName: b.name, createdBy: b.createdBy, correlationId: b.correlationId }) as any}
      update={(id, b) => updateChemicalRawMaterial(id, { siteId: b.siteId, chemicalName: b.name, modifiedBy: b.modifiedBy, correlationId: b.correlationId }) as any}
      remove={(id, b) => deleteChemicalRawMaterial(id, { modifiedBy: b.modifiedBy, correlationId: b.correlationId } as any)}
      mapFromBackend={mapRow}
    />
  );
}
