import { useMemo, useState } from 'react';
import type { EventType, ResearchEvent } from '@/hooks/apiTypes';
import { useApiResource } from '@/hooks/useApiResource';

export const ALL_TYPES_VALUE = '__all__';

/** `EventTimeline.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s hookify
 * default — the component renders, this holds every `useState`, the type/date-range filtering,
 * the add-event modal's open/close state, and the registered event-type taxonomy the Manage
 * Types modal edits and the Add Event modal's type dropdown reads from. */
export function useEventTimeline(events: ResearchEvent[], domain: string) {
  const [selectedType, setSelectedType] = useState<string>(ALL_TYPES_VALUE);
  // Empty string means "no bound" for either end — a plain native `<input type="date">` rather
  // than a custom widget, since a date range has a well-understood platform control already.
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

  const {
    data: eventTypesData,
    error: eventTypesError,
    refetch: refetchEventTypes,
  } = useApiResource<{ eventTypes: EventType[] }>(
    `/api/research/${encodeURIComponent(domain)}/event-types`,
  );
  const eventTypes = eventTypesData?.eventTypes ?? [];

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedType !== ALL_TYPES_VALUE && e.type !== selectedType) return false;
      const date = e.timestamp.slice(0, 10);
      if (fromDate.length > 0 && date < fromDate) return false;
      if (toDate.length > 0 && date > toDate) return false;
      return true;
    });
  }, [events, selectedType, fromDate, toDate]);

  const sorted = [...filteredEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const hasDateFilter = fromDate.length > 0 || toDate.length > 0;

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };
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
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    typeCounts,
    sorted,
    hasDateFilter,
    clearDateFilter,
    addOpen,
    openAdd,
    closeAdd,
    eventTypes,
    eventTypesError,
    refetchEventTypes,
    manageTypesOpen,
    openManageTypes,
    closeManageTypes,
  };
}
