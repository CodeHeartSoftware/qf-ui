import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import type { ApplyUpdateResult, ResearchDataset } from '@/hooks/apiTypes';
import { useApiAction } from '@/hooks/useApiAction';
import {
  Field,
  SectionToggle,
  buildEntityId,
  buildEvidenceId,
  buildNewsEventId,
  buildNewsHypothesisId,
  buildNewsRelationshipId,
  findMatchingEntity,
  inputStyle,
  normalizeEventType,
} from './researchFormShared';

const RELATIONSHIP_TYPES = ['supplies', 'customer', 'qualification', 'acquires'];
const HYPOTHESIS_STATUSES = [
  'proposed',
  'active',
  'supported',
  'weakened',
  'falsified',
  'accepted',
  'rejected',
  'retired',
];
const NEW_HYPOTHESIS_VALUE = '__new__';
const NO_STATUS_CHANGE_VALUE = '__none__';

export interface NewsItemContext {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  ticker: string;
  companyName: string;
}

/** Builds and submits a real `ResearchUpdate` (see `@quant-fusion/research-store`) from a news
 * item — the same schema-exact JSON `portfolio-research-update-skill.md` produces, now composed
 * by hand instead of by an LLM reading the article. The backend's own real validator
 * (`applyResearchUpdateToMigration`) is authoritative; this form doesn't re-implement its rules,
 * it just gets a reasonable draft in front of it — a rejected update shows that validator's own
 * error back, unmodified. */
