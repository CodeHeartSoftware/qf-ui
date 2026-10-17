import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import type { ApplyUpdateResult, ResearchHypothesis } from '@/hooks/apiTypes';
import { useApiAction } from '@/hooks/useApiAction';
import { Field, SectionToggle, buildHypothesisId, inputStyle } from './researchFormShared';

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

/**
 * Create a brand-new hypothesis, or edit an EXISTING one's name/statement/status and optionally
 * log a new assessment — from scratch, not tied to a news item. Submits through the same
 * `apply-update` pipeline: `mergeResearchUpdate` now treats a matching existing id as a
 * deliberate edit, always taking the incoming name/statement/status as authoritative (see that
 * function's own doc comment) rather than refusing on a mismatch the way it used to.
 *
 * `ResearchHypothesisSchema` itself still requires the top-level `status` to agree with whichever
 * assessment most recently recorded one — so changing status away from what it already is
 * REQUIRES logging a new assessment carrying that status; this form enforces that by disabling
 * the "log a new assessment" toggle (forcing it on) whenever status has actually changed.
 */
export default function HypothesisFormModal({
  open,
  onClose,
  domain,
  hypothesis,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  /** `undefined` means "create a new hypothesis"; given means "edit this one." */
  hypothesis?: ResearchHypothesis;
  onSuccess: () => void;
}) {
  const submit = useApiAction<ApplyUpdateResult>(
    `/api/research/${encodeURIComponent(domain)}/apply-update`,
  );

  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(hypothesis?.name ?? '');
  const [statement, setStatement] = useState(hypothesis?.statement ?? '');
  const [status, setStatus] = useState(hypothesis?.status ?? 'proposed');
  const statusChanged = hypothesis !== undefined && status !== hypothesis.status;
  const [assessmentEnabled, setAssessmentEnabled] = useState(hypothesis === undefined);
  const [confidence, setConfidence] = useState('0.6');
  const [rationale, setRationale] = useState('');

  const logsAssessment = hypothesis === undefined || statusChanged || assessmentEnabled;
  const canSubmit =
    name.trim() !== '' &&
    statement.trim() !== '' &&
    (!logsAssessment || (confidence.trim() !== '' && !Number.isNaN(Number(confidence))));

  const handleSubmit = async () => {
    const assessment = logsAssessment
      ? {
          timestamp: `${today}T00:00:00Z`,
          confidence: { value: Number(confidence) },
          supportingEvidenceIds: [] as string[],
          contradictingEvidenceIds: [] as string[],
          ...(rationale.trim() !== '' ? { rationale: rationale.trim() } : {}),
          ...(statusChanged || hypothesis === undefined ? { status } : {}),
        }
      : undefined;

    const id = hypothesis?.id ?? buildHypothesisId(name, statement);
    const result = await submit.run({
      hypotheses: [
        {
          id,
          name: name.trim(),
          statement: statement.trim(),
          status,
          createdAt: hypothesis?.createdAt ?? `${today}T00:00:00Z`,
          assessments: assessment !== undefined ? [assessment] : [],
        },
      ],
    });
    if (result?.ok === true) onSuccess();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hypothesis === undefined ? 'Add Hypothesis' : 'Edit Hypothesis'}
    >
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          placeholder="e.g. H035"
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>
      <Field label="Statement">
        <textarea
          value={statement}
          onChange={(e) => {
            setStatement(e.target.value);
          }}
          rows={2}
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>
      <Field label="Status">
        <Dropdown
          options={HYPOTHESIS_STATUSES.map((s) => ({ value: s, label: s }))}
          selectedValue={status}
          onSelect={setStatus}
        />
      </Field>

      {hypothesis !== undefined && (
        <SectionToggle
          label={
            statusChanged ? 'Log new assessment (required — status changed)' : 'Log new assessment'
          }
          enabled={logsAssessment}
          onToggle={() => {
            if (!statusChanged) setAssessmentEnabled((v) => !v);
          }}
        />
      )}

      {logsAssessment && (
        <div
          className="flex flex-col gap-2 pl-3"
          style={{ borderLeft: '2px solid var(--color-border-3)' }}
        >
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
          <Field label="Rationale (optional)">
            <textarea
              value={rationale}
              onChange={(e) => {
                setRationale(e.target.value);
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
        <p
          className="font-mono text-[10px]"
          style={{ color: submit.result.ok ? 'var(--color-accent)' : 'var(--color-danger)' }}
        >
          {submit.result.ok
            ? `Applied — dataset now version "${submit.result.newVersion ?? '?'}".`
            : (submit.result.error ?? 'The update was refused.')}
        </p>
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
          disabled={submit.loading || !canSubmit}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {submit.loading
            ? 'Submitting…'
            : hypothesis === undefined
              ? '+ Add Hypothesis'
              : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
