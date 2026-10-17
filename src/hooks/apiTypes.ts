// Mirrors of the JSON shapes `apps/api` returns — kept as plain interfaces here
// (not imported from the backend packages) since this is a browser bundle with no dependency on
// any Node/workspace package; see `docs/adr/0015-quant-fusion-ui-read-api.md`.

export interface BotSummary {
  id: string;
  name: string;
  version: string;
  game: string;
  description: string;
}

export type ForwardMatchStatus = 'active' | 'completed' | 'forfeited' | 'ended';

export interface ForwardMatchSummary {
  matchId: string;
  gameId: string;
  status: ForwardMatchStatus;
  createdAt: string;
  updatedAt: string;
  roundsPlayed: number;
  participantIds: string[];
}

export interface EquityPoint {
  date: string;
  equityCents: number;
}

export interface PositionObservation {
  ticker: string;
  shares: number;
  averageEntryPriceCents: number;
  realizedPnlCents: number;
  marketValueCents: number;
  unrealizedPnlCents: number;
}

export interface Fill {
  ticker: string;
  side: 'BUY' | 'SELL';
  kind: string;
  requestedQuantity: number;
  filledQuantity: number;
  priceCents: number;
  feeCents: number;
}

export interface CurrentStanding {
  participantId: string;
  rank: number;
  equityCents: number;
  cashCents: number;
  totalReturn: number;
  maxDrawdown: number;
  annualizedVolatility: number;
  sharpeRatio: number | null;
  positions: PositionObservation[];
  lastFills: Fill[];
  previousFills: Fill[];
}

export interface CurrentStandingsSummary {
  asOfDate: string | null;
  benchmarkReturn: number | null;
  standings: CurrentStanding[];
}

export interface ForwardMatchDetail {
  matchId: string;
  gameId: string;
  gameVersion: string;
  status: ForwardMatchStatus;
  createdAt: string;
  updatedAt: string;
  roundsPlayed: number;
  participantIds: string[];
  forfeitedParticipantIds?: string[];
  fullyResolved: boolean;
  /** Every ticker this match's bots are ALLOWED to trade (from config), not just the ones a
   * given bot currently holds a position in — see `standings.standings[].positions`, which only
   * ever lists real, current holdings. */
  marketDataUniverse: string[];
  /** Per-participant equity curve, oldest first — one entry at match start plus one more per
   * round resolved so far. Real historical data, not derived/estimated from the current
   * snapshot. */
  equityHistoryByParticipant: Record<string, EquityPoint[]>;
  standings: CurrentStandingsSummary;
}

export type TickerFreshnessStatus = 'current' | 'behind' | 'no-bars' | 'unmapped';

export interface TickerFreshness {
  ticker: string;
  latestKnownDate: string | null;
  status: TickerFreshnessStatus;
}

export interface DatasetFreshness {
  id: string;
  version: string;
  latestKnownDate: string | undefined;
  tickers: TickerFreshness[];
}

/** A fetchable market universe (`apps/api`'s own `marketUniverses.ts`) — explicit
 * and addressable on its own, independent of whether any forward match is currently active
 * against it (unlike `DatasetFreshness` above, which IS derived from active matches). */
export interface MarketUniverse {
  id: string;
  game: string;
  label: string;
  datasetId: string;
  datasetVersion: string;
  tickers: string[];
  /** The `@quant-fusion/job-run-store` id this universe's fetch action records/lists history
   * under — see `useJobRunHistory`. */
  jobId: string;
}

/** One completed job run (`@quant-fusion/job-run-store`) — see that package's own doc comment. */
export interface JobRun {
  id: string;
  jobId: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  summary: string;
  output: string;
}

export interface MarketDataStatus {
  datasets: DatasetFreshness[];
  research: { datasetId: string; latestKnownDate: string | undefined };
}

export interface ResearchEntity {
  id: string;
  type: string;
  name: string;
  description?: string;
  recordedAt: string;
}

