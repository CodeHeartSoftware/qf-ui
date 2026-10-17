import { useState } from 'react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

/** Shared trigger-button + absolutely-positioned menu chrome (open/close, click-outside-closes
 * via `onBlur`) behind every dropdown in the app — the switchers (`BotSwitcher`,
 * `MatchSwitcher`) and the action menu (`RunMatchMenu`) all render through this rather than each
 * reimplementing the same toggle/blur/positioning logic. Two shapes in one component:
 * - a **picker** (`BotSwitcher`/`MatchSwitcher`): pass `selectedValue`, omit `triggerLabel` — the
 *   trigger shows the selected option's own label, and that option is highlighted in the menu.
 * - an **action menu** (`RunMatchMenu`): pass a fixed `triggerLabel`, omit `selectedValue` — the
 *   trigger never changes and no option is highlighted, since picking one doesn't "select" it. */
export default function Dropdown<T extends string>({
  triggerLabel,
  options,
  selectedValue,
  onSelect,
  align = 'left',
  variant = 'picker',
}: {
  triggerLabel?: string;
  options: DropdownOption<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
  align?: 'left' | 'right';
  /** 'picker' (default) is the BotSwitcher/MatchSwitcher/form-field look — a neutral trigger
   * showing whatever's currently selected. 'action' matches this app's own bold, small,
   * uppercase-tracked action-button style (e.g. `RunMatchMenu`'s "RUN" menu) — for a trigger that
   * invokes something rather than displaying a current value; only meaningful alongside
   * `triggerLabel`, the "action menu" shape described above. 'danger' is the same action menu in
   * red, for destructive actions (e.g. `DeleteMatchMenu`). */
  variant?: 'picker' | 'action' | 'danger';
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === selectedValue);
  const label = triggerLabel ?? selected?.label ?? 'Select…';

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        onClick={() => {
          setOpen((o) => !o);
        }}
        className={
          variant !== 'picker'
            ? 'font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border border-border-4 bg-transparent text-muted cursor-pointer flex items-center gap-1.5'
            : 'font-mono text-xs px-3 py-2 rounded-[1px] border border-border bg-surface text-foreground cursor-pointer flex items-center gap-2'
        }
        style={{
          letterSpacing: variant === 'picker' ? '0.04em' : '0.06em',
          ...(variant === 'danger'
            ? {
                background: 'var(--color-danger)',
                borderColor: 'var(--color-danger)',
                color: 'var(--color-background)',
              }
            : {}),
        }}
      >
        {label}
        <span
          className={
            variant === 'picker' ? 'text-muted-4' : variant === 'danger' ? '' : 'text-muted-3'
          }
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1 flex flex-col z-10`}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
            minWidth: 200,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              className={`font-mono text-xs px-4 py-2.5 text-left bg-transparent cursor-pointer transition-all whitespace-nowrap hover:text-foreground hover:bg-surface-2 ${
                option.value === selectedValue ? 'text-accent' : 'text-muted-2'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
