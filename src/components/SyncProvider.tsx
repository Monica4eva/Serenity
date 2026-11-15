// Runs sync in the background: after changes (debounced), when the app comes back to the
// foreground, and right after logging in. The app never waits on it.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { resettingPassword } from '../lib/auth';
import { AppState } from 'react-native';
import { useStore } from '../lib/store';
import { backendEnabled, supabase } from '../lib/supabase';
import { pullAll, pullEmergencyNumbers, pushChanges, SignedOutError } from '../lib/sync';
import { mergeIntoState } from '../lib/syncMap';
import { CareSync } from './CareSync';

export type SyncStatus = 'off' | 'signedOut' | 'idle' | 'syncing' | 'offline' | 'error';
type Ctx = { status: SyncStatus; lastAt?: string; error?: string; syncNow: () => Promise<void>; pullNow: () => Promise<void> };
const SyncContext = createContext<Ctx>({ status: 'off', syncNow: async () => {}, pullNow: async () => {} });
export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { state, ready, update } = useStore();
  const [status, setStatus] = useState<SyncStatus>(backendEnabled ? 'signedOut' : 'off');
  const [lastAt, setLastAt] = useState<string>();
  const [error, setError] = useState<string>();
  const latest = useRef(state);
  latest.current = state;
  const busy = useRef(false);

  const handle = (e: unknown) => {
    if (e instanceof SignedOutError) return setStatus('signedOut');
    const msg = e instanceof Error ? e.message : String(e);
    setError(msg);
    setStatus(/network|fetch|timeout/i.test(msg) ? 'offline' : 'error');
  };

  const syncNow = useCallback(async () => {
    if (!backendEnabled || busy.current || resettingPassword) return;
    busy.current = true;
    setStatus('syncing');
    try {
      // Counsellors and supporters keep no recovery records of their own to upload.
      if (!latest.current.appRole || latest.current.appRole === 'member') await pushChanges(latest.current);
      setLastAt(new Date().toISOString());
      setError(undefined);
      setStatus('idle');
    } catch (e) {
      handle(e);
    } finally {
      busy.current = false;
    }
  }, []);

  const pullNow = useCallback(async () => {
    if (!backendEnabled) return;
    try {
      setStatus('syncing');
      const res = await pullAll();
      if (res) update((s) => mergeIntoState(s, res.patch, res.locked));
      setStatus('idle');
      setTimeout(syncNow, 500);
    } catch (e) {
      handle(e);
    }
  }, [syncNow, update]);

  // Admin-managed emergency numbers (works before login).
  useEffect(() => {
    if (!ready) return;
    pullEmergencyNumbers()
      .then((nums) => nums && update((s) => ({ ...s, emergencyNumbers: nums })))
      .catch(() => {});
  }, [ready]);

  // Log in / log out events.
  useEffect(() => {
    if (!supabase || !ready) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) syncNow();
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && !resettingPassword) pullNow();
      if (event === 'SIGNED_OUT') setStatus('signedOut');
    });
    return () => data.subscription.unsubscribe();
  }, [ready]);

  // Debounced upload after changes.
  useEffect(() => {
    if (!backendEnabled || !ready) return;
    const t = setTimeout(syncNow, 4000);
    return () => clearTimeout(t);
  }, [state, ready]);

  // Retry when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && syncNow());
    return () => sub.remove();
  }, []);

  return <SyncContext.Provider value={{ status, lastAt, error, syncNow, pullNow }}>
      <CareSync />
      {children}
    </SyncContext.Provider>;
}
