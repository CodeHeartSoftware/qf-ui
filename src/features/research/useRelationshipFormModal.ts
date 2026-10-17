import { useState } from 'react';
import type { ApplyUpdateResult, ResearchDataset, ResearchRelationship } from '@/hooks/apiTypes';
import { useApiAction } from '@/hooks/useApiAction';
import { buildRelationshipId } from './researchFormShared';

interface RelationshipFormModalParams {
  domain: string;
  dataset: ResearchDataset;
  /** Given means "add a new state to this existing relationship"; `undefined` means "create a
   * brand-new relationship." */
  relationship?: ResearchRelationship;
  onSuccess: () => void;
  /** Refreshes the relationship list without closing the modal or clearing the error — called
   * when the submit request itself threw (e.g. a dropped connection) rather than returning a
   * structured `{ok: false}` refusal. The write can still have landed server-side even though
   * this request never got a response (see `apps/api`'s `researchStore.ts`), so
   * the list should reflect the truth immediately rather than staying stale until the next
   * unrelated refresh. */
  onChanged: () => void;
}

const useRelationshipFormModal = ({
  domain,
  dataset,
  relationship,
  onSuccess,
  onChanged,
}: RelationshipFormModalParams) => {
  const submit = useApiAction<ApplyUpdateResult>(
    `/api/research/${encodeURIComponent(domain)}/apply-update`,
  );

  const today = new Date().toISOString().slice(0, 10);
  const [fromEntityId, setFromEntityId] = useState(
    relationship?.fromEntityId ?? dataset.entities[0]?.id ?? '',
  );
  const [toEntityId, setToEntityId] = useState(
    relationship?.toEntityId ?? dataset.entities[1]?.id ?? dataset.entities[0]?.id ?? '',
  );
  const [type, setType] = useState(relationship?.type ?? '');
  const [status, setStatus] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [confidence, setConfidence] = useState('0.7');

  const entityOptions = dataset.entities.map((e) => ({ value: e.id, label: e.name }));
  const canSubmit =
    status.trim() !== '' &&
    effectiveFrom.trim() !== '' &&
    (relationship !== undefined ||
      (type.trim() !== '' &&
        fromEntityId !== '' &&
        toEntityId !== '' &&
        fromEntityId !== toEntityId));

  const handleSubmit = async () => {
    const state = {
      status: status.trim(),
      recordedAt: `${today}T00:00:00Z`,
      effectiveFrom: `${effectiveFrom}T00:00:00Z`,
      evidenceIds: [] as string[],
      confidence: { value: Number(confidence) },
    };
    const id = relationship?.id ?? buildRelationshipId(fromEntityId, toEntityId, type);
    const result = await submit.run({
      relationships: [
        {
          id,
          type: relationship?.type ?? type.trim(),
          fromEntityId: relationship?.fromEntityId ?? fromEntityId,
          toEntityId: relationship?.toEntityId ?? toEntityId,
          states: [state],
        },
      ],
    });
    if (result?.ok === true) {
      onSuccess();
    } else if (result === undefined) {
      onChanged();
    }
  };

  return {
    submitError: submit.error,
    submitResult: submit.result,
    submitLoading: submit.loading,
    canSubmit,
    entityOptions,
    fromEntityId,
    setFromEntityId,
    toEntityId,
    setToEntityId,
    type,
    setType,
    status,
    setStatus,
    effectiveFrom,
    setEffectiveFrom,
    confidence,
    setConfidence,
    handleSubmit,
  };
};

export default useRelationshipFormModal;
