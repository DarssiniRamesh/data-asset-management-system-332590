import { Section4CrudPage } from "./Section4CrudPage";
import { createWwtsProcessStream, deleteWwtsProcessStream, listWwtsProcessStreams, updateWwtsProcessStream } from "../../api/endpoints";
import type { WwtsProcessStreamDto } from "../../api/types";

function mapRow(r: any) {
  const row = r as WwtsProcessStreamDto;
  return {
    id: row.wwtsProcessStreamId,
    siteId: row.siteId,
    name: row.streamName,
  };
}

// PUBLIC_INTERFACE
export function WwtsProcessStreamsPage() {
  return (
    <Section4CrudPage
      title="WWTS Process Stream"
      description="BRD §4 (conditional): Asset / WWTS Process Stream Configuration."
      nameLabel="Stream Name"
      list={listWwtsProcessStreams as any}
      create={(b) => createWwtsProcessStream({ siteId: b.siteId, streamName: b.name, createdBy: b.createdBy, correlationId: b.correlationId }) as any}
      update={(id, b) => updateWwtsProcessStream(id, { siteId: b.siteId, streamName: b.name, modifiedBy: b.modifiedBy, correlationId: b.correlationId }) as any}
      remove={(id, b) => deleteWwtsProcessStream(id, { modifiedBy: b.modifiedBy, correlationId: b.correlationId } as any)}
      mapFromBackend={mapRow}
    />
  );
}
