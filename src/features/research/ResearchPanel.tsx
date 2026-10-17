import { useMemo, useState } from 'react';
import SectionLabel from '@/components/ui/SectionLabel';
import Tag from '@/components/ui/Tag';
import { useResearch } from '@/hooks/useResearch';
import { useResearchDomains } from '@/hooks/useResearchDomains';
import CreateDomainModal from './CreateDomainModal';
import EntityTable from './EntityTable';
import EventTimeline from './EventTimeline';
import HypothesesSection from './HypothesesSection';
import NewsFeedSection from './NewsFeedSection';
import QuantSection from './QuantSection';
import RelationshipsSection from './RelationshipsSection';
import ResearchDomainPill from './ResearchDomainPill';

const MAX_ENTITY_TYPES_SHOWN = 8;

type InnerTab =
  'overview' | 'entities' | 'events' | 'hypotheses' | 'relationships' | 'news' | 'quant';

/** Left: a sidebar of every REGISTERED research domain (`apps/api`'s own domain
 * registry — real packages, not fabricated "industry groupings"; a new research package shows up
 * here as soon as it's added there). Right: the selected domain's dataset, single-select (unlike
 * the template's multi-select group toggle) since two research-core datasets are never
 * meaningfully combinable — each is its own independent entity/relationship/hypothesis graph. */
