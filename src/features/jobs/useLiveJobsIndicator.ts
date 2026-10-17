import { useState } from 'react';
import { useLiveJobs } from '@/hooks/useLiveJobs';

/** `LiveJobsIndicator`'s state: the polled job list plus which one's log the modal shows. */
export function useLiveJobsIndicator() {
  const jobs = useLiveJobs();
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>();

  const running = jobs.filter((job) => job.status === 'running');
  const selected = jobs.find((job) => job.id === selectedJobId) ?? running[0] ?? jobs[0];

  return {
    jobs,
    runningCount: running.length,
    open,
    openModal: () => {
      setOpen(true);
    },
    closeModal: () => {
      setOpen(false);
      setSelectedJobId(undefined);
    },
    selectedJobId: selected?.id,
    selectJob: setSelectedJobId,
  };
}
