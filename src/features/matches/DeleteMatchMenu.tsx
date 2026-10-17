import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { useDeleteMatchMenu, type DeleteMatchAction } from './useDeleteMatchMenu';

/** Red "DELETE" action menu: delete the selected match, or every inactive (ended/completed/
 * forfeited) match. Both are permanent, so each goes through a confirmation step first — same
 * pattern as `RunMatchMenu`'s "End Match". */
export default function DeleteMatchMenu({
  selectedMatchId,
  inactiveCount,
  onDeleted,
}: {
  selectedMatchId: string | undefined;
  inactiveCount: number;
  onDeleted: (deletedMatchIds: string[]) => void;
}) {
  const { pending, select, cancel, confirmDelete, loading, error } = useDeleteMatchMenu({
    selectedMatchId,
    onDeleted,
  });
  const options: { value: DeleteMatchAction; label: string }[] = [
    ...(selectedMatchId !== undefined
      ? [{ value: 'selected' as const, label: 'Delete Selected Simulation' }]
      : []),
    ...(inactiveCount > 0
      ? [
          {
            value: 'inactive' as const,
            label: `Delete All Inactive Simulations (${String(inactiveCount)})`,
          },
        ]
      : []),
  ];
  if (options.length === 0) return null;

  return (
    <>
      <Dropdown variant="danger" triggerLabel="DELETE" options={options} onSelect={select} />
      <Modal
        open={pending !== undefined}
        onClose={cancel}
        title={pending === 'inactive' ? 'Delete Inactive Simulations' : 'Delete Simulation'}
      >
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] text-danger">
            {pending === 'inactive'
              ? `This permanently deletes all ${String(inactiveCount)} inactive (ended, completed or forfeited) simulations and their full history.`
              : `This permanently deletes "${selectedMatchId ?? ''}" and its full history.`}{' '}
            This cannot be undone.
          </p>
          {error !== undefined && <p className="font-mono text-[10px] text-danger">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={cancel}
              disabled={loading}
              className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                void confirmDelete();
              }}
              disabled={loading}
              className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:opacity-50"
              style={{
                background: 'var(--color-danger)',
                borderColor: 'var(--color-danger)',
                color: 'var(--color-background)',
              }}
            >
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
