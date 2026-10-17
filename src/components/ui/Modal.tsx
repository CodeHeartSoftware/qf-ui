import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** The first modal/dialog in this app — a fixed-position dark backdrop + a centered, scrollable
 * content box in the same card chrome (`background:var(--color-surface);border:1px solid var(--color-border-3)`) every other
 * surface here already uses. Closes on Escape or a click on the backdrop itself (never a click
 * inside the content box, via `stopPropagation`).
 *
 * Rendered via a portal straight into `document.body` rather than in place: every tab's content
 * in `App.tsx` is wrapped in `.animate-fade-in`, whose keyframes end at `transform: translateY(0)`
 * with `animation-fill-mode: forwards` — and ANY non-`none` transform on an ancestor (even a
 * no-op one) makes that ancestor the containing block for `position: fixed` descendants per the
 * CSS spec. Without the portal, this modal would render "fixed" relative to that scrolled tab
 * container instead of the real viewport — invisible above the fold on a long, scrolled page
 * instead of centered on screen. */
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)', padding: '5vh 16px', zIndex: 50 }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-full flex flex-col"
        style={{
          maxWidth: 560,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-3)',
          borderRadius: 2,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-3)' }}
        >
          <h2 className="font-mono text-sm font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="font-mono text-sm px-2 bg-transparent cursor-pointer text-muted-3"
          >
            ✕
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
