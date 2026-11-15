// Care team: connecting a person in recovery with their counsellor and with family or friends.
//
// How it works
//  * The person in recovery creates an invite (role + what they may see). They get a one-time
//    10-character code to give to that person. Only a hash of the code is stored.
//  * The counsellor or supporter opens Serenity, chooses their role, and enters the code.
//  * The person's phone publishes a filtered summary for each link (see summary.ts). Viewers
//    never read the person's own tables. Stopping sharing deletes what was shared.
//
// Without a backend (no Supabase keys) everything still works on one phone with sample data,
// so the team can see and test every screen.
import { Platform } from 'react-native';
import { supabase, backendEnabled, currentUserId } from './supabase';
import type { CareLinkLocal, CareMessage, CarePlan, CareState, LinkedPerson, ProNote, State } from './store';
import { uid } from './store';
import { buildSummary, cleanPermissions, normaliseCode, type CareRole, type LogoColour, type Permissions, type Summary } from './summary';
import { buildSnapshot } from './careSnapshot';

export const careOnline = backendEnabled;

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function localCode() {
  let c = '';
  for (let i = 0; i < 10; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}

// ---------------------------------------------------------------- member side

export async function createInvite(role: CareRole, label: string, memberName: string, perms: Permissions): Promise<CareLinkLocal> {
  const permissions = cleanPermissions(role, perms);
  const createdAt = new Date().toISOString();
  if (!supabase || !(await currentUserId())) {
    return { id: uid(), role, label, permissions, status: 'pending', code: localCode(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt, demo: true };
  }
  const { data, error } = await supabase.rpc('create_care_invite', { p_role: role, p_label: label, p_member_name: memberName, p_permissions: permissions });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row.link_id, role, label, permissions, status: 'pending', code: row.code, expiresAt: row.expires_at, createdAt };
}

export async function updatePermissions(link: CareLinkLocal, perms: Permissions, label?: string) {
  const permissions = cleanPermissions(link.role, perms);
  if (supabase && !link.demo) {
    const { error } = await supabase.from('care_links').update({ permissions, ...(label !== undefined ? { label } : {}) }).eq('id', link.id);
    if (error) throw new Error(error.message);
  }
  return permissions;
}

export async function revokeLink(link: CareLinkLocal) {
  if (supabase && !link.demo) {
    const { error } = await supabase.rpc('revoke_care_link', { p_link: link.id });
    if (error) throw new Error(error.message);
  }
}

/** Publish one filtered summary per active link. Called after each sync and when the button colour changes. */
export async function publishSummaries(s: State, logo: { state: LogoColour; reasons: string[] }) {
  if (!supabase || !(await currentUserId())) return 0;
  const me = await currentUserId();
  const snap = buildSnapshot(s, logo);
  const rows = s.care.links
    .filter((l) => !l.demo && l.status !== 'revoked')
    .map((l) => ({ link_id: l.id, member_id: me, payload: buildSummary(l.role, l.permissions, snap), updated_at: new Date().toISOString() }));
  if (!rows.length) return 0;
  const { error } = await supabase.from('shared_summaries').upsert(rows, { onConflict: 'link_id' });
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function shareJournalEntry(link: CareLinkLocal, entry: { id: string; at: string; text: string; mood?: number }) {
  if (supabase && !link.demo) {
    const me = await currentUserId();
    const { error } = await supabase.from('shared_items').insert({ link_id: link.id, member_id: me, kind: 'journal', payload: { id: entry.id, at: entry.at, text: entry.text.slice(0, 6000), mood: entry.mood } });
    if (error) throw new Error(error.message);
  }
}

export async function unshareJournalEntry(link: CareLinkLocal, entryId: string) {
  if (supabase && !link.demo) {
    await supabase.from('shared_items').delete().eq('link_id', link.id).contains('payload', { id: entryId });
  }
}

/** Ask the server to alert the care team (only when the colour got worse). Discreet text only. */
export async function alertCareTeam(prev: LogoColour, next: LogoColour) {
  if (!supabase || !(await currentUserId())) return;
  await supabase.functions.invoke('notify-care-team', { body: { prev, next } }).catch(() => {});
}

// ---------------------------------------------------------------- viewer side

export async function acceptInvite(code: string, viewerName: string): Promise<LinkedPerson> {
  const c = normaliseCode(code);
  if (!supabase || !(await currentUserId())) throw new Error('offline');
  const { data, error } = await supabase.rpc('accept_care_invite', { p_code: c, p_viewer_name: viewerName });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('invalid');
  return { linkId: row.link_id, role: row.role, memberName: row.member_name, permissions: {}, journal: [], acceptedAt: new Date().toISOString() };
}

export async function leaveLink(linkId: string) {
  if (supabase) await supabase.rpc('leave_care_link', { p_link: linkId });
}

/** Download everything a viewer is allowed to see. */
export async function fetchViewerData(): Promise<Pick<CareState, 'people' | 'messages'> | null> {
  if (!supabase) return null;
  const me = await currentUserId();
  if (!me) return null;
  const { data: links } = await supabase.from('care_links').select('id, role, member_name, permissions, status, accepted_at').eq('viewer_id', me).eq('status', 'active');
  if (!links) return null;
  const ids = links.map((l) => l.id);
  if (!ids.length) return { people: [], messages: [] };
  const [sum, items, plans, msgs] = await Promise.all([
    supabase.from('shared_summaries').select('link_id, payload').in('link_id', ids),
    supabase.from('shared_items').select('id, link_id, payload, created_at').in('link_id', ids).order('created_at', { ascending: false }).limit(200),
    supabase.from('care_plans').select('link_id, plan').in('link_id', ids),
    supabase.from('care_messages').select('id, link_id, sender_id, body, created_at, read_at').in('link_id', ids).order('created_at').limit(500),
  ]);
  const people: LinkedPerson[] = links.map((l) => ({
    linkId: l.id,
    role: l.role,
    memberName: l.member_name,
    permissions: l.permissions ?? {},
    acceptedAt: l.accepted_at,
    summary: (sum.data ?? []).find((x) => x.link_id === l.id)?.payload as Summary | undefined,
    journal: (items.data ?? []).filter((x) => x.link_id === l.id).map((x) => ({ id: x.id, at: x.payload.at ?? x.created_at, text: x.payload.text, mood: x.payload.mood })),
    plan: (plans.data ?? []).find((x) => x.link_id === l.id)?.plan as CarePlan | undefined,
  }));
  const messages: CareMessage[] = (msgs.data ?? []).map((m) => ({ id: m.id, linkId: m.link_id, mine: m.sender_id === me, body: m.body, at: m.created_at, read: !!m.read_at }));
  return { people, messages };
}

/** Download the member's own links, care plans and messages. */
export async function fetchMemberData(): Promise<Pick<CareState, 'links' | 'plans' | 'messages'> | null> {
  if (!supabase) return null;
  const me = await currentUserId();
  if (!me) return null;
  const { data: links } = await supabase.from('care_links').select('id, role, label, permissions, status, expires_at, created_at, viewer_name').eq('member_id', me).neq('status', 'revoked');
  if (!links) return null;
  const ids = links.map((l) => l.id);
  const [plans, msgs] = ids.length
    ? await Promise.all([
        supabase.from('care_plans').select('link_id, plan').in('link_id', ids),
        supabase.from('care_messages').select('id, link_id, sender_id, body, created_at, read_at').in('link_id', ids).order('created_at').limit(500),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];
  return {
    links: links.map((l) => ({ id: l.id, role: l.role, label: l.label, permissions: l.permissions ?? {}, status: l.status, expiresAt: l.expires_at, createdAt: l.created_at, viewerName: l.viewer_name || undefined })),
    plans: Object.fromEntries((plans.data ?? []).map((p: any) => [p.link_id, p.plan])),
    messages: (msgs.data ?? []).map((m: any) => ({ id: m.id, linkId: m.link_id, mine: m.sender_id === me, body: m.body, at: m.created_at, read: !!m.read_at })),
  };
}

// ---------------------------------------------------------------- both sides

export async function sendMessage(linkId: string, body: string, demo?: boolean): Promise<CareMessage> {
  const text = body.trim().slice(0, 1000);
  const msg: CareMessage = { id: uid(), linkId, mine: true, body: text, at: new Date().toISOString(), read: true };
  if (supabase && !demo) {
    const me = await currentUserId();
    const { data, error } = await supabase.from('care_messages').insert({ link_id: linkId, sender_id: me, body: text }).select('id, created_at').single();
    if (error) throw new Error(error.message);
    return { ...msg, id: data.id, at: data.created_at };
  }
  return msg;
}

export async function markRead(ids: string[]) {
  if (supabase && ids.length) await supabase.from('care_messages').update({ read_at: new Date().toISOString() }).in('id', ids);
}

// ---------------------------------------------------------------- professional only

export async function savePlan(linkId: string, plan: CarePlan, demo?: boolean) {
  const p = { ...plan, updatedAt: new Date().toISOString() };
  if (supabase && !demo) {
    const me = await currentUserId();
    const { error } = await supabase.from('care_plans').upsert({ link_id: linkId, author_id: me, plan: p, updated_at: p.updatedAt }, { onConflict: 'link_id' });
    if (error) throw new Error(error.message);
  }
  return p;
}

export async function fetchNotes(linkId: string): Promise<ProNote[] | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('pro_notes').select('id, link_id, session_date, body, created_at').eq('link_id', linkId).order('session_date', { ascending: false });
  return data ? data.map((n) => ({ id: n.id, linkId: n.link_id, date: n.session_date, body: n.body, at: n.created_at })) : null;
}

export async function saveNote(note: ProNote, demo?: boolean): Promise<ProNote> {
  if (supabase && !demo) {
    const me = await currentUserId();
    const row = { link_id: note.linkId, author_id: me, session_date: note.date, body: note.body.slice(0, 8000) };
    const isNew = !/^[0-9a-f-]{36}$/.test(note.id);
    const res = isNew ? await supabase.from('pro_notes').insert(row).select('id, created_at').single() : await supabase.from('pro_notes').update(row).eq('id', note.id).select('id, created_at').single();
    if (res.error) throw new Error(res.error.message);
    return { ...note, id: res.data.id, at: res.data.created_at };
  }
  return note;
}

export async function deleteNote(id: string, demo?: boolean) {
  if (supabase && !demo) await supabase.from('pro_notes').delete().eq('id', id);
}

export async function saveCareProfile(role: string, name: string, pro?: CareState['proProfile']) {
  if (!supabase) return;
  const me = await currentUserId();
  if (!me) return;
  await supabase.from('care_profiles').upsert({ user_id: me, role, display_name: name.slice(0, 80), profession: pro?.profession, registration: pro?.registration, organisation: pro?.organisation }, { onConflict: 'user_id' });
}

/** The role saved for this account (for logging in on a new phone). */
export async function fetchMyRole(): Promise<'member' | 'professional' | 'supporter' | null> {
  if (!supabase) return null;
  const me = await currentUserId();
  if (!me) return null;
  const { data } = await supabase.from('care_profiles').select('role').eq('user_id', me).maybeSingle();
  return (data?.role as any) ?? null;
}

// ---------------------------------------------------------------- phone alerts

/** Register this phone for care-team alerts. Not available in Expo Go on Android or on the web. */
export async function registerPush(): Promise<boolean> {
  if (!supabase || Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    if (!Device.isDevice) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const me = await currentUserId();
    if (!me) return false;
    await supabase.from('push_tokens').upsert({ user_id: me, token, platform: Platform.OS, updated_at: new Date().toISOString() }, { onConflict: 'user_id,token' });
    return true;
  } catch {
    return false;
  }
}
