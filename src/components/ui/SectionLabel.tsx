import type { ReactNode } from 'react';

export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-widest uppercase mb-3 text-muted-3">{children}</p>
  );
}
