import { useEffect, useState } from 'react';
import { apiPost } from '@/lib/api';
import { useApiAction } from '@/hooks/useApiAction';
import { useApiResource } from '@/hooks/useApiResource';
import type {
  ApplyUpdateResult,
  LlmModelOption,
  NewsAgentCandidate,
  NewsAgentRunResult,
} from '@/hooks/apiTypes';

export type CandidateStatus = 'pending' | 'submitting' | 'added' | 'rejected';

export interface CandidateState {
  candidate: NewsAgentCandidate;
  status: CandidateStatus;
  error: string | undefined;
}

interface ManageTypeResult {
  ok: boolean;
  error?: string;
}

/** One article can now yield up to three independent candidates (an event, a relationship, AND
 * a hypothesis update, all from the same link) — `link` alone is no longer a unique key, so every
 * lookup/render key is `link` plus `kind`. */
export function candidateKey(candidate: NewsAgentCandidate): string {
  return `${candidate.link}::${candidate.kind}`;
}

/** Two providers could in principle both serve a model with the same raw id — the dropdown's own
 * value needs `provider` folded in too, not just `model`. */
export function modelOptionKey(option: LlmModelOption): string {
  return `${option.provider}::${option.model}`;
}

/** `NewsAgentModal.tsx`'s own state and handlers, per `frontend-conventions`'s hookify default.
 *
 * Each candidate's own "Go" is a small, independent 1-2 request sequence (register the event/
 * relationship type first, only if it's new, then `apply-update`) — deliberately NOT built on
 * `useApiAction` here, since that hook tracks one shared `loading`/`error` per hook instance, and
 * this needs N independently-submittable cards in flight/failed at once without one card's state
 * clobbering another's. Plain `apiPost` calls instead, with per-item status kept in `items`. */
export function useNewsAgentModal({
  domain,
  onSuccess,
}: {
  domain: string;
  onSuccess: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState('');
  const [items, setItems] = useState<CandidateState[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const { data: modelsData, error: modelsError } = useApiResource<{ options: LlmModelOption[] }>(
    '/api/llm/models',
  );
  const options = modelsData?.options ?? [];
  const selectedOption = options.find((o) => modelOptionKey(o) === selectedKey);

  // Default to the first available option once the list loads — no hardcoded fallback, so
  // whatever's actually installed/configured (Ollama models, plus OpenAI ones once a key is set
  // on the Settings tab) just works without this hook needing an update.
  useEffect(() => {
    const first = options[0];
    if (selectedKey === '' && first !== undefined) setSelectedKey(modelOptionKey(first));
  }, [options, selectedKey]);

  const runAction = useApiAction<NewsAgentRunResult>(
    `/api/research/${encodeURIComponent(domain)}/news-agent/run`,
  );

  const runAgent = async () => {
    if (selectedOption === undefined) return;
    const result = await runAction.run({
      model: selectedOption.model,
      provider: selectedOption.provider,
    });
    if (result === undefined) return;
    setItems(
      result.candidates.map((candidate) => ({ candidate, status: 'pending', error: undefined })),
    );
    setSkippedCount(result.skippedCount);
    setHasRun(true);
  };

  const setItemState = (key: string, update: Partial<CandidateState>) => {
    setItems((prev) =>
      prev.map((it) => (candidateKey(it.candidate) === key ? { ...it, ...update } : it)),
    );
  };

  const go = async (key: string) => {
    const item = items.find((it) => candidateKey(it.candidate) === key);
    if (item === undefined) return;
    setItemState(key, { status: 'submitting', error: undefined });
    try {
      const { candidate } = item;
      const update: Record<string, unknown[]> = { evidence: [candidate.proposedEvidence] };
      if (candidate.proposedEntities.length > 0) update.entities = candidate.proposedEntities;

      if (candidate.kind === 'event') {
        if (candidate.isNewEventType) {
          const registerResult = await apiPost<ManageTypeResult>(
            `/api/research/${encodeURIComponent(domain)}/event-types`,
            { type: candidate.proposedEvent.type },
          );
          if (!registerResult.ok) {
            throw new Error(registerResult.error ?? 'Could not register the new event type.');
          }
        }
        update.events = [candidate.proposedEvent];
      } else if (candidate.kind === 'relationship') {
        if (candidate.isNewRelationshipType) {
          const registerResult = await apiPost<ManageTypeResult>(
            `/api/research/${encodeURIComponent(domain)}/relationship-types`,
            { type: candidate.proposedRelationship.type },
          );
          if (!registerResult.ok) {
            throw new Error(
              registerResult.error ?? 'Could not register the new relationship type.',
            );
          }
        }
        update.relationships = [candidate.proposedRelationship];
      } else {
        update.hypotheses = [candidate.proposedHypothesis];
      }

      const applyResult = await apiPost<ApplyUpdateResult>(
        `/api/research/${encodeURIComponent(domain)}/apply-update`,
        update,
      );
      if (!applyResult.ok) {
        throw new Error(applyResult.error ?? 'The update was refused.');
      }
      setItemState(key, { status: 'added' });
      onSuccess();
    } catch (err) {
      setItemState(key, {
        status: 'pending',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const noGo = (key: string) => {
    setItemState(key, { status: 'rejected' });
  };

  return {
    options,
    modelsError,
    selectedKey,
    setSelectedKey,
    items,
    skippedCount,
    headlineCount: runAction.result?.headlineCount ?? 0,
    articlesRead: runAction.result?.articlesRead ?? 0,
    hasRun,
    runAgent,
    running: runAction.loading,
    runError: runAction.error,
    // Distinct from `runError`: a `triageError` still comes back as a normal 200 response (the
    // run itself "succeeded," it just never read anything), so it rides along on `hasRun` rather
    // than the error path.
    triageError: runAction.result?.triageError,
    go,
    noGo,
  };
}
