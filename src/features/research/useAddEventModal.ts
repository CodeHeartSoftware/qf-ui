import { useState } from 'react';
import type { ApplyUpdateResult } from '@/hooks/apiTypes';
import { useApiAction } from '@/hooks/useApiAction';
import { buildEventId, normalizeEventType } from './researchFormShared';

function toggleSetMember(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export interface UseAddEventModalOptions {
  domain: string;
  onSuccess: () => void;
}

/** `AddEventModal.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s hookify
 * default — the component renders, this holds every `useState` and the submit handler. */
export function useAddEventModal({ domain, onSuccess }: UseAddEventModalOptions) {
  const submit = useApiAction<ApplyUpdateResult>(
    `/api/research/${encodeURIComponent(domain)}/apply-update`,
  );

  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState('');
  const [date, setDate] = useState(today);
  const [entityIds, setEntityIds] = useState<Set<string>>(() => new Set());
  const [evidenceIds, setEvidenceIds] = useState<Set<string>>(() => new Set());

  const toggleEntity = (id: string) => {
    setEntityIds((prev) => toggleSetMember(prev, id));
  };
  const toggleEvidence = (id: string) => {
    setEvidenceIds((prev) => toggleSetMember(prev, id));
  };

  const canSubmit = type.trim() !== '' && date.trim() !== '';

  const handleSubmit = async () => {
    const normalizedType = normalizeEventType(type);
    const id = buildEventId(normalizedType, date, [...entityIds]);
    const result = await submit.run({
      events: [
        {
          id,
          timestamp: `${date}T00:00:00Z`,
          type: normalizedType,
          entityIds: [...entityIds],
          payload: {},
          evidenceIds: [...evidenceIds],
        },
      ],
    });
    if (result?.ok === true) onSuccess();
  };

  return {
    type,
    setType,
    date,
    setDate,
    entityIds,
    toggleEntity,
    evidenceIds,
    toggleEvidence,
    canSubmit,
    handleSubmit,
    submit,
  };
}