export default function ResearchPanel() {
  const {
    domains,
    error: domainsError,
    loading: domainsLoading,
    refetch: refetchDomains,
  } = useResearchDomains();
  const [selectedDomainId, setSelectedDomainId] = useState<string>();
  const [createDomainOpen, setCreateDomainOpen] = useState(false);
  const selectedDomain = domains.find((d) => d.domain === selectedDomainId) ?? domains[0];

  const {
    dataset,
    error: datasetError,
    loading: datasetLoading,
    refetch: refetchDataset,
  } = useResearch(selectedDomain?.domain);
  const [activeTab, setActiveTab] = useState<InnerTab>('overview');

  const entitiesById = useMemo(
    () => new Map((dataset?.entities ?? []).map((e) => [e.id, e])),
    [dataset],
  );
  const evidenceById = useMemo(
    () => new Map((dataset?.evidence ?? []).map((e) => [e.id, e])),
    [dataset],
  );
  // Real breakdown of what this dataset's entities actually are (research-core doesn't enumerate
  // entity types — each domain package owns that vocabulary) — the closest honest analog to the
  // template's per-group "Technology Readiness" bar, since there's no real TRL/market-size/CAGR
  // data behind a research-core dataset to show instead.
  const entityTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of dataset?.entities ?? []) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [dataset]);

  if (domainsLoading) {
    return <p className="font-mono text-xs text-muted-3">Loading research domains…</p>;
  }
  if (domainsError !== undefined) {
    return <p className="font-mono text-xs text-danger">{domainsError}</p>;
  }
  if (domains.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="font-mono text-xs text-muted-3">No research domains registered yet.</p>
        <button
          onClick={() => {
            setCreateDomainOpen(true);
          }}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
        >
          + New Domain
        </button>
        <CreateDomainModal
          open={createDomainOpen}
          onClose={() => {
            setCreateDomainOpen(false);
          }}
          onCreated={(domain) => {
            refetchDomains();
            setSelectedDomainId(domain);
          }}
        />
      </div>
    );
  }

  const innerTabs: { id: InnerTab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'news', label: 'NEWS FEED' },
    { id: 'events', label: `EVENTS (${String(dataset?.events.length ?? 0)})` },
    { id: 'entities', label: `ENTITIES (${String(dataset?.entities.length ?? 0)})` },
    { id: 'relationships', label: `RELATIONSHIPS (${String(dataset?.relationships.length ?? 0)})` },
    { id: 'hypotheses', label: `HYPOTHESES (${String(dataset?.hypotheses.length ?? 0)})` },
    { id: 'quant', label: 'QUANT' },
  ];

  return (
    <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
      {/* left: research domain sidebar */}
      <div className="flex flex-col gap-2 shrink-0" style={{ width: 200 }}>
        <SectionLabel>Research Domains</SectionLabel>
        {domains.map((d) => (
          <ResearchDomainPill
            key={d.domain}
            domain={d}
            selected={selectedDomain?.domain === d.domain}
            onClick={() => {
              setSelectedDomainId(d.domain);
            }}
          />
        ))}
        <button
          onClick={() => {
            setCreateDomainOpen(true);
          }}
          className="font-mono text-[10px] px-3 py-1.5 mt-1 rounded-[1px] border border-border-4 bg-transparent text-muted-3 cursor-pointer text-left"
        >
          + New Domain
        </button>
        <CreateDomainModal
          open={createDomainOpen}
          onClose={() => {
            setCreateDomainOpen(false);
          }}
          onCreated={(domain) => {
            refetchDomains();
            setSelectedDomainId(domain);
          }}
        />
      </div>

      {/* right: selected domain's dataset */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {datasetLoading && (
          <p className="font-mono text-xs text-muted-3">Loading research dataset…</p>
        )}
        {datasetError !== undefined && (
          <p className="font-mono text-xs text-danger">{datasetError}</p>
        )}

        {dataset !== undefined && (
          <>
            <div
              className="flex gap-0 overflow-x-auto"
              style={{ borderBottom: '1px solid var(--color-border-3)' }}
            >
              {innerTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                  }}
                  className="font-mono text-[10px] px-4 py-2.5 shrink-0 transition-all bg-transparent cursor-pointer"
                  style={{
                    color: activeTab === t.id ? 'var(--color-foreground)' : 'var(--color-muted-3)',
                    borderBottom: `2px solid ${activeTab === t.id ? 'var(--color-accent)' : 'transparent'}`,
                    letterSpacing: '0.07em',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div
                className="p-5 flex flex-col gap-5"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-3)',
                  borderRadius: 2,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-foreground">{dataset.name}</h3>
                    <p className="font-mono text-[10px] mt-1 text-muted-3">
                      domain: {dataset.domain} · {dataset.id} · created{' '}
                      {dataset.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <Tag label={dataset.version} color="var(--color-info)" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono text-[9px] tracking-widest uppercase mb-1 text-muted-3">
                      Entities
                    </p>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {dataset.entities.length}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-widest uppercase mb-1 text-muted-3">
                      Relationships
                    </p>
                    <p
                      className="font-mono text-2xl font-bold"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {dataset.relationships.length}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[9px] tracking-widest uppercase mb-2 text-muted-3">
                    Entity Types
                  </p>
                  {entityTypeCounts.length === 0 ? (
                    <p className="font-mono text-xs text-muted-4">No entities in this dataset.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {entityTypeCounts.slice(0, MAX_ENTITY_TYPES_SHOWN).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3">
                          <span className="font-mono text-[10px] w-40 shrink-0 truncate text-muted">
                            {type}
                          </span>
                          <div
                            className="flex-1 h-[3px] rounded-full"
                            style={{ background: 'var(--color-border-3)' }}
                          >
                            <div
                              style={{
                                width: `${String((count / (entityTypeCounts[0]?.[1] ?? 1)) * 100)}%`,
                                background: 'var(--color-accent)',
                                height: '100%',
                                borderRadius: 9999,
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs w-8 text-right text-muted-2">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {entityTypeCounts.length > MAX_ENTITY_TYPES_SHOWN && (
                    <p className="font-mono text-[10px] mt-2 text-muted-4">
                      +{entityTypeCounts.length - MAX_ENTITY_TYPES_SHOWN} more type
                      {entityTypeCounts.length - MAX_ENTITY_TYPES_SHOWN === 1 ? '' : 's'}
                    </p>
                  )}
                </div>

                <div
                  className="flex gap-6 pt-4"
                  style={{ borderTop: '1px solid var(--color-surface-2)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-2">
                      {dataset.hypotheses.length}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-3">
                      Hypotheses
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-2">{dataset.events.length}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-3">
                      Events
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-2">
                      {dataset.evidence.length}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-3">
                      Evidence
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-2">
                      {dataset.questions.length}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-3">
                      Questions
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'entities' && (
              <EntityTable
                key={dataset.domain}
                entities={dataset.entities}
                domain={dataset.domain}
                onChanged={refetchDataset}
              />
            )}
            {activeTab === 'events' && (
              <EventTimeline
                key={dataset.domain}
                events={dataset.events}
                entitiesById={entitiesById}
                evidenceById={evidenceById}
                domain={dataset.domain}
                dataset={dataset}
                onChanged={refetchDataset}
              />
            )}
            {activeTab === 'hypotheses' && (
              // Keyed by domain so switching research domains resets the status filter (a
              // filter picked for one domain's own status mix is otherwise stale, and possibly
              // empty, against a different domain's) — same convention `RelationshipsSection`
              // already uses below.
              <HypothesesSection
                key={dataset.domain}
                hypotheses={dataset.hypotheses}
                evidenceById={evidenceById}
                domain={dataset.domain}
                onChanged={refetchDataset}
              />
            )}
            {activeTab === 'relationships' && (
              // Keyed by domain so switching research domains resets the type-filter selection
              // (a filter picked for one domain's own relationship-type vocabulary is otherwise
              // stale, and possibly empty, against a different domain's).
              <RelationshipsSection
                key={dataset.domain}
                relationships={dataset.relationships}
                entitiesById={entitiesById}
                evidenceById={evidenceById}
                domain={dataset.domain}
                dataset={dataset}
                onChanged={refetchDataset}
              />
            )}
            {activeTab === 'news' && (
              // Keyed by domain so switching research domains fully resets the ticker/date
              // filters and pagination (a filter picked for one domain's own ticker vocabulary is
              // otherwise stale, and possibly empty, against a different domain's) — same
              // convention `RelationshipsSection`/`HypothesesSection` already use above.
              <NewsFeedSection
                key={dataset.domain}
                domain={dataset.domain}
                researchDataset={dataset}
                onResearchUpdated={refetchDataset}
              />
            )}
            {activeTab === 'quant' && (
              // Keyed by domain for the same reason as the other filtered/stateful tabs above —
              // an entity picked from one domain's vocabulary is meaningless against another's.
              <QuantSection
                key={dataset.domain}
                domain={dataset.domain}
                entities={dataset.entities}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