/** One entry in a domain's registered entity-type taxonomy (`@quant-fusion/research-store`'s
 * `entity_types`) — which types the Add/Edit Entity modal offers, not the `type` values already
 * recorded on existing `ResearchEntity`s. `entityCount` is the API's own cross-reference against
 * the domain's actual entities, for display only. */
export interface EntityType {
  type: string;
  addedAt: string;
  entityCount: number;
}

export interface RelationshipState {
  status: string;
  effectiveFrom: string;
  effectiveTo?: string;
  evidenceIds: string[];
}

export interface ResearchRelationship {
  id: string;
  type: string;
  fromEntityId: string;
  toEntityId: string;
  states: RelationshipState[];
}

/** The only categories a relationship type can be sorted into — mirrors
 * `apps/api`'s own `RELATIONSHIP_TYPE_CATEGORIES` one-for-one: the four Exposure
 * Map dimensions `@quant-fusion/quant-sdk-js`'s own `computeExposureMap` classifies relationships
 * into by type. Not user-extensible — the Manage Relationship Types modal offers exactly these
 * four (plus "none") in a dropdown, never a free-text field. */
export const RELATIONSHIP_TYPE_CATEGORIES = [
  'manufacturing',
  'qualification',
  'contract',
  'program',
] as const;
export type RelationshipTypeCategory = (typeof RELATIONSHIP_TYPE_CATEGORIES)[number];

export function isRelationshipTypeCategory(value: string): value is RelationshipTypeCategory {
  return (RELATIONSHIP_TYPE_CATEGORIES as readonly string[]).includes(value);
}

/** One entry in a domain's registered relationship-type taxonomy
 * (`@quant-fusion/research-store`'s `relationship_types`) — which types the Add Relationship
 * modal offers, not the `type` values already recorded on existing `ResearchRelationship`s.
 * `relationshipCount` is the API's own cross-reference against the domain's actual relationships,
 * for display only. */
export interface RelationshipType {
  type: string;
  addedAt: string;
  relationshipCount: number;
  /** Which Exposure Map category this type has been sorted into — purely UI categorization,
   * never read by the real quant bot's own exposure computation. `undefined` means not sorted
   * into one yet. */
  category?: RelationshipTypeCategory;
}

export interface EvidenceSource {
  name: string;
  /** Not present on every source — e.g. a company disclosure or a conversation-derived note with
   * no captured URL. Never fabricate one when absent; see `RelationshipTable`'s own handling. */
  uri?: string;
  publisher?: string;
}

export interface Evidence {
  id: string;
  observedAt: string;
  source: EvidenceSource;
  description: string;
}

export interface HypothesisAssessment {
  timestamp: string;
  // A real `{value, basis?}` object, not a bare number (research-core's `Confidence` shape) — an
  // earlier version of this type flattened it to `number`, which silently produced "NaN%" in
  // `HypothesisCard` since nothing here actually transforms the API's raw JSON.
  confidence: { value: number; basis?: string };
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  rationale?: string;
  // Optional: this assessment also recorded a status change (see research-core's
  // `HypothesisAssessment.status`) — most assessments are a plain confidence update and omit it.
  status?: string;
}

export interface ResearchCriterion {
  description: string;
}

export interface ResearchHypothesis {
  id: string;
  name: string;
  statement: string;
  status: string;
  createdAt: string;
  assessments: HypothesisAssessment[];
  falsifiers?: ResearchCriterion[];
}

export interface ResearchEvent {
  id: string;
  timestamp: string;
  type: string;
  entityIds: string[];
  payload: Record<string, unknown>;
  evidenceIds: string[];
}

/** One entry in a domain's registered event-type taxonomy (`@quant-fusion/research-store`'s
 * `event_types`) — which types the Add Event modal offers, not the `type` values already
 * recorded on existing `ResearchEvent`s. `eventCount` is the API's own cross-reference against
 * the domain's actual events, for display only. */
export interface EventType {
  type: string;
  addedAt: string;
  eventCount: number;
}

