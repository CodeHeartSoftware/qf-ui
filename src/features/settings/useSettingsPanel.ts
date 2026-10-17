import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import type { SettingsStatus } from '@/hooks/apiTypes';

/** `SettingsPanel.tsx`'s own state and handlers, per `frontend-conventions`'s hookify default.
 * The raw key never comes back from the API once saved (see `SettingsStatus`'s own doc comment),
 * so `apiKeyInput` is a write-only draft — cleared after a successful save, never pre-filled from
 * `status`. */
export function useSettingsPanel() {
  const {
    data: status,
    error: statusError,
    loading,
    refetch,
  } = useApiResource<SettingsStatus>('/api/settings');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const save = async () => {
    if (apiKeyInput.trim() === '') return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await apiPost<SettingsStatus>('/api/settings', { openaiApiKey: apiKeyInput.trim() });
      setApiKeyInput('');
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await apiPost<SettingsStatus>('/api/settings', { openaiApiKey: null });
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}
