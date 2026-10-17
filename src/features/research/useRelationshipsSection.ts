import { useMemo, useState } from 'react';
import type { RelationshipType, ResearchEntity, ResearchRelationship } from '@/hooks/apiTypes';
import { useApiResource } from '@/hooks/useApiResource';

export const ANY_ENTITY_VALUE = '__any__';

/** `RelationshipsSection.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s
 * hookify default — the component renders, this holds every `useState`, the type/endpoint
 * filtering, the add-relationship/add-state modal state, and the registered relationship-type
 * taxonomy the Manage Relationship Types modal edits and the Add Relationship modal's type
 * dropdown reads from. */
export function useRelationshipsSection(
  relationships: ResearchRelationship[],
  entitiesById: Map<string, ResearchEntity>,
  domain: string,
) {
  const [addOpen, setAddOpen] = useState(false);
  const [addingStateTo, setAddingStateTo] = useState<ResearchRelationship>();
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

  const {
    data: relationshipTypesData,
    error: relationshipTypesError,
    refetch: refetchRelationshipTypes,
  } = useApiResource<{ relationshipTypes: RelationshipType[] }>(
    `/api/research/${encodeURIComponent(domain)}/relationship-types`,
  );
  const relationshipTypes = relationshipTypesData?.relationshipTypes ?? [];

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of relationships) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [relationships]);

  // No type starts selected — an empty graph/table until the user opts specific types in, rather
  // than everything until they narrow down.
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set());

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.has(type)) {
        const next = new Set(prev);
        next.delete(type);
        return next;
      }
      return new Set(prev).add(type);
    });
  };

  // Narrows a relationship X -> Y by either endpoint independently, e.g. "From: ELMT" alone shows
  // every relationship ELMT is the source of, regardless of counterparty. Options are built from
  // entities that actually appear as that endpoint (not every entity in the dataset) — a name
  // that never shows up as a "from" would just be a dead option.
  const [fromFilter, setFromFilter] = useState<string>(ANY_ENTITY_VALUE);
  const [toFilter, setToFilter] = useState<string>(ANY_ENTITY_VALUE);

  const entityOptions = (key: 'fromEntityId' | 'toEntityId') => {
    const counts = new Map<string, number>();
    for (const r of relationships) counts.set(r[key], (counts.get(r[key]) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, count]) => ({ id, name: entitiesById.get(id)?.name ?? id, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  const fromOptions = useMemo(() => entityOptions('fromEntityId'), [relationships, entitiesById]);
  const toOptions = useMemo(() => entityOptions('toEntityId'), [relationships, entitiesById]);

  const filteredRelationships = useMemo(
    () =>
      relationships.filter(
        (r) =>
          selectedTypes.has(r.type) &&
          (fromFilter === ANY_ENTITY_VALUE || r.fromEntityId === fromFilter) &&
          (toFilter === ANY_ENTITY_VALUE || r.toEntityId === toFilter),
      ),
    [relationships, selectedTypes, fromFilter, toFilter],
  );

  const openAdd = () => {
    setAddOpen(true);
  };
  const closeAdd = () => {
    setAddOpen(false);
  };
  const openManageTypes = () => {
    setManageTypesOpen(true);
  };
  const closeManageTypes = () => {
    setManageTypesOpen(false);
  };

  return {
    addOpen,
    openAdd,
    closeAdd,
    addingStateTo,
    setAddingStateTo,
    typeCounts,
    selectedTypes,
    setSelectedTypes,
    toggleType,
    fromFilter,
    setFromFilter,
    toFilter,
    setToFilter,
    fromOptions,
    toOptions,
    filteredRelationships,
    relationshipTypes,
    relationshipTypesError,
    refetchRelationshipTypes,
    manageTypesOpen,
    openManageTypes,
    closeManageTypes,
  };
}
