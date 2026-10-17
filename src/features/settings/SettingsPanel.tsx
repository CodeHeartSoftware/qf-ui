import DailyCycleScheduleCard from './DailyCycleScheduleCard';
import { useSettingsPanel } from './useSettingsPanel';

const inputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
  width: '100%',
};

/** App-wide Stock Market 4 settings — currently just the OpenAI API key the News Research Agent
 * uses to reach GPT models alongside a local Ollama install (see
 * `apps/api`'s `lib/llm/index.ts`). A platform.openai.com API key, not a ChatGPT
 * login — the two are billed and issued separately. State/handlers live in `useSettingsPanel` —
 * this component only renders. */
export default function SettingsPanel() {
  const {
    status,
    statusError,
    loading,
    apiKeyInput,
    setApiKeyInput,
    saving,
    saveError,
    save,
    clear,
    refetch,
  } = useSettingsPanel();

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div
        className="p-4 flex flex-col gap-4"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-3)',
          borderRadius: 2,
        }}
      >
        <div>
          <h2 className="font-mono text-sm font-bold text-foreground">OpenAI API Key</h2>
          <p className="font-mono text-[10px] text-muted-3 mt-1">
            Used by the News Research Agent as an alternative to your local Ollama models — a key
            from platform.openai.com, not your ChatGPT login (a ChatGPT subscription has no API of
            its own).
          </p>
        </div>

        {loading ? (
          <p className="font-mono text-xs text-muted-4">Loading…</p>
        ) : statusError !== undefined ? (
          <p className="font-mono text-xs text-danger">{statusError}</p>
        ) : (
          <p className="font-mono text-xs text-muted-2">
            {status?.openaiApiKeyConfigured === true
              ? `Configured (ends in ...${status.openaiApiKeyPreview ?? '????'})`
              : 'Not configured.'}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
            {status?.openaiApiKeyConfigured === true ? 'Replace key' : 'API key'}
          </span>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => {
              setApiKeyInput(e.target.value);
            }}
            placeholder="sk-..."
            autoComplete="off"
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
        </label>

        {saveError !== undefined && (
          <p className="font-mono text-[10px] text-danger">{saveError}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              void save();
            }}
            disabled={saving || apiKeyInput.trim() === ''}
            className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              color: 'var(--color-background)',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {status?.openaiApiKeyConfigured === true && (
            <button
              onClick={() => {
                void clear();
              }}
              disabled={saving}
              className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!loading && statusError === undefined && (
        <DailyCycleScheduleCard saved={status?.dailyCycle} onSaved={refetch} />
      )}
    </div>
  );
}
