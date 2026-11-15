// Offline-first sync with Supabase.
// * Everything is saved on the phone first. Sync never blocks the person.
// * Only records that changed since the last upload are sent (tracked by fingerprint).
// * Journal text is encrypted on the phone before it is sent.
// * If the phone is offline, nothing is lost: the next sync sends the backlog.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, currentUserId } from './supabase';
import { getJournalKey } from './crypto';
import { fingerprint, open, seal } from './cryptoCore';
import { APPEND_ONLY, PULL_TABLES, rowsToState, SINGLETON, stateToRecords, SyncRecord } from './syncMap';
import type { EmergencyNumber, State } from './store';

type Synced = Record<string, { h: string; m: Record<string, unknown> }>;
const syncedKey = (uid: string) => `serenity:synced:${uid}`;

// Upload order: profile first, then everything else.
const ORDER = ['profiles', 'baselines', 'consents', 'support_contacts', 'goals', 'dimension_ratings', 'triggers', 'checkins',
  'journal_entries', 'day_logs', 'appointments', 'activities_completed', 'relapses', 'dismissals', 'safety_events'];

export class SignedOutError extends Error {}

// Tables the app may write to but never read (safety events). Postgres refuses
// "insert ... on conflict" there because it needs read access, so use plain inserts
// and treat "already uploaded" (unique violation 23505) as success.
const WRITE_ONLY = new Set(['safety_events']);
async function insertWriteOnly(table: string, rows: Record<string, unknown>[]) {
  const { error } = await supabase!.from(table).insert(rows);
  if (!error || error.code !== '23505') return error;
  for (const row of rows) {
    const { error: e } = await supabase!.from(table).insert(row);
    if (e && e.code !== '23505') return e;
  }
  return null;
}

export async function pushChanges(s: State): Promise<number> {
  if (!supabase) return 0;
  const uid = await currentUserId();
  if (!uid) throw new SignedOutError('signed out');
  const prev: Synced = JSON.parse((await AsyncStorage.getItem(syncedKey(uid))) ?? '{}');
  const records = stateToRecords(s, uid);
  const now: Synced = {};
  const changed = new Map<string, SyncRecord[]>();
  for (const r of records) {
    const h = fingerprint([r.row, r.secret]);
    now[r.key] = { h, m: Object.fromEntries(r.pk.map((k) => [k, r.row[k]])) };
    if (prev[r.key]?.h !== h) changed.set(r.table, [...(changed.get(r.table) ?? []), r]);
  }

  const saved: Synced = { ...prev };
  const persist = () => AsyncStorage.setItem(syncedKey(uid), JSON.stringify(saved));
  let sent = 0;

  for (const table of ORDER) {
    const recs = changed.get(table);
    if (!recs?.length) continue;
    let rows = recs.map((r) => r.row);
    if (table === 'journal_entries') {
      const key = await getJournalKey();
      rows = recs.map((r) => ({ ...r.row, ...seal(key, r.secret) }));
    }
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const error = WRITE_ONLY.has(table) ? await insertWriteOnly(table, chunk) : (
        await supabase.from(table).upsert(chunk, { onConflict: recs[0].pk.join(','), ignoreDuplicates: APPEND_ONLY.has(table) })
      ).error;
      if (error) {
        await persist();
        throw new Error(`${table}: ${error.message}`);
      }
      recs.slice(i, i + 200).forEach((r) => (saved[r.key] = now[r.key]));
      sent += chunk.length;
    }
  }

  // Items removed on the phone (a deleted contact, a removed trigger) are removed online too.
  for (const key of Object.keys(prev)) {
    if (now[key]) continue;
    const table = key.split(':')[0];
    if (APPEND_ONLY.has(table) || SINGLETON.has(table)) continue;
    const { error } = await supabase.from(table).delete().match(prev[key].m);
    if (error) {
      await persist();
      throw new Error(`${table}: ${error.message}`);
    }
    delete saved[key];
    sent++;
  }
  await persist();
  return sent;
}

export async function pullAll() {
  if (!supabase) return null;
  const uid = await currentUserId();
  if (!uid) throw new SignedOutError('signed out');
  const rows: Record<string, any[]> = {};
  for (const t of PULL_TABLES) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) throw new Error(`${t}: ${error.message}`);
    rows[t] = data ?? [];
  }
  const key = await getJournalKey();
  return rowsToState(rows, (c, n) => open(key, c, n));
}

/** Emergency numbers come from the admin-managed table and work before login. */
export async function pullEmergencyNumbers(): Promise<EmergencyNumber[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('emergency_numbers').select('id,label,label_tn,number,verified').order('sort_order');
  if (error || !data?.length) return null;
  return data.map((d: any) => ({ id: d.id, label: d.label, labelTn: d.label_tn ?? undefined, number: d.number, verified: d.verified }));
}

/** Forget what was uploaded (used on log out / account deletion). */
export async function forgetSyncState() {
  const uid = await currentUserId();
  if (uid) await AsyncStorage.removeItem(syncedKey(uid));
}