/** One registered research domain's own summary — enough to render the domain sidebar without
 * fetching every domain's full dataset up front. */
export interface ResearchDomainSummary {
  domain: string;
  id: string;
  name: string;
  version: string;
  /** Sidebar display order — higher shown first. The API already returns `domains` sorted by
   * this (see `apps/api`'s `listResearchDomains`); `ResearchPanel` renders them in
   * the order it receives them, so this field is for display/transparency, not re-sorting. */
  priority: number;
  entityCount: number;
  relationshipCount: number;
  hypothesisCount: number;
  eventCount: number;
}

export interface ResearchDataset {
  id: string;
  name: string;
  version: string;
  domain: string;
  createdAt: string;
  entities: ResearchEntity[];
  relationships: ResearchRelationship[];
  hypotheses: ResearchHypothesis[];
  events: ResearchEvent[];
  evidence: Evidence[];
  // The UI doesn't otherwise render this collection — kept untyped beyond "an array" since only
  // its count is used (the Overview tab's footer stats).
  questions: unknown[];
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
}

export interface TickerNewsFeed {
  ticker: string;
  companyName: string;
  items: NewsItem[];
  error?: string;
}

export interface PortfolioNewsFeed {
  feeds: TickerNewsFeed[];
  fetchedAt: string;
}

/** A research domain's news watchlist entry — see `@quant-fusion/research-store`'s
 * `tracked_tickers` table. No `entityId`: a matching research entity, if any, is resolved by
 * company name at the point a headline actually becomes evidence (`ResearchUpdateModal`), not
 * stored here — tracking a ticker's news never requires a research entity to already exist. */
export interface TrackedTicker {
  ticker: string;
  companyName: string;
  addedAt: string;
}

// --- Quant analysis (@quant-fusion/quant-sdk-js), mirrored from apps/api's own
// `lib/quantAnalysis.ts` — the same pure functions the real quant bot (`quant-v0`) calls
// every round, surfaced read-only so a person can inspect a domain's research the way the bot
// itself would, without running a match.

export interface ExposureEntry {
  id: string;
  name: string;
  weight: number;
}

/** A security's multi-hop research exposure, kept in separate dimensions rather than one
 * collapsed score — see `@quant-fusion/quant-sdk-js`'s `research/exposure.ts`. */
export interface ExposureMap {
  targetEntityId: string;
  architecture: ExposureEntry[];
  material: ExposureEntry[];
  component: ExposureEntry[];
  manufacturing: ExposureEntry[];
  bottleneck: ExposureEntry[];
  qualification: ExposureEntry[];
  contract: ExposureEntry[];
  program: ExposureEntry[];
}

export interface HypothesisChange {
  hypothesisId: string;
  name: string;
  previousConfidence: number | null;
  currentConfidence: number;
  rationale: string | undefined;
}

export interface RelationshipChange {
  relationshipId: string;
  type: string;
  fromEntityId: string;
  toEntityId: string;
  previousStatus: string | null;
  currentStatus: string;
}

export interface ResearchDelta {
  isEmpty: boolean;
  newEvidence: Evidence[];
  changedHypotheses: HypothesisChange[];
  changedRelationships: RelationshipChange[];
  newEvents: ResearchEvent[];
}

/** One inspectable, research-sourced effect — never a black-box valuation update. See
 * `@quant-fusion/quant-sdk-js`'s `research/interpretEvents.ts` for the anti-inference rules that
 * produce these (capability never implies qualification, qualification never implies a customer
 * relationship, a customer relationship never implies a contract). */
export interface ModelEffect {
  factor: string;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  confidence: number;
  rationale: string;
  sourceHypothesisId?: string;
  scope?: 'portfolio' | 'ecosystem';
}

export interface ThesisGroupsPairwiseOverlap {
  tickerA: string;
  tickerB: string;
  overlap: number;
}

export interface ThesisGroups {
  groups: string[][];
  pairwiseOverlap: ThesisGroupsPairwiseOverlap[];
  unresolvedTickers: string[];
}

