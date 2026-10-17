/** Raw stdout+stderr from a Phase B action (a spawned `apps/cli` command) rendered as a terminal
 * log — the honest way to surface "what happened" for an action with no structured result shape
 * of its own yet, rather than parsing/reformatting a human-oriented CLI transcript into something
 * that might silently misrepresent it. */
export default function ActionLog({ output, ok }: { output: string; ok: boolean }) {
  return (
    <pre
      className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words overflow-y-auto p-3 rounded-[2px]"
      style={{
        background: '#0a0a0a',
        border: `1px solid ${ok ? 'var(--color-border-3)' : 'var(--color-danger)'}`,
        color: '#999',
        maxHeight: 260,
      }}
    >
      {output.trim().length > 0 ? output : '(no output)'}
    </pre>
  );
}
