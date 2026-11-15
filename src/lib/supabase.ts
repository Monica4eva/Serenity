// Supabase client. The app runs fully offline (local-only) until the two keys below
// are set in a `.env` file. See SUPABASE_SETUP.md.
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { newKey, open, seal } from './cryptoCore';
import { secureGet, secureSet, secureDelete } from './crypto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Session storage: login tokens are encrypted before they are written to the phone.
 * The encryption key sits in the secure store (which has a small size limit), and the
 * larger encrypted token sits in AsyncStorage.
 */
const SessionStorage = {
  async getItem(name: string) {
    const [k, raw] = await Promise.all([secureGet(`sk.${name}`), AsyncStorage.getItem(`ss.${name}`)]);
    if (!k || !raw) return null;
    const { c, n } = JSON.parse(raw);
    return open<string>(k, c, n);
  },
  async setItem(name: string, value: string) {
    const k = newKey();
    const { ciphertext, nonce } = seal(k, value);
    await secureSet(`sk.${name}`, k);
    await AsyncStorage.setItem(`ss.${name}`, JSON.stringify({ c: ciphertext, n: nonce }));
  },
  async removeItem(name: string) {
    await Promise.all([secureDelete(`sk.${name}`), AsyncStorage.removeItem(`ss.${name}`)]);
  },
};

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        // PKCE: the sign-in code from Google, Apple or Facebook is useless to anyone who intercepts it.
        auth: { storage: SessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
      })
    : null;

export const backendEnabled = !!supabase;

// Only refresh login tokens while the app is in the foreground.
if (supabase) {
  AppState.addEventListener('change', (s) => {
    if (s === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
