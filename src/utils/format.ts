export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatUsdCents(cents: number): string {
  const dollars = cents / 100;
  const sign = dollars < 0 ? '-' : '';
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatSharpe(sharpe: number | null): string {
  return sharpe === null ? '—' : sharpe.toFixed(2);
}

/** research-core `type` values are domain-defined slugs ("manufacturing_capability",
 * "has_capability") — reformatted to Title Case for display only; filtering/lookups still key
 * off the raw slug. */
export function formatSlug(slug: string): string {
  return slug
    .split(/[_-]/)
    .map((word) => (word.length > 0 ? (word[0]?.toUpperCase() ?? '') + word.slice(1) : word))
    .join(' ');
}

/** HSL -> hex, so `colorForSlug` can keep returning a plain hex string — `Tag` and
 * `RelationshipTypeToggle` both build a translucent background/border by appending a hex alpha
 * suffix (`${color}22`), which only works on a hex color, not an `hsl(...)` string. */
function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number): string => {
    const k = (n + h / 30) % 12;
    const value = lightness - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

// A slug -> color registry, not a stateless hash — the hash alone occasionally collides two
// different slugs onto the same hue (out of only 360 available), which would defeat the entire
// point of a per-slug color. Module-level, so it's shared and consistent across every caller
// (EntityTable, RelationshipTable, RelationshipGraph, ...) for the life of the page; resets on
// reload, which is fine — this only needs to stay consistent within one session, not across them.
const colorBySlug = new Map<string, string>();
const assignedHues = new Set<number>();
const HUE_STEP = 137; // the golden-angle step — spreads successive hues around the wheel instead
// of clustering nearby ones, so even the first handful of distinct slugs already look distinct.

/** research-core `type`/relationship-state values are domain-defined, so there's no real
 * per-slug color to look up — this assigns each distinct slug its OWN color the first time it's
 * seen (a hash-derived starting hue, nudged forward until it lands on one no other slug has
 * already claimed) and reuses that same color on every later call for that slug. Guarantees no
 * two distinct slugs ever share a color (up to 360 of them — far more than this app's real
 * type/status vocabularies), unlike hashing into a small fixed palette or relying on the hash
 * alone to avoid collisions. */
export function colorForSlug(slug: string): string {
  const existing = colorBySlug.get(slug);
  if (existing !== undefined) return existing;

  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  let hue = Math.abs(hash) % 360;
  // Bounded rather than a bare `while` — once all 360 hues are ever actually claimed (never
  // realistic for this app's real type/status vocabularies), further slugs just reuse whatever
  // hue the hash landed on rather than spinning forever looking for a free one.
  for (let attempt = 0; attempt < 360 && assignedHues.has(hue); attempt++) {
    hue = (hue + HUE_STEP) % 360;
  }
  assignedHues.add(hue);

  const color = hslToHex(hue, 68, 62);
  colorBySlug.set(slug, color);
  return color;
}
