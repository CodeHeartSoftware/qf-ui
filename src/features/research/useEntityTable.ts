import { useMemo, useState } from 'react';
import type { EntityType, ResearchEntity } from '@/hooks/apiTypes';
import { useApiResource } from '@/hooks/useApiResource';
import { formatSlug } from '@/utils/format';

export const ALL_TYPES_VALUE = '__all__';

export type SortColumn = 'name' | 'type';
export type SortDirection = 'asc' | 'desc';

/** `EntityTable.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s hookify
 * default — the component renders, this holds every `useState`, the type-filter/sort derivation,
 * the add/edit-entity modal state, and the registered entity-type taxonomy the Manage Entity
 * Types modal edits and the Add/Edit Entity modal's type dropdown reads from. */
export function useEntityTable(entities: ResearchEntity[], domain: string) {
  const [selectedType, setSelectedType] = useState<string>(ALL_TYPES_VALUE);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'name',
    direction: 'asc',
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<ResearchEntity>();
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

  const {
    data: entityTypesData,
    error: entityTypesError,
    refetch: refetchEntityTypes,
  } = useApiResource<{ entityTypes: EntityType[] }>(
    `/api/research/${encodeURIComponent(domain)}/entity-types`,
  );
  const entityTypes = entityTypesData?.entityTypes ?? [];

  const toggleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  };

  // Sorted by count so the type dropdown's own order roughly matches "how common is this" —
  // same convention the Overview tab's "Entity Types" breakdown already uses.
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entities) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entities]);

  const visibleEntities = useMemo(() => {
    const filtered =
      selectedType === ALL_TYPES_VALUE ? entities : entities.filter((e) => e.type === selectedType);
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      // Type sorts by its formatted label first, falling back to name so entities of the same
      // type still land in a stable, readable order rather than dataset order.
      const cmp =
        sort.column === 'name'
          ? a.name.localeCompare(b.name)
          : formatSlug(a.type).localeCompare(formatSlug(b.type)) || a.name.localeCompare(b.name);
      return cmp * sign;
    });
  }, [entities, selectedType, sort]);

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
    selectedType,
    setSelectedType,
    sort,
    toggleSort,
    typeCounts,
    visibleEntities,
    addOpen,
    openAdd,
    closeAdd,
    editingEntity,
    setEditingEntity,
    entityTypes,
    entityTypesError,
    refetchEntityTypes,
    manageTypesOpen,
    openManageTypes,
    closeManageTypes,
  };
}
