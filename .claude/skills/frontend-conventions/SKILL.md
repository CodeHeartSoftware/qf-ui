---
name: frontend-conventions
description: Defines how components, hooks, utils, and constants should be structured and where they should live in this single-app React + Vite + Tailwind v4 codebase (src/features, src/components, src/hooks, src/utils, src/constants). Use whenever creating or refactoring a component, hook, util, or constant anywhere under src/ — including when adding a new feature tab, extracting a sub-component, pulling logic out of a component into a hook, or noticing a hardcoded color/copy/derived-id string that should be shared. Also use when reviewing a diff under src/ for convention drift (inline hex colors, duplicated formatting logic, derived strings built inline).
---

# Frontend conventions

This is a single app in its own repo (not a monorepo): one `src/`, no `packages/*` inside it. The split that matters here
is by folder role, not by package:

- `src/features/<feature>/` — everything specific to one feature (fleet, portfolio, research,
  jobs). Default home for new code.
- `src/components/ui/` — small, reusable, presentational components with no feature-specific
  logic (`Metric`, `Tag`, `StatusPill`, `PageHeader`, `SectionLabel`, `TabButton`).
- `src/components/layout/` — app-shell/layout components (`AppHeader`).
- `src/hooks/` — data-fetching hooks against the API (`quant-fusion-api` repo, `apps/api`) (`useApiResource`,
  `useBots`, `useForwardMatches`, `useForwardMatch`, `useMarketDataStatus`, `useResearch`), plus
  the shared `apiTypes.ts` mirroring the API's JSON shapes. Introduced once more than one feature
  needed the same "fetch this path, track loading/error/data" shape — same rationale
  `src/constants/` is introduced under below. A hook here is a thin fetch wrapper; a feature's own
  derived/composed hook (e.g. `features/fleet/useFleet.ts` combining two of these) stays in that
  feature.
- `src/utils/` — pure functions, no React, reusable across features (`format.ts`).
- `src/constants/` — shared copy/labels and derived-string builders (`ids.ts`).

Default to `src/features/<feature>/` for anything feature-specific; promote to `components/ui`,
`hooks`, `utils`, or `constants` only once something is (or is clearly about to be) reused across
features.

## Quick start

Shape of a feature component — props typed inline, no separate hook needed here because there's
no local state to extract, Tailwind theme tokens instead of inline hex:

```tsx
export default function BotFilterBar({
  activeStatus,
  onStatusChange,
}: {
  activeStatus: BotStatus | 'all';
  onStatusChange: (status: BotStatus | 'all') => void;
}) {
  return (
    <div className="flex gap-2">
      {STATUS_FILTERS.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className="font-mono text-xs px-3 py-1 text-muted border border-border"
        >
          {status}
        </button>
      ))}
    </div>
  );
}
```

Note: default export, props typed inline in the signature (matches `BotCard.tsx`,
`FleetTab.tsx` — no separate `BotFilterBarProps` type unless the component is shared/complex), and
`text-muted` / `border-border` instead of `style={{ color: "#555" }}` — those classes resolve to
the exact same hex via the `@theme inline` tokens already defined in `src/index.css`.

Shape of a data-fetching hook (matches `useBots.ts`, `useForwardMatches.ts`):

```ts
export function useBots() {
  const { data, error, loading } = useApiResource<{ bots: BotSummary[] }>('/api/bots');
  return { bots: data?.bots ?? [], error, loading };
}
```

Shape of a feature's own composed hook (matches `features/fleet/useFleet.ts`):

```ts
export function useFleet() {
  const { bots, error: botsError, loading: botsLoading } = useBots();
  const { matches, error: matchesError, loading: matchesLoading } = useForwardMatches();
  // ...derive matchesByBotId...
  return {
    bots,
    matchesByBotId,
    error: botsError ?? matchesError,
    loading: botsLoading || matchesLoading,
  };
}
```

Note: named export `export function useX(...)`, no separate params-interface file for a zero-arg
hook like these (add one once the hook takes params), and an object-literal return even if a
caller currently destructures only one field.

Shape of a component's own state+handlers pulled into a co-located hook (matches
`useAddEventModal.ts`, called from `AddEventModal.tsx`) — the DEFAULT move for any component that
owns more than a prop list, not something reserved for when a business rule is buried inside. The
component keeps rendering; the hook keeps every `useState`, every handler, and returns the
values/setters the JSX needs:

```ts
export function useAddEventModal({ domain, onSuccess }: { domain: string; onSuccess: () => void }) {
  const submit = useApiAction<ApplyUpdateResult>(
    `/api/research/${encodeURIComponent(domain)}/apply-update`,
  );
  const [type, setType] = useState('');
  const [entityIds, setEntityIds] = useState<Set<string>>(() => new Set());
  // ...remaining state, a toggleEntity(id) handler, canSubmit, handleSubmit...
  return { type, setType, entityIds, toggleEntity, canSubmit, handleSubmit, submit };
}
```

Extracting pays off in two ways depending on what's inside: it's ALWAYS testable-without-rendering
once it's in its own function (call the hook via `renderHook`, or test a plain function directly
if it needs no `useState`), and it's SOMETIMES also catching a real business rule a component
would otherwise bury inline — e.g. `HypothesisFormModal.tsx`'s "changing status requires a new
status-carrying assessment, or the backend's own schema validation rejects it." Do both: hookify
the state/handlers by default, and if a piece of that logic is a pure input→output decision with
no `useState`/`useEffect` of its own (like the hypothesis-status rule), pull THAT further into its
own plain function inside the hook file rather than leaving it as an inline branch:

