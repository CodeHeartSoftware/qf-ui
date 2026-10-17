import Modal from '@/components/ui/Modal';
import LiveJobLog from './LiveJobLog';
import { useLiveJobsIndicator } from './useLiveJobsIndicator';

/** Header badge for long-running actions (runs, previews, price fetches, daily cycles) started
 * from ANY tab — or before a page reload. Hidden when nothing is running or recently finished;
 * clicking opens the selected job's live log. */
export default function LiveJobsIndicator() {
  const { jobs, runningCount, open, openModal, closeModal, selectedJobId, selectJob } =
    useLiveJobsIndicator();

  if (jobs.length === 0) return null;

  return (
    <>
      <button
        onClick={openModal}
        className="font-mono text-[10px] px-2 py-0.5 rounded-[1px] border cursor-pointer bg-transparent"
        style={{
          color: runningCount > 0 ? 'var(--color-info)' : 'var(--color-muted-3)',
          borderColor: runningCount > 0 ? 'var(--color-info)' : 'var(--color-border-4)',
        }}
      >
        {runningCount > 0
          ? `⟳ ${String(runningCount)} JOB${runningCount === 1 ? '' : 'S'} RUNNING`
          : 'JOB FINISHED'}
      </button>
      <Modal open={open} onClose={closeModal} title="Live Jobs">
        {jobs.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => {
                  selectJob(job.id);
                }}
                className="font-mono text-[9px] px-2 py-1 rounded-[1px] border cursor-pointer bg-transparent"
                style={{
                  color: job.id === selectedJobId ? 'var(--color-accent)' : 'var(--color-muted-3)',
                  borderColor:
                    job.id === selectedJobId ? 'var(--color-accent)' : 'var(--color-border-4)',
                }}
              >
                {job.label}
              </button>
            ))}
          </div>
        )}
        {selectedJobId !== undefined && <LiveJobLog key={selectedJobId} jobId={selectedJobId} />}
      </Modal>
    </>
  );
}