/** One security's full per-round decision from a `@quant-fusion/quant-sdk-js`-based bot (currently
 * just `quant-v0`) — the real object the bot's own `decision.ts` builds, recovered from a
 * `QUANT_DECISION_JSON:` line in a run/preview action's output (see `apps/api`'s
 * `parseQuantDecisions`). Only the fields this UI actually renders are declared — the API passes
 * the parsed JSON through loosely (`unknown[]`), so this is deliberately a partial, defensively
 * narrowed view, not a claim that these are the object's only real fields. */
export interface TradingDecision {
  date: string | null;
  security: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  expectedReturn: number;
  confidence: number;
  ensembleWeights: Record<string, number>;
  /** Why this name was or wasn't sized this round — absent from decisions logged before
   * quant-sdk-js started emitting it. See that package's `portfolio/selection.ts`. */
  selection?: {
    mode: 'threshold' | 'top_k';
    score: number;
    rank: number;
    rankedOf: number;
    selected: boolean;
    k?: number;
    threshold?: number;
  };
  /** Where fair value's static anchor came from (`first_observed` = the first close the bot saw)
   * — absent from older decisions. See quant-sdk-js's `valuation/pointInTimeAnchor.ts`. */
  baseAnchor?: { mode: 'first_observed' | 'config'; basePerShare: number };
  desiredWeight: number;
  targetWeight: number;
  riskAdjustments: string[];
  // `undefined` in the real object — JSON.stringify drops the key entirely rather than writing
  // `null`, so absence (not `null`) is how a first-ever decision with no prior valuation appears
  // after the round-trip through `QUANT_DECISION_JSON:`.
  valuationBefore?: number;
  valuationAfter: number;
  researchChanges: string[];
  modelEffects: string[];
  falsifiers: string[];
  rationale: string;
}

/** One participant's actual (or would-be) move for one ticker, exactly as `match forward preview`
 * decided "right now" — see `apps/api`'s `parsePreviewMoves.ts` for where this is
 * parsed out of a preview action's raw output. `quantity` is absent for a genuine `HOLD` or an
 * order shape the CLI didn't recognize, never fabricated as `0`. `changed` is `true` only when
 * this differs from what the match's own STORED config would have decided for the same ticker —
 * `false` in the common case, since a match's config rarely changes after creation. */
export interface PreviewMove {
  participantId: string;
  ticker: string;
  side: string;
  quantity?: number;
  changed: boolean;
}

export interface NewsAgentEntityDraft {
  id: string;
  type: string;
  name: string;
  recordedAt: string;
}

export interface NewsAgentEvidenceDraft {
  id: string;
  observedAt: string;
  publishedAt: string;
  source: { name: string; uri: string };
  description: string;
  entityIds: string[];
}

interface NewsAgentCandidateBase {
  ticker: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  rationale: string;
  proposedEntities: NewsAgentEntityDraft[];
  proposedEvidence: NewsAgentEvidenceDraft;
}

/** One LLM-proposed change to a research domain, from the News tab's "Run News Research Agent" —
 * mirrors `apps/api`'s `lib/newsAgent.ts` `NewsAgentCandidate` one-for-one. Never
 * applied automatically: every `proposed*` field is exactly the `apply-update` payload fragment a
 * "Go" submits, unmodified, the same shapes `ResearchUpdateModal`/`AddEventModal` already build by
 * hand. A discriminated union on `kind` rather than one flat shape — one source article can
 * legitimately warrant an event AND a relationship AND a hypothesis update all at once, and each
 * needs its own independent Go/No-Go, not one all-or-nothing card. */
