import { useState } from 'react';
import { useApiAction } from '@/hooks/useApiAction';

export type DeleteMatchAction = 'selected' | 'inactive';

interface DeleteResult {
  deletedMatchIds: string[];
}

/** State/handlers for `DeleteMatchMenu`. Deleting is permanent, so picking an option only opens a
 * confirmation step; `confirmDelete` sends it (`DELETE /api/forward-matches/:id`, or
 * `?inactive=true` for every non-active match) and reports the deleted ids to `onDeleted`. */
export function useDeleteMatchMenu({
  selectedMatchId,
  onDeleted,
}: {
  selectedMatchId: string | undefined;
  onDeleted: (deletedMatchIds: string[]) => void;
}) {
  const [pending, setPending] = useState<DeleteMatchAction>();
  const deleteSelected = useApiAction<DeleteResult>(
    `/api/forward-matches/${encodeURIComponent(selectedMatchId ?? '')}`,
    'DELETE',
  );
  const deleteInactive = useApiAction<DeleteResult>('/api/forward-matches?inactive=true', 'DELETE');
  const action = pending === 'inactive' ? deleteInactive : deleteSelected;

  const confirmDelete = async () => {
    const result = await action.run(undefined);
    if (result !== undefined) {
      setPending(undefined);
      onDeleted(result.deletedMatchIds);
    }
  };

  return {
    pending,
    select: (value: DeleteMatchAction) => {
      setPending(value);
    },
    cancel: () => {
      setPending(undefined);
    },
    confirmDelete,
    loading: action.loading,
    error: action.error,
  };
}
