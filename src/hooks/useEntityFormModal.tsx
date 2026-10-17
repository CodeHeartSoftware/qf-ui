import { buildEntityId } from '@/features/research/researchFormShared.tsx';
import { useApiAction } from '@/hooks/useApiAction.ts';
import { ApplyUpdateResult, type ResearchEntity } from '@/hooks/apiTypes.ts';
import { useEffect, useState } from 'react';

interface EntityFormModalParams {
  domain: string;
  /** `undefined` means "create a new entity"; given means "edit this one." */
  entity?: ResearchEntity;
  onSuccess: () => void;
  /** Refreshes the entity list without closing the modal or clearing the error — called when the
   * submit request itself threw (e.g. a dropped connection) rather than returning a structured
   * `{ok: false}` refusal. The write can still have landed server-side even though this request
   * never got a response (see `apps/api`'s `researchStore.ts`), so the list should
   * reflect the truth immediately rather than staying stale until the next unrelated refresh. */
  onChanged: () => void;
}

const useEntityFormModal = ({ domain, entity, onSuccess, onChanged }: EntityFormModalParams) => {
  const submit = useApiAction<ApplyUpdateResult>(
    `/api/research/${encodeURIComponent(domain)}/apply-update`,
  );

  const [loadedEntity, setLoadedEntity] = useState<ResearchEntity | undefined>(undefined);
  const [type, setType] = useState(entity?.type ?? '');
  const [name, setName] = useState(entity?.name ?? '');
  const [description, setDescription] = useState(entity?.description ?? '');

  useEffect(() => {
    if (loadedEntity !== entity) setLoadedEntity(entity);
  }, [entity]);

  useEffect(() => {
    if (loadedEntity) {
      setType(loadedEntity.type);
      setName(loadedEntity.name);
      setDescription(loadedEntity.description ?? '');
    }
  }, [loadedEntity]);

  const canSubmit = type.trim() !== '' && name.trim() !== '';

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const id = loadedEntity?.id ?? buildEntityId(name);
    const result = await submit.run({
      entities: [
        {
          id,
          type: type.trim(),
          name: name.trim(),
          ...(description.trim() !== '' ? { description: description.trim() } : {}),
          recordedAt: loadedEntity?.recordedAt ?? `${today}T00:00:00Z`,
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
    handleNameChange,
    setType,
    handleDescriptionChange,
    handleSubmit,
    type,
    name,
    description,
  };
};

export default useEntityFormModal;
