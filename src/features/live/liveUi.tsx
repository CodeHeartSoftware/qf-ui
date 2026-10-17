import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Small shared pieces for the Live tab — same card/button/input chrome as the rest of the app. */

export const inputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
  width: '100%',
};

export function Card({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      className="p-4 flex flex-col gap-3"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm font-bold text-foreground">{title}</h3>
          {subtitle !== undefined && (
            <p className="font-mono text-[10px] text-muted-3 mt-1">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'accent' | 'danger' | 'warning';
};

export function SolidButton({ tone = 'accent', className = '', style, ...props }: ButtonProps) {
  const color = `var(--color-${tone})`;
  return (
    <button
      {...props}
      className={`font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ background: color, borderColor: color, color: 'var(--color-background)', ...style }}
    />
  );
}

export function GhostButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">{label}</span>
      {children}
    </label>
  );
}

export function usd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
