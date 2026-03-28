/**
 * Popup i content script mają osobne localStorage (różne originy).
 * chrome.storage.local jest wspólne dla całego rozszerzenia — używamy go
 * jako mostu do synchronizacji sesji Supabase między popup a content script.
 */

export const BRIDGE_KEY = 'crunchyroll_comments_auth_session';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function storage(): any {
  return (globalThis as any).chrome?.storage?.local ?? null;
}

export async function bridgeSaveSession(session: unknown): Promise<void> {
  const s = storage();
  if (s) await s.set({ [BRIDGE_KEY]: session });
}

export async function bridgeLoadSession(): Promise<unknown> {
  const s = storage();
  if (!s) return null;
  const result = await s.get(BRIDGE_KEY);
  return result?.[BRIDGE_KEY] ?? null;
}

export async function bridgeClearSession(): Promise<void> {
  const s = storage();
  if (s) await s.remove(BRIDGE_KEY);
}
