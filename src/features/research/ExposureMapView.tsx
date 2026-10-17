import { useState } from 'react';
import Dropdown from '@/components/ui/Dropdown';
import { useExposureMap } from '@/hooks/useQuantAnalysis';
import type { ExposureMap, ResearchEntity } from '@/hooks/apiTypes';
import ExposureMapCard from '@/features/research/ExposureMapCard.tsx';

const DIMENSIONS: { key: keyof Omit<ExposureMap, 'targetEntityId'>; label: string }[] = [
  { key: 'architecture', label: 'Architecture (reactors/programs)' },
  { key: 'material', label: 'Material' },
  { key: 'component', label: 'Component' },
  { key: 'manufacturing', label: 'Manufacturing / Capability' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'contract', label: 'Contract' },
  { key: 'program', label: 'Unclassified Relationship' },
  { key: 'bottleneck', label: 'Related Hypotheses' },
];

/** A security's `ExposureMap` (`@quant-fusion/quant-sdk-js`'s `research/exposure.ts`) — the exact
 * multi-hop, multi-dimension read the real quant bot computes every round for each tracked
 * security, kept in separate dimensions rather than one collapsed "fusion score" so a company
 * with real material exposure but zero qualification/contract exposure is visibly distinguishable
 * from one with neither, rather than both reading as "low." The manufacturing/qualification/
 * contract/program dimensions already reflect any relationship types a person has sorted into
 * one of them via "Manage Relationship Types" (`ManageRelationshipTypesModal`) — see
 * `useExposureMap`'s own doc comment; no separate cards render for that, it's baked into these
 * same four. */
export default function ExposureMapView({
  domain,
  entities,
}: {
  domain: string;
  entities: ResearchEntity[];
}) {
  // Exposure is a per-SECURITY read (see this component's own doc comment) — every non-company
  // entity (a reactor, a material, a program, ...) is a valid exposure TARGET dimension elsewhere
  // in the map, but never itself something a bot could hold a position in, so it never belongs in
  // this picker.
  const sortedEntities = entities
    .filter((e) => e.type === 'company')
    .sort((a, b) => a.name.localeCompare(b.name));
  const [entityId, setEntityId] = useState<string | undefined>(sortedEntities[0]?.id);
  const { exposure, error, loading } = useExposureMap(domain, entityId);

  return (
    <div className="flex flex-col gap-3">
      <Dropdown
        options={sortedEntities.map((e) => ({ value: e.id, label: e.name }))}
        selectedValue={entityId}
        onSelect={setEntityId}
      />
      {loading && <p className="font-mono text-xs text-muted-3">Computing exposure…</p>}
      {error !== undefined && <p className="font-mono text-xs text-danger">{error}</p>}
      {exposure !== undefined && (
        <div className="grid grid-cols-2 gap-3">
          {DIMENSIONS.map(({ key, label }) => {
            const entries = exposure[key];
            return <ExposureMapCard key={key} dimensionKey={key} label={label} entries={entries} />;
          })}
        </div>
      )}
    </div>
  );
}
