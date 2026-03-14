import { Section4CrudPage } from "./Section4CrudPage";
import { createSiteProfile, deleteSiteProfile, listSiteProfiles, updateSiteProfile } from "../../api/endpoints";
import type { SiteProfileDto } from "../../api/types";

function mapRow(r: any) {
  const row = r as SiteProfileDto;
  return {
    id: row.siteProfileId,
    siteId: row.siteId,
    name: row.siteId,
  };
}

// PUBLIC_INTERFACE
export function SiteProfilesPage() {
  return (
    <Section4CrudPage
      title="Site Profile"
      description="BRD §4: Site Profile Information module."
      nameLabel="Site ID"
      list={listSiteProfiles as any}
      create={(b) => createSiteProfile({ siteId: b.siteId, createdBy: b.createdBy, correlationId: b.correlationId }) as any}
      update={(id, b) => updateSiteProfile(id, { siteId: b.siteId, modifiedBy: b.modifiedBy, correlationId: b.correlationId }) as any}
      remove={(id, b) => deleteSiteProfile(id, { modifiedBy: b.modifiedBy, correlationId: b.correlationId } as any)}
      mapFromBackend={mapRow}
    />
  );
}
