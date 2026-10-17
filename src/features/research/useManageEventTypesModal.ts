import { useState } from 'react';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';

interface MutationResult {
  ok: boolean;
  error?: string;
}

export interface UseManageEventTypesModalOptions {
  domain: string;
  /** Called after a successful add/rename/delete so the caller (`EventTimeline`) refetches the
   * registered taxonomy — the Add Event modal's dropdown and this modal's own list both reflect
   * it immediately. */
  onChanged: () => void;
}

/** `ManageEventTypesModal.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s
 * hookify default — the component renders, this holds every `useState` and the add/rename/delete
 * submit handlers. */
export function useManageEventTypesModal({ domain, onChanged }: UseManageEventTypesModalOptions) {
  const [newType, setNewType] = useState('');
  const [renamingType, setRenamingType] = useState<string>();
  const [renameValue, setRenameValue] = useState('');
  const [busyType, setBusyType] = useState<string>();
  const [error, setError] = useState<string>();

  const handleAdd = async () => {
    setError(undefined);
    setBusyType(newType.trim());
    try {
      const result = await apiPost<MutationResult>(
        `/api/research/${encodeURIComponent(domain)}/event-types`,
        { type: newType.trim() },
      );
      if (!result.ok) {
        setError(result.error ?? 'The event type could not be added.');
        return;
      }
      setNewType('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyType(undefined);
    }
  };

  const startRename = (type: string) => {
    setError(undefined);
    setRenamingType(type);
    setRenameValue(type);
  };

  const cancelRename = () => {
    setRenamingType(undefined);
    setRenameValue('');
  };

  const handleRename = async () => {
    if (renamingType === undefined) return;
    setError(undefined);
    setBusyType(renamingType);
    try {
      const result = await apiPatch<MutationResult>(
        `/api/research/${encodeURIComponent(domain)}/event-types/${encodeURIComponent(renamingType)}`,
        { newType: renameValue.trim() },
      );
      if (!result.ok) {
        setError(result.error ?? 'The event type could not be renamed.');
        return;
      }
      cancelRename();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyType(undefined);
    }
  };

  const handleDelete = async (type: string) => {
    setError(undefined);
    setBusyType(type);
    try {
      const result = await apiDelete<MutationResult>(
        `/api/research/${encodeURIComponent(domain)}/event-types/${encodeURIComponent(type)}`,
      );
      if (!result.ok) {
        setError(result.error ?? 'The event type could not be removed.');
        return;
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyType(undefined);
    }
  };

  return {
    newType,
    setNewType,
    renamingType,
    renameValue,
    setRenameValue,
    busyType,
    error,
    handleAdd,
    startRename,
    cancelRename,
    handleRename,
    handleDelete,
  };
}