```ts
export function deriveHypothesisAssessment(
  form: { status: string; confidence: string; rationale: string },
  existingStatus: string | undefined,
  logExplicitly: boolean,
):
  | { timestamp: string; confidence: { value: number }; rationale?: string; status?: string }
  | undefined {
  const statusChanged = existingStatus !== undefined && form.status !== existingStatus;
  if (existingStatus !== undefined && !statusChanged && !logExplicitly) return undefined;
  return {
    timestamp: new Date().toISOString(),
    confidence: { value: Number(form.confidence) },
    ...(form.rationale.trim() !== '' ? { rationale: form.rationale.trim() } : {}),
    ...(statusChanged || existingStatus === undefined ? { status: form.status } : {}),
  };
}
```

Shape of a util (matches `src/utils/format.ts`):

```ts
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}
```

Named export, pure, no React/hook dependency.

Shape of a constants entry (`src/constants/ids.ts`):

```ts
export function buildSparklineGradientId(participantId: string): string {
  return `spark-${participantId}`;
}
```

The moment a derived id/key string (a chart gradient id, a DOM id) is built via template literal
anywhere — inline in JSX, as a local `const`, or inside a hook — stop and turn it into a named
`build*` function here instead, called from wherever it's needed.

## Workflows

### Create or refactor a component

1. Default export. Type props inline in the function signature unless the component is shared
   across features or has enough props (~6+) that a named type improves readability — then give
   it a `<ComponentName>Props` type above the component.
2. Default to extracting a component's own state and handlers into a co-located
   `use<ComponentName>` hook — this is the normal move once a component owns more than a prop
   list, whether or not anything inside is a business-rule decision; organizational separation
   (component renders, hook holds the logic) is reason enough on its own. Skip it only for a
   component with no local state at all to extract (pure presentational, e.g. `BotFilterBar.tsx`
   in the Quick start example above). Within that hook (or within the component if you're not
   hookifying it), also pull out any pure input→output decision — a conditional business rule, a
   payload/shape derivation, which combination of fields is valid together — into its own plain
   function rather than leaving it as an inline branch; that piece is independently testable with
   no `useState` and no rendering at all. See `HypothesisFormModal.tsx`'s own
   `logsAssessment`/`statusChanged` case for a decision that should be pulled out this way, and
   `AddEventModal.tsx`/`useAddEventModal.ts` for the state+handlers half of this already applied.
3. Place it in `src/features/<feature>/` by default. Move it to `src/components/ui/` only once
   it's used by (or clearly intended for) more than one feature, and it has no feature-specific
   logic. Move it to `src/components/layout/` if it's part of the app shell rather than a feature.
4. If it renders a mapped list where each item has any real markup, extract the item into its own
   component (see `fleet/BotCard.tsx` rendered from `fleet/FleetTab.tsx`).
5. Keep conditional rendering simple: a ternary or `&&` should read as one line or one
   already-named component per branch.
6. Prefer the Tailwind theme tokens already defined in `src/index.css`'s `@theme inline` block
   (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `text-accent`,
   `text-danger`, `text-warning`, `text-info`, ...) over inline `style={{ color: "#e8e8e8" }}`-style
   hex.
7. Replace copy or derived id/key strings that appear in more than one place with a
   `src/constants/` entry instead of leaving them as literals or inline template strings.

### Create or refactor a hook

1. A hook that only fetches one API path belongs in `src/hooks/`, named `use<Resource>` and built
   on `useApiResource`. A hook that composes/derives from more than one of those for a single
   feature's view belongs in that feature's own folder instead (e.g. `useFleet.ts`).
2. Params go in an interface above the hook once the hook takes any arguments; a zero-arg hook
   doesn't need one.
3. Always return an object literal, even for a single value.
4. Named-export it: `export function useX(...)`. No default-exported hooks.

### Create or refactor a util

1. A function belongs in `src/utils/` if it has no JSX and no hook/state dependency.
2. Exception: a function whose only job is building a derived id/key string is not a util — put
   it in `src/constants/` instead.
3. Named export.
4. Before adding a new util, grep for the expression you're about to duplicate.

### Create or refactor a constant

1. `src/constants/` holds shared copy/labels reused across more than one component, and
   `build*Id`/`build*Key` functions that construct a derived string.
2. A single-use literal string doesn't need to move here.
3. Named export, same as utils.

## Reference

- Keep props minimal — once a single component's prop count passes ~10, prefer a
  context/provider over further prop-drilling.
- Before considering a component done, grep it for `style={{` with a `color:`/`background:`/
  `border` hex value — that's the signal a Tailwind theme token should have been used instead.
- Also grep for a template literal assigned to a local variable or interpolated directly into
  JSX — that's the signal a derived id/key string escaped into the file instead of becoming a
  `build*` function in `src/constants/`.
- KISS on ternaries: each branch should be a single line or a single already-named component.
- Before considering a component with any local state done, check whether its state and handlers
  are still sitting in the `.tsx` file — the default is a co-located `use<ComponentName>` hook
  holding them, not "only once a business rule needs testing" (see the hookify rule above).
- Within a submit/save handler specifically, also scan for a conditional that decides WHAT gets
  sent (which fields, an optional block's presence, a derived id) rather than just reading form
  state — that's a business-rule decision worth its own plain function, on top of (not instead of)
  moving the handler itself into the hook.