export type NewsAgentCandidate =
  | (NewsAgentCandidateBase & {
      kind: 'event';
      /** True when the model proposed a type not already in this domain's registered
       * event-type taxonomy — the UI flags this, and a "Go" registers it
       * (`POST .../event-types`) before submitting the event itself. */
      isNewEventType: boolean;
      proposedEvent: {
        id: string;
        timestamp: string;
        type: string;
        entityIds: string[];
        payload: Record<string, unknown>;
        evidenceIds: string[];
      };
    })
  | (NewsAgentCandidateBase & {
      kind: 'relationship';
      /** True when the model proposed a type not already in this domain's registered
       * relationship-type taxonomy — a "Go" registers it (`POST .../relationship-types`) first. */
      isNewRelationshipType: boolean;
      /** False means this adds a new state to an ALREADY-recorded relationship (same id/type/
       * from/to as `proposedRelationship`) rather than minting a new one. */
      isNewRelationship: boolean;
      proposedRelationship: {
        id: string;
        type: string;
        fromEntityId: string;
        toEntityId: string;
        states: {
          status: string;
          recordedAt: string;
          effectiveFrom: string;
          evidenceIds: string[];
          confidence: { value: number };
        }[];
      };
    })
  | (NewsAgentCandidateBase & {
      kind: 'hypothesis';
      /** False means this adds a new assessment to an ALREADY-recorded hypothesis (same id) —
       * `proposedHypothesis.name`/`.statement` are that existing hypothesis's own, unchanged. */
      isNewHypothesis: boolean;
      proposedHypothesis: {
        id: string;
        name: string;
        statement: string;
        status: string;
        createdAt: string;
        assessments: {
          timestamp: string;
          confidence: { value: number };
          supportingEvidenceIds: string[];
          contradictingEvidenceIds: string[];
          rationale?: string;
          status?: string;
        }[];
      };
    });

export type LlmProvider = 'ollama' | 'openai';

/** One model this app can currently reach, tagged with which provider serves it — Ollama entries
 * come from the user's own local install, OpenAI entries only appear once a key is configured on
 * the Settings tab. See `apps/api`'s `lib/llm/index.ts`. */
export interface LlmModelOption {
  provider: LlmProvider;
  model: string;
}

/** The Settings tab's own view of app-wide config — the raw OpenAI key never round-trips back to
 * the browser once saved; `openaiApiKeyPreview` (its last 4 characters) is enough to confirm
 * "yes, that's the key I saved" without re-exposing the secret. */
export interface DailyCycleSchedule {
  enabled: boolean;
  /** `HH:MM`, 24h, the API host's local time. */
  timeLocal: string;
  matchIds: string[];
  lastTriggeredDate?: string;
}

export interface SettingsStatus {
  openaiApiKeyConfigured: boolean;
  openaiApiKeyPreview?: string;
  dailyCycle?: DailyCycleSchedule;
}

export type LiveJobStatus = 'running' | 'succeeded' | 'failed';

/** A long-running action's live state (`apps/api`'s `lib/jobRunner.ts` /
 * `lib/detachedJobs.ts`). From `/api/jobs/live/:id`, `output` is only the text after
 * `outputOffset` (the `since` the caller passed); from the `/api/jobs/live` list it's blank. */
export interface LiveJob {
  id: string;
  kind: string;
  label: string;
  startedAt: string;
  finishedAt?: string;
  status: LiveJobStatus;
  output: string;
  outputOffset?: number;
  summary?: string;
  result?: unknown;
}

/** `LiveJob.result` for a `daily-cycle` job (`lib/dailyCycle.ts`'s `DailyCycleResult`). */
export interface DailyCycleResult {
  matchId: string;
  fetchedNewBars: boolean;
  driftedBotIds?: string[];
  roundsPlayed?: number;
}

export type BotPinState = 'pinned' | 'drifted' | 'unpinned';

/** `/api/forward-matches/:id/pin-status` — `apps/cli`'s `match forward pin-status --json`. */
export interface MatchPinStatus {
  matchId: string;
  pinnedAt?: string;
  bots: { botId: string; state: BotPinState }[];
}

