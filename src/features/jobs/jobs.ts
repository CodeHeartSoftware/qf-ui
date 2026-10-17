export type JobCategory = 'market-data';

export const CATEGORY_META: Record<JobCategory, { label: string; color: string }> = {
  'market-data': { label: 'MARKET DATA', color: 'var(--color-info)' },
};

export interface JobDefinition {
  id: string;
  name: string;
  category: JobCategory;
  description: string;
  source: string;
  output: string;
  /** The POST path that actually runs this job. Omitted for a job with no backing script yet —
   * its "Run Now" stays an honest stub (`RunMatchMenu`'s own convention: real button, real click,
   * no fabricated success) instead of pointing at an endpoint that doesn't exist. */
  runPath?: string;
  /** The `@quant-fusion/job-run-store` id this job's run history is recorded/listed under (see
   * `useJobRunHistory`). A job with no `runPath` has never actually run, so its history is just
   * always empty — not an error, nothing to show yet. */
  jobId: string;
}

/**
 * `JOBS` used to be a hand-maintained array here. It isn't anymore: "Fetch Latest Price Data" is
 * now one job PER registered market universe (`apps/api`'s own
 * `marketUniverses.ts`, read via `useMarketUniverses`) rather than a single hardcoded entry, so
 * `JobsPanel` builds each universe's own `JobDefinition` at render time instead of listing them
 * by hand — see that component for where the one real job today (`fusion`) actually comes from.
 * This file now only holds the shared TYPE/category vocabulary every job (present or future)
 * still needs.
 */
