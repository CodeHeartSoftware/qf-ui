import { useState } from 'react';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import type { RelationshipTypeCategory } from '@/hooks/apiTypes';

interface MutationResult {
  ok: boolean;
  error?: string;
}

export interface UseManageRelationshipTypesModalOptions {
  domain: string;
  /** Called after a successful add/rename/delete/category change so the caller
   * (`RelationshipsSection`) refetches the registered taxonomy — the Add Relationship modal's
   * dropdown and this modal's own list both reflect it immediately. */
  onChanged: () => void;
}

/** `ManageRelationshipTypesModal.tsx`'s own state and handlers, pulled out per
 * `frontend-conventions`'s hookify default — the component renders, this holds every `useState`
 * and the add/rename/delete/category submit handlers. Textually identical to
 * `useManageEntityTypesModal.ts` apart from the `/relationship-types` path and the category
 * picker — kept as its own copy rather than a shared generic, same "each store keeps its own tiny
 * copy" precedent `@quant-fusion/research-store` itself follows. */
export function useManageRelationshipTypesModal({
  domain,
  onChanged,
}: UseManageRelationshipTypesModalOptions) {
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
        `/api/research/${encodeURIComponent(domain)}/relationship-types`,
        { type: newType.trim() },
      );
      if (!result.ok) {
        setError(result.error ?? 'The relationship type could not be added.');
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
        `/api/research/${encodeURIComponent(domain)}/relationship-types/${encodeURIComponent(renamingType)}`,
        { newType: renameValue.trim() },
      );
      if (!result.ok) {
        setError(result.error ?? 'The relationship type could not be renamed.');
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

  /** Sorts `type` into `category` (a fixed Exposure Map dimension), or un-sorts it with `null` —
   * applied immediately on picking from the dropdown, no separate save step, since the choice is
   * a single value out of a fixed 5-option set (4 categories + "none") rather than free text. */
  const handleSetCategory = async (type: string, category: RelationshipTypeCategory | null) => {
    setError(undefined);
    setBusyType(type);
    try {
      const result = await apiPatch<MutationResult>(
        `/api/research/${encodeURIComponent(domain)}/relationship-types/${encodeURIComponent(type)}/category`,
        { category },
      );
      if (!result.ok) {
        setError(result.error ?? "The relationship type's category could not be updated.");
        return;
      }
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
        `/api/research/${encodeURIComponent(domain)}/relationship-types/${encodeURIComponent(type)}`,
      );
      if (!result.ok) {
        setError(result.error ?? 'The relationship type could not be removed.');
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
    handleSetCategory,
    handleDelete,
  };
}