export interface NewsAgentRunResult {
  candidates: NewsAgentCandidate[];
  skippedCount: number;
  model: string;
  /** How many headlines the feed had, and how many of those triage actually picked to read in
   * full — so "found nothing" is never a black box (see `apps/api`'s
   * `lib/newsAgent.ts` for the full breakdown of what each combination means). */
  headlineCount: number;
  articlesRead: number;
  /** Set only when triage itself failed outright (an Ollama-side error, e.g. its own decode
   * guard aborting on a long prompt) — distinct from a real "read everything, found nothing new"
   * outcome, since no article was actually read this run. */
  triageError?: string;
}

/** Every research-panel form modal's `apply-update` response shape (`/api/research/:domain/
 * apply-update`) — one definition shared across `ResearchUpdateModal`/`AddEventModal`/
 * `EntityFormModal`/`RelationshipFormModal`/`HypothesisFormModal` rather than five identical
 * copies. */
export interface ApplyUpdateResult {
  ok: boolean;
  output: string;
  newVersion?: string;
  note?: string;
  error?: string;
}

// --- Live (real-account) trading — mirrors `apps/api`'s `lib/live/types.ts`.

export type BrokerKind = 'ibkr' | 'sim';

export interface ContractMapping {
  ticker: string;
  conid: number;
  exchange?: string;
  currency: string;
  lotSize: number;
}

export interface RiskLimits {
  maxOrderNotionalUsd: number;
  maxDailyTurnoverPct: number;
  maxPositionWeightPct: number;
  maxCapitalUsd?: number;
}

export interface LivePortfolio {
  id: string;
  name: string;
  botId: string;
  broker: BrokerKind;
  accountId?: string;
  gatewayUrl?: string;
  universeId: string;
  contracts: ContractMapping[];
  risk: RiskLimits;
  killSwitch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerPosition {
  ticker?: string;
  conid?: number;
  description: string;
  shares: number;
  averageCost: number;
  currency: string;
  marketValueUsd?: number;
}

export interface BrokerAccountSnapshot {
  accountId: string;
  asOf: string;
  cashUsd: number;
  netLiquidationUsd: number;
  positions: BrokerPosition[];
}

export interface BrokerConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  message?: string;
}

export interface ContractCandidate {
  conid: number;
  symbol: string;
  description: string;
  exchange?: string;
}

export type BrokerOrderState =
  'pending' | 'submitted' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected';

export interface ProposedOrder {
  clientOrderId: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  requestedQuantity: number;
  quantity: number;
  orderType: 'MKT' | 'LMT';
  limitPriceUsd?: number;
  referencePriceUsd: number;
  notionalUsd: number;
  checks: { rule: string; ok: boolean; message: string }[];
  blocked: boolean;
  status?: {
    state: BrokerOrderState;
    filledQuantity: number;
    averageFillPrice?: number;
    brokerOrderId?: string;
    messages: string[];
  };
}

export type TicketStatus =
  'pending_approval' | 'rejected' | 'expired' | 'submitted' | 'completed' | 'failed';

export interface OrderTicket {
  id: string;
  portfolioId: string;
  botId: string;
  createdAt: string;
  decisionDate: string;
  status: TicketStatus;
  snapshot: BrokerAccountSnapshot;
  botEquityUsd: number;
  orders: ProposedOrder[];
  rationale: unknown[];
  decidedAt?: string;
  submittedAt?: string;
  error?: string;
}

/** One (round, participant) row of a forward match's decision audit trail —
 * `/api/forward-matches/:id/audit`. `action`/`fills`/`rationale` are game- and bot-specific;
 * see `features/simulation/DecisionLog.tsx` for how stock-market-4's shapes are read. */
export interface RoundAuditEntry {
  matchId: string;
  roundIndex: number;
  participantId: string;
  date?: string;
  recordedAt: string;
  observationSha256?: string;
  collection: 'ok' | 'timeout' | 'invalid' | 'disconnected';
  action?: unknown;
  fills?: unknown;
  equityCents?: number;
  sourceSha256?: string;
  configSha256?: string;
  rationale?: unknown[];
}
