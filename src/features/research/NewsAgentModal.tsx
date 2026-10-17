import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import Tag from '@/components/ui/Tag';
import { colorForSlug } from '@/utils/format';
import type { NewsAgentCandidate } from '@/hooks/apiTypes';
import {
  candidateKey,
  modelOptionKey,
  useNewsAgentModal,
  type CandidateState,
} from './useNewsAgentModal';

/** One line per `kind` describing what's actually being proposed — the rest of the card
 * (ticker/date/source/rationale/Go-No-Go) is identical across kinds. */
function describeCandidate(candidate: NewsAgentCandidate): {
  kicker: string;
  badgeLabel: string;
  badgeIsNew: boolean;
  detail: string;
} {
  if (candidate.kind === 'event') {
    return {
      kicker: 'EVENT',
      badgeLabel: candidate.proposedEvent.type,
      badgeIsNew: candidate.isNewEventType,
      detail: candidate.proposedEvidence.description,
    };
  }
  if (candidate.kind === 'relationship') {
    const r = candidate.proposedRelationship;
    return {
      kicker: candidate.isNewRelationship ? 'NEW RELATIONSHIP' : 'RELATIONSHIP UPDATE',
      badgeLabel: r.type,
      badgeIsNew: candidate.isNewRelationshipType,
      detail: `${r.fromEntityId} → ${r.toEntityId} (${r.states[0]?.status ?? r.type}) — ${candidate.proposedEvidence.description}`,
    };
  }
  const h = candidate.proposedHypothesis;
  return {
    kicker: candidate.isNewHypothesis ? 'NEW HYPOTHESIS' : 'HYPOTHESIS UPDATE',
    badgeLabel: h.status,
    badgeIsNew: candidate.isNewHypothesis,
    detail: `"${h.name}" — ${h.statement}`,
  };
}

function CandidateCard({
  item,
  onGo,
  onNoGo,
}: {
  item: CandidateState;
  onGo: () => void;
  onNoGo: () => void;
}) {
  const { candidate, status, error } = item;
  const { kicker, badgeLabel, badgeIsNew, detail } = describeCandidate(candidate);

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
        opacity: status === 'rejected' ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-3">
          {kicker}
        </span>
        <span className="font-mono text-[10px] text-muted-2">
          {candidate.publishedAt.slice(0, 10)}
        </span>
        <Tag label={candidate.ticker} color={colorForSlug(candidate.ticker)} />
        <span
          className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-[1px] border"
          style={{
            borderColor: badgeIsNew ? 'var(--color-accent-subtle-border)' : 'var(--color-border-4)',
            color: badgeIsNew ? 'var(--color-accent)' : 'var(--color-muted-3)',
          }}
        >
          {badgeIsNew ? 'new' : 'existing'} · {badgeLabel}
        </span>
        <span className="font-mono text-[10px] text-muted-4">{candidate.source}</span>
      </div>
      <p className="font-mono text-sm font-semibold text-foreground">{candidate.title}</p>
      <p className="font-mono text-xs text-muted-2 mt-1">{detail}</p>
      <p className="font-mono text-[10px] text-muted-4 mt-1">{candidate.rationale}</p>
      {error !== undefined && <p className="font-mono text-[10px] text-danger mt-1">{error}</p>}

      <div className="flex items-center gap-2 mt-2">
        {status === 'added' ? (
          <span
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: 'var(--color-accent)' }}
          >
            ✓ Added
          </span>
        ) : status === 'rejected' ? (
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
            Skipped
          </span>
        ) : (
          <>
            <button
              onClick={onGo}
              disabled={status === 'submitting'}
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-[1px] border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-background)',
              }}
            >
              {status === 'submitting' ? 'Adding…' : 'Go'}
            </button>
            <button
              onClick={onNoGo}
              disabled={status === 'submitting'}
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              No-Go
            </button>
          </>
        )}
        <a
          href={candidate.link}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-[1px] border border-border-4 text-muted"
          style={{ textDecoration: 'none' }}
        >
          View Article ↗
        </a>
      </div>
    </div>
  );
}

/** The News tab's "Run News Research Agent" modal — picks a locally installed Ollama model,
 * runs `lib/newsAgent.ts`'s triage-then-extract pipeline against this domain's tracked-ticker
 * news feed, and shows the proposed events for an explicit per-item Go/No-Go before anything is
 * written. State/handlers live in `useNewsAgentModal` — this component only renders. Rendered
 * only while open (see `NewsFeedSection`'s own conditional-mount comment on `ResearchUpdateModal`)
 * so every re-open starts from a clean run. */
export default function NewsAgentModal({
  open,
  onClose,
  domain,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  onSuccess: () => void;
}) {
  const {
    options,
    modelsError,
    selectedKey,
    setSelectedKey,
    items,
    skippedCount,
    headlineCount,
    articlesRead,
    hasRun,
    runAgent,
    running,
    runError,
    triageError,
    go,
    noGo,
  } = useNewsAgentModal({ domain, onSuccess });

  return (
    <Modal open={open} onClose={onClose} title="Run News Research Agent">
      <div className="flex items-center gap-2 flex-wrap">
        {options.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-4">
            {modelsError !== undefined
              ? `Could not reach Ollama: ${modelsError}`
              : 'No models available — install one via Ollama, or add an OpenAI key on the Settings tab.'}
          </p>
        ) : (
          <Dropdown
            options={options.map((o) => ({
              value: modelOptionKey(o),
              label: `${o.provider}: ${o.model}`,
            }))}
            selectedValue={selectedKey === '' ? undefined : selectedKey}
            onSelect={setSelectedKey}
          />
        )}
        <button
          onClick={() => {
            void runAgent();
          }}
          disabled={running || selectedKey === ''}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {running ? 'Running…' : 'Run Agent'}
        </button>
      </div>

      {runError !== undefined && <p className="font-mono text-[10px] text-danger">{runError}</p>}

      {hasRun && (
        <div className="flex flex-col gap-3">
          {triageError !== undefined ? (
            <p className="font-mono text-[10px] text-danger">
              Triage failed, so nothing was actually read this run — no article was ruled out, the
              model just couldn't be asked ({triageError}). Try running again.
            </p>
          ) : (
            <p className="font-mono text-[10px] text-muted-4">
              {items.length} candidate{items.length === 1 ? '' : 's'} from {articlesRead} of{' '}
              {headlineCount} headline{headlineCount === 1 ? '' : 's'} read · {skippedCount} article
              {skippedCount === 1 ? '' : 's'} skipped as routine or not schema-worthy.
            </p>
          )}
          {items.length === 0
            ? triageError === undefined && (
                <p className="font-mono text-xs text-muted-3">
                  {articlesRead === 0
                    ? `The model judged all ${String(headlineCount)} headlines too routine to read in full.`
                    : `Read ${String(articlesRead)} article${articlesRead === 1 ? '' : 's'} in full, but none produced a schema-worthy event, relationship, or hypothesis update.`}
                </p>
              )
            : items.map((item) => {
                const key = candidateKey(item.candidate);
                return (
                  <CandidateCard
                    key={key}
                    item={item}
                    onGo={() => {
                      void go(key);
                    }}
                    onNoGo={() => {
                      noGo(key);
                    }}
                  />
                );
              })}
        </div>
      )}

      <div
        className="flex items-center justify-end gap-2 pt-2"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <button
          onClick={onClose}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