export default function ResearchUpdateModal({
  open,
  onClose,
  item,
  domain,
  dataset,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  item: NewsItemContext;
  /** Which research domain to submit this update to — `research.ts`'s `apply-update` route is
   * generic per domain, so this can't be hardcoded to fusion. */
  domain: string;
  /** `ResearchPanel`'s already-loaded dataset for `domain` (passed down via `NewsFeedSection`),
   * used for existing-entity/relationship/hypothesis lookups — this modal never fetches its own
   * copy. */
  dataset: ResearchDataset | undefined;
  /** Called after a successful submit — see `NewsFeedSection`'s own comment on why this matters:
   * without it, the rest of the Research tab only reflects the change after a domain switch. */
  onSuccess: () => void;
}) {
  const submit = useApiAction<ApplyUpdateResult>(
    `/api/research/${encodeURIComponent(domain)}/apply-update`,
  );

  const today = new Date().toISOString().slice(0, 10);
  const publishedDate = item.publishedAt.slice(0, 10);
  const evidenceId = useMemo(
    () => buildEvidenceId(item.ticker, publishedDate, item.link),
    [item.ticker, item.link, publishedDate],
  );

  const [description, setDescription] = useState(item.title);
  const [sourceName, setSourceName] = useState(item.source);

  const [relationshipEnabled, setRelationshipEnabled] = useState(false);
  const [counterpartyName, setCounterpartyName] = useState('');
  const [relationshipType, setRelationshipType] = useState('supplies');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(publishedDate);
  const [confidence, setConfidence] = useState('0.7');

  const [eventEnabled, setEventEnabled] = useState(false);
  const [eventType, setEventType] = useState('');

  const [hypothesisEnabled, setHypothesisEnabled] = useState(false);
  const [hypothesisId, setHypothesisId] = useState(NEW_HYPOTHESIS_VALUE);
  const [newHypothesisName, setNewHypothesisName] = useState('');
  const [newHypothesisStatement, setNewHypothesisStatement] = useState('');
  const [newHypothesisStatus, setNewHypothesisStatus] = useState('proposed');
  const [hypothesisConfidence, setHypothesisConfidence] = useState('0.6');
  const [hypothesisRationale, setHypothesisRationale] = useState(item.title);
  const [hypothesisStatusChange, setHypothesisStatusChange] = useState(NO_STATUS_CHANGE_VALUE);

  // The ticker's own company entity — resolved by name, same as the counterparty below, rather
  // than trusted from a pre-baked id: a tracked ticker (`tracked_tickers`) carries no entity link
  // of its own (see that table's doc comment), so a brand-new ticker's first-ever "Add to
  // Research" mints its entity here, exactly like a brand-new counterparty already does.
  const existingPrimaryEntity =
    dataset !== undefined
      ? findMatchingEntity(dataset.entities, item.companyName, item.ticker)
      : undefined;
  const primaryEntityId = existingPrimaryEntity?.id ?? buildEntityId(item.companyName);

  const existingEntity =
    dataset !== undefined ? findMatchingEntity(dataset.entities, counterpartyName) : undefined;
  const counterpartyEntityId = existingEntity?.id ?? buildEntityId(counterpartyName);
  const existingRelationship = dataset?.relationships.find(
    (r) =>
      (r.fromEntityId === primaryEntityId && r.toEntityId === counterpartyEntityId) ||
      (r.fromEntityId === counterpartyEntityId && r.toEntityId === primaryEntityId),
  );

  const selectedHypothesis = dataset?.hypotheses.find((h) => h.id === hypothesisId);

  const handleSubmit = async () => {
    const evidenceIds = [evidenceId];
    const update: Record<string, unknown[]> = {
      evidence: [
        {
          id: evidenceId,
          observedAt: `${today}T00:00:00Z`,
          publishedAt: `${publishedDate}T00:00:00Z`,
          source: { name: sourceName, uri: item.link },
          description,
          entityIds: [primaryEntityId, ...(relationshipEnabled ? [counterpartyEntityId] : [])],
        },
      ],
    };

    const newEntities: Record<string, unknown>[] = [];
    if (existingPrimaryEntity === undefined) {
      newEntities.push({
        id: primaryEntityId,
        type: 'company',
        name: item.companyName,
        recordedAt: `${today}T00:00:00Z`,
      });
    }
    if (relationshipEnabled && existingEntity === undefined && counterpartyName.trim() !== '') {
      newEntities.push({
        id: counterpartyEntityId,
        type: 'company',
        name: counterpartyName.trim(),
        recordedAt: `${today}T00:00:00Z`,
      });
    }
    if (newEntities.length > 0) update.entities = newEntities;

    if (relationshipEnabled && counterpartyName.trim() !== '') {
      const state = {
        status: relationshipStatus.trim() || relationshipType,
        recordedAt: `${today}T00:00:00Z`,
        effectiveFrom: `${effectiveFrom}T00:00:00Z`,
        evidenceIds,
        confidence: { value: Number(confidence) },
      };
      update.relationships = [
        existingRelationship !== undefined
          ? {
              id: existingRelationship.id,
              type: existingRelationship.type,
              fromEntityId: existingRelationship.fromEntityId,
              toEntityId: existingRelationship.toEntityId,
              states: [state],
            }
          : {
              id: buildNewsRelationshipId(item.ticker, counterpartyName),
              type: relationshipType,
              fromEntityId: primaryEntityId,
              toEntityId: counterpartyEntityId,
              states: [state],
            },
      ];
    }

    if (eventEnabled && eventType.trim() !== '') {
      update.events = [
        {
          id: buildNewsEventId(item.ticker, eventType, item.link),
          timestamp: `${publishedDate}T00:00:00Z`,
          type: normalizeEventType(eventType),
          entityIds: [primaryEntityId, ...(relationshipEnabled ? [counterpartyEntityId] : [])],
          payload: {},
          evidenceIds,
        },
      ];
    }

    if (hypothesisEnabled) {
      const assessment = {
        timestamp: `${publishedDate}T00:00:00Z`,
        confidence: { value: Number(hypothesisConfidence) },
        supportingEvidenceIds: evidenceIds,
        contradictingEvidenceIds: [],
        rationale: hypothesisRationale,
        ...(hypothesisStatusChange !== NO_STATUS_CHANGE_VALUE
          ? { status: hypothesisStatusChange }
          : {}),
      };
      if (hypothesisId === NEW_HYPOTHESIS_VALUE) {
        update.hypotheses = [
          {
            id: buildNewsHypothesisId(newHypothesisName || item.ticker, item.link),
            name: newHypothesisName.trim(),
            statement: newHypothesisStatement.trim(),
            status:
              hypothesisStatusChange !== NO_STATUS_CHANGE_VALUE
                ? hypothesisStatusChange
                : newHypothesisStatus,
            createdAt: `${today}T00:00:00Z`,
            assessments: [{ ...assessment, status: assessment.status ?? newHypothesisStatus }],
          },
        ];
      } else if (selectedHypothesis !== undefined) {
        update.hypotheses = [
          {
            id: selectedHypothesis.id,
            name: selectedHypothesis.name,
            statement: selectedHypothesis.statement,
            status:
              hypothesisStatusChange !== NO_STATUS_CHANGE_VALUE
                ? hypothesisStatusChange
                : selectedHypothesis.status,
            createdAt: selectedHypothesis.createdAt,
            assessments: [assessment],
          },
        ];
      }
    }

    const result = await submit.run(update);
    if (result?.ok === true) onSuccess();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add to Research">
      <div>
        <p className="font-mono text-[10px] text-muted-3">{item.ticker}</p>
        <p className="font-mono text-sm font-semibold text-foreground">{item.title}</p>
        {existingPrimaryEntity === undefined && (
          <p className="font-mono text-[9px] mt-1 text-muted-4">
            Mints a new entity "{primaryEntityId}" for {item.companyName}.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Field label="Evidence description">
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            rows={2}
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Source name">
            <input
              value={sourceName}
              onChange={(e) => {
                setSourceName(e.target.value);
              }}
              className="font-mono text-xs text-foreground"
              style={inputStyle}
            />
          </Field>
          <Field label="Published">
            <input
              value={publishedDate}
              disabled
              className="font-mono text-xs"
              style={inputStyle}
            />
          </Field>
        </div>
      </div>

      <SectionToggle
        label="Relationship"
        enabled={relationshipEnabled}
        onToggle={() => {
          setRelationshipEnabled((v) => !v);
        }}
      />
      {relationshipEnabled && (
        <div
          className="flex flex-col gap-2 pl-3"
          style={{ borderLeft: '2px solid var(--color-border-3)' }}
        >
          <Field label={`Counterparty (${item.companyName}'s ...)`}>
            <input
              list="entity-names"
              value={counterpartyName}
              onChange={(e) => {
                setCounterpartyName(e.target.value);
              }}
              placeholder="Entity name — existing or new"
              className="font-mono text-xs text-foreground"
              style={inputStyle}
            />
            <datalist id="entity-names">
              {dataset?.entities.map((e) => (
                <option key={e.id} value={e.name} />
              ))}
            </datalist>
          </Field>
          {counterpartyName.trim() !== '' && (
            <p className="font-mono text-[9px] text-muted-4">
              {existingRelationship !== undefined
                ? `Adds a new state to existing relationship "${existingRelationship.id}".`
                : existingEntity !== undefined
                  ? `New relationship to existing entity "${existingEntity.id}".`
                  : `Mints a new entity "${counterpartyEntityId}" and relationship.`}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Type">
              <Dropdown
                options={RELATIONSHIP_TYPES.map((t) => ({ value: t, label: t }))}
                selectedValue={relationshipType}
                onSelect={setRelationshipType}
              />
            </Field>
            <Field label="Confidence (0-1)">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={confidence}
                onChange={(e) => {
                  setConfidence(e.target.value);
                }}
                className="font-mono text-xs text-foreground"
                style={inputStyle}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Status label">
              <input
                value={relationshipStatus}
                onChange={(e) => {
                  setRelationshipStatus(e.target.value);
                }}
                placeholder="e.g. qualification track"
                className="font-mono text-xs text-foreground"
                style={inputStyle}
              />
            </Field>
            <Field label="Effective from">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => {
                  setEffectiveFrom(e.target.value);
                }}
                className="font-mono text-xs text-foreground"
                style={inputStyle}
              />
            </Field>
          </div>
        </div>
      )}

      <SectionToggle
        label="Event"
        enabled={eventEnabled}
        onToggle={() => {
          setEventEnabled((v) => !v);
        }}
      />
      {eventEnabled && (
        <div className="pl-3" style={{ borderLeft: '2px solid var(--color-border-3)' }}>
          <Field label="Event type">
            <input
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
              }}
              placeholder="e.g. SUPPLIER_QUALIFIED"
              className="font-mono text-xs text-foreground"
              style={inputStyle}
            />
          </Field>
        </div>
      )}

      <SectionToggle
        label="Hypothesis"
        enabled={hypothesisEnabled}
        onToggle={() => {
          setHypothesisEnabled((v) => !v);
        }}
      />
      {hypothesisEnabled && (
        <div
          className="flex flex-col gap-2 pl-3"
          style={{ borderLeft: '2px solid var(--color-border-3)' }}
        >
          <Field label="Hypothesis">
            <Dropdown
              options={[
                { value: NEW_HYPOTHESIS_VALUE, label: '+ New hypothesis' },
                ...(dataset?.hypotheses.map((h) => ({ value: h.id, label: h.name })) ?? []),
              ]}
              selectedValue={hypothesisId}
              onSelect={setHypothesisId}
            />
          </Field>
          {hypothesisId === NEW_HYPOTHESIS_VALUE ? (
            <>
              <Field label="Name">
                <input
                  value={newHypothesisName}
                  onChange={(e) => {
                    setNewHypothesisName(e.target.value);
                  }}
                  placeholder="e.g. H035"
                  className="font-mono text-xs text-foreground"
                  style={inputStyle}
                />
              </Field>
              <Field label="Statement">
                <textarea
                  value={newHypothesisStatement}
                  onChange={(e) => {
                    setNewHypothesisStatement(e.target.value);
                  }}
                  rows={2}
                  className="font-mono text-xs text-foreground"
                  style={inputStyle}
                />
              </Field>
              <Field label="Initial status">
                <Dropdown
                  options={HYPOTHESIS_STATUSES.map((s) => ({ value: s, label: s }))}
                  selectedValue={newHypothesisStatus}
                  onSelect={setNewHypothesisStatus}
                />
              </Field>
            </>
          ) : (
            selectedHypothesis !== undefined && (
              <p className="font-mono text-[10px] leading-relaxed text-muted-2">
                {selectedHypothesis.statement}
              </p>
            )
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Confidence (0-1)">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={hypothesisConfidence}
                onChange={(e) => {
                  setHypothesisConfidence(e.target.value);
                }}
                className="font-mono text-xs text-foreground"
                style={inputStyle}
              />
            </Field>
            <Field label="Status change">
              <Dropdown
                options={[
                  { value: NO_STATUS_CHANGE_VALUE, label: 'No change' },
                  ...HYPOTHESIS_STATUSES.map((s) => ({ value: s, label: s })),
                ]}
                selectedValue={hypothesisStatusChange}
                onSelect={setHypothesisStatusChange}
              />
            </Field>
          </div>
          <Field label="Rationale">
            <textarea
              value={hypothesisRationale}
              onChange={(e) => {
                setHypothesisRationale(e.target.value);
              }}
              rows={2}
              className="font-mono text-xs text-foreground"
              style={inputStyle}
            />
          </Field>
        </div>
      )}

      {submit.error !== undefined && (
        <p className="font-mono text-[10px] text-danger">{submit.error}</p>
      )}
      {submit.result !== undefined && (
        <div className="flex flex-col gap-1">
          <p
            className="font-mono text-[10px]"
            style={{ color: submit.result.ok ? 'var(--color-accent)' : 'var(--color-danger)' }}
          >
            {submit.result.ok
              ? `Applied — dataset now version "${submit.result.newVersion ?? '?'}". ${submit.result.note ?? ''}`
              : (submit.result.error ?? 'The update was refused.')}
          </p>
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
        <button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submit.loading}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {submit.loading ? 'Submitting…' : 'Submit Update'}
        </button>
      </div>
    </Modal>
  );
}
