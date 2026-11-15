// Talks to the same Supabase database as the Serenity app.
// Admins only ever get: counsellor sign-up details, emergency numbers, ANONYMOUS totals,
// the admin list and the admin activity log. The database refuses anything else.
//
// Without keys in .env the dashboard runs on sample data, so it can be shown and tested.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const sb: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } }) : null;
export const DEMO = !sb;

export type AdminRole = 'admin' | 'clinician' | 'editor';
export type ReviewStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type Professional = {
  user_id: string; display_name: string; email: string | null; profession: string | null; registration: string | null;
  organisation: string | null; review_status: ReviewStatus; review_note: string | null; reviewed_at: string | null;
  created_at: string; active_clients: number;
};
export type EmergencyNumber = {
  id: string; label: string; label_tn: string | null; number: string; verified: boolean; sort_order: number; active: boolean;
  checked_at: string | null; updated_at?: string;
};
export type AdminRow = { user_id: string; display_name: string; email: string | null; role: AdminRole; created_at: string };
export type ActionRow = { id: number; admin_id: string | null; action: string; target: string | null; detail: Record<string, unknown>; at: string };
export type Impact = {
  generated_at: string; min_group: number; members: number; new_30d: number; active_7d: number; active_30d: number;
  retention: { days: number; cohort: number | null; pct: number | null }[];
  slips: { count: number | null; back_within_7d_pct: number | null; median_days_back: number | null };
  weekly: { week: string; active: number | null; mood: number | null; sleep: number | null; checkins: number | null }[];
  by_language: { language: string; members: number | null; retention30: number | null }[];
  safety_30d: Record<string, number>;
  care: { professional_links: number; supporter_links: number; pending_professionals: number; verified_professionals: number };
};

const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

// ---------------------------------------------------------------- sign in

export async function signIn(email: string, password: string) {
  if (DEMO) return;
  const { error } = await sb!.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  fail(error);
}
/** Sends a reset email. The link comes back to this website with ?reset=1. */
export async function sendReset(email: string) {
  if (DEMO) return;
  const back = `${location.origin}${location.pathname}?reset=1`;
  const { error } = await sb!.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: back });
  fail(error);
}
/** True when this page was opened from a reset email. */
export const openedFromReset = () => new URLSearchParams(location.search).get('reset') === '1';
/** Waits until the one-time code in the link has been turned into a session (done by the client). */
export async function waitForResetSession(): Promise<boolean> {
  for (let i = 0; i < 20; i++) {
    const { data } = await sb!.auth.getSession();
    if (data.session) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}
export async function setNewPassword(password: string) {
  const { error } = await sb!.auth.updateUser({ password });
  fail(error);
  history.replaceState(null, '', location.pathname); // remove ?reset=1&code=... from the address
}

export async function signOut() {
  if (!DEMO) await sb!.auth.signOut();
}
export async function hasSession() {
  if (DEMO) return false;
  const { data } = await sb!.auth.getSession();
  return !!data.session;
}
/** 'none' = not an admin, 'needs_mfa' = admin who still needs the second step, 'ok' = in. */
export async function adminStatus(): Promise<'none' | 'needs_mfa' | 'ok'> {
  if (DEMO) return 'ok';
  const { data, error } = await sb!.rpc('admin_status');
  fail(error);
  return data;
}
export async function myRole(): Promise<AdminRole | null> {
  if (DEMO) return 'admin';
  const { data } = await sb!.rpc('admin_role');
  return data ?? null;
}

/** Second step: an authenticator app (Google Authenticator, Microsoft Authenticator, Authy). */
export async function mfaFactor(): Promise<{ id: string } | null> {
  const { data, error } = await sb!.auth.mfa.listFactors();
  fail(error);
  return data?.totp.find((f) => f.status === 'verified') ?? null;
}
export async function mfaEnroll(): Promise<{ id: string; qr: string; secret: string }> {
  // Remove half-finished set-ups from earlier tries, then start a new one.
  const { data: list } = await sb!.auth.mfa.listFactors();
  for (const f of list?.all ?? []) if (f.status !== 'verified') await sb!.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await sb!.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Serenity admin ${new Date().toISOString().slice(0, 10)}` });
  fail(error);
  return { id: data!.id, qr: data!.totp.qr_code, secret: data!.totp.secret };
}
export async function mfaVerify(factorId: string, code: string) {
  const { error } = await sb!.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, '') });
  fail(error);
}

// ---------------------------------------------------------------- data

export async function getImpact(): Promise<Impact> {
  if (DEMO) return demoImpact();
  const { data, error } = await sb!.rpc('admin_impact');
  fail(error);
  return data;
}

export async function listProfessionals(): Promise<Professional[]> {
  if (DEMO) return demo.pros;
  const { data, error } = await sb!.rpc('admin_list_professionals');
  fail(error);
  return data ?? [];
}
export async function reviewProfessional(userId: string, status: ReviewStatus, note: string) {
  if (DEMO) {
    demo.pros = demo.pros.map((p) => (p.user_id === userId ? { ...p, review_status: status, review_note: note || null, reviewed_at: new Date().toISOString() } : p));
    demoLog(`professional_${status}`, userId, { note });
    return;
  }
  const { error } = await sb!.rpc('admin_review_professional', { p_user: userId, p_status: status, p_note: note || null });
  fail(error);
}

export async function listNumbers(): Promise<EmergencyNumber[]> {
  if (DEMO) return [...demo.numbers].sort((a, b) => a.sort_order - b.sort_order);
  const { data, error } = await sb!.from('emergency_numbers').select('*').order('sort_order');
  fail(error);
  return data ?? [];
}
export async function saveNumber(n: EmergencyNumber, isNew: boolean) {
  const row = { id: n.id, label: n.label.trim(), label_tn: n.label_tn?.trim() || null, number: n.number.trim(), verified: n.verified, sort_order: n.sort_order, active: n.active, checked_at: n.checked_at, updated_at: new Date().toISOString() };
  if (DEMO) {
    demo.numbers = isNew ? [...demo.numbers, row] : demo.numbers.map((x) => (x.id === n.id ? row : x));
    demoLog(`emergency_number_${isNew ? 'insert' : 'update'}`, n.id, { label: n.label, number: n.number });
    return;
  }
  const { error } = isNew ? await sb!.from('emergency_numbers').insert(row) : await sb!.from('emergency_numbers').update(row).eq('id', n.id);
  fail(error);
}
export async function markChecked(n: EmergencyNumber) {
  const { data } = DEMO ? { data: null } : await sb!.auth.getUser();
  await saveNumber({ ...n, verified: true, checked_at: new Date().toISOString() }, false);
  if (!DEMO && data?.user) await sb!.from('emergency_numbers').update({ checked_by: data.user.id }).eq('id', n.id);
}
export async function deleteNumber(id: string) {
  if (DEMO) {
    demo.numbers = demo.numbers.filter((x) => x.id !== id);
    demoLog('emergency_number_delete', id, {});
    return;
  }
  const { error } = await sb!.from('emergency_numbers').delete().eq('id', id);
  fail(error);
}

export async function listAdmins(): Promise<AdminRow[]> {
  if (DEMO) return demo.admins;
  const { data, error } = await sb!.rpc('admin_list_admins');
  fail(error);
  return data ?? [];
}
export async function addAdmin(email: string, role: AdminRole, name: string) {
  if (DEMO) {
    demo.admins = [...demo.admins, { user_id: crypto.randomUUID(), display_name: name, email, role, created_at: new Date().toISOString() }];
    demoLog('admin_added', email, { role });
    return;
  }
  const { error } = await sb!.rpc('admin_add', { p_email: email, p_role: role, p_name: name });
  fail(error);
}
export async function removeAdmin(userId: string) {
  if (DEMO) {
    demo.admins = demo.admins.filter((a) => a.user_id !== userId);
    demoLog('admin_removed', userId, {});
    return;
  }
  const { error } = await sb!.rpc('admin_remove', { p_user: userId });
  fail(error);
}

export async function listActions(): Promise<ActionRow[]> {
  if (DEMO) return [...demo.log].reverse();
  const { data, error } = await sb!.from('admin_actions').select('*').order('at', { ascending: false }).limit(300);
  fail(error);
  return data ?? [];
}

// ---------------------------------------------------------------- content (recipes, activities...)

export type ContentRow = { type: string; item_key: string; data: any; status: 'published' | 'draft' | 'hidden'; tn_reviewed: boolean; sort_order: number | null; updated_at: string; updated_by: string | null };

export async function listContent(): Promise<ContentRow[]> {
  if (DEMO) return demo.content;
  const { data, error } = await sb!.from('content_items').select('*');
  fail(error);
  return data ?? [];
}
export async function saveContent(row: Pick<ContentRow, 'type' | 'item_key' | 'data' | 'status' | 'tn_reviewed' | 'sort_order'>) {
  if (DEMO) {
    const r = { ...row, updated_at: new Date().toISOString(), updated_by: DEMO_ME };
    demo.content = [...demo.content.filter((x) => !(x.type === row.type && x.item_key === row.item_key)), r];
    demoLog(`content_${row.status}`, `${row.type}:${row.item_key}`, { title: row.data?.en?.title ?? row.data?.en?.t ?? row.data?.name ?? row.item_key });
    return;
  }
  const { error } = await sb!.from('content_items').upsert(row, { onConflict: 'type,item_key' });
  fail(error);
}
/** Removes the dashboard edit: a built-in item goes back to its original, a new item disappears. */
export async function restoreContent(type: string, key: string) {
  if (DEMO) {
    demo.content = demo.content.filter((x) => !(x.type === type && x.item_key === key));
    demoLog('content_restored', `${type}:${key}`, {});
    return;
  }
  const { error } = await sb!.from('content_items').delete().eq('type', type).eq('item_key', key);
  fail(error);
}

// ---------------------------------------------------------------- sample data

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const DEMO_ME = '00000000-0000-0000-0000-00000000demo';
const demo = {
  pros: [
    { user_id: 'p1', display_name: 'Dr Kgosi Molefe', email: 'kgosi@clinic.bw', profession: 'Clinical psychologist', registration: 'BHPC 0412', organisation: 'Princess Marina Hospital', review_status: 'pending', review_note: null, reviewed_at: null, created_at: daysAgo(1), active_clients: 2 },
    { user_id: 'p2', display_name: 'Lorato Seretse', email: 'lorato@bosasnet.org', profession: 'Addiction counsellor', registration: '', organisation: 'BOSASNet', review_status: 'pending', review_note: null, reviewed_at: null, created_at: daysAgo(3), active_clients: 0 },
    { user_id: 'p3', display_name: 'Thabo Kgari', email: 'thabo@counsel.co.bw', profession: 'Counsellor', registration: 'BHPC 1188', organisation: 'Private practice', review_status: 'verified', review_note: 'Registration confirmed by phone.', reviewed_at: daysAgo(20), created_at: daysAgo(25), active_clients: 7 },
    { user_id: 'p4', display_name: 'Naledi Dube', email: 'naledi@mail.com', profession: 'Social worker', registration: '', organisation: 'Gaborone City Council', review_status: 'verified', review_note: null, reviewed_at: daysAgo(40), created_at: daysAgo(44), active_clients: 4 },
  ] as Professional[],
  numbers: [
    { id: 'ambulance', label: 'Ambulance (Emergency Medical Services)', label_tn: 'Ambulense (Ditirelo tsa Tshoganyetso)', number: '997', verified: true, sort_order: 1, active: true, checked_at: daysAgo(12) },
    { id: 'police', label: 'Police emergency', label_tn: 'Mapodise (tshoganyetso)', number: '999', verified: true, sort_order: 2, active: true, checked_at: daysAgo(12) },
    { id: 'fire', label: 'Fire', label_tn: 'Molelo', number: '998', verified: false, sort_order: 3, active: true, checked_at: null },
    { id: 'youth', label: 'BOFWA 24-hour youth helpline', label_tn: 'BOFWA: mogala wa thuso wa basha (diura di le 24)', number: '16658', verified: false, sort_order: 4, active: true, checked_at: daysAgo(130) },
    { id: 'gbv', label: 'Gender-based violence helpline', label_tn: 'Mogala wa thuso wa tirisodikgoka mo bongweng', number: '14655', verified: false, sort_order: 5, active: true, checked_at: null },
  ] as EmergencyNumber[],
  admins: [
    { user_id: DEMO_ME, display_name: 'Monica', email: 'you@example.com', role: 'admin', created_at: daysAgo(2) },
    { user_id: 'a2', display_name: 'Dr Clinical Lead', email: 'clinical@example.com', role: 'clinician', created_at: daysAgo(1) },
  ] as AdminRow[],
  content: [] as ContentRow[],
  log: [
    { id: 1, admin_id: DEMO_ME, action: 'admin_added', target: 'clinical@example.com', detail: { role: 'clinician' }, at: daysAgo(1) },
    { id: 2, admin_id: DEMO_ME, action: 'professional_verified', target: 'p3', detail: { note: 'Registration confirmed by phone.' }, at: daysAgo(1) },
  ] as ActionRow[],
};
function demoLog(action: string, target: string, detail: Record<string, unknown>) {
  demo.log.push({ id: demo.log.length + 1, admin_id: DEMO_ME, action, target, detail, at: new Date().toISOString() });
}

function demoImpact(): Impact {
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 - (11 - i) * 7);
    return d.toISOString().slice(0, 10);
  });
  return {
    generated_at: new Date().toISOString(),
    min_group: 10,
    members: 214,
    new_30d: 61,
    active_7d: 128,
    active_30d: 171,
    retention: [
      { days: 7, cohort: 188, pct: 81 },
      { days: 30, cohort: 140, pct: 64 },
      { days: 90, cohort: 52, pct: 48 },
    ],
    slips: { count: 37, back_within_7d_pct: 73, median_days_back: 1.5 },
    weekly: weeks.map((w, i) => ({
      week: w,
      active: i < 1 ? null : Math.round(40 + i * 8 + (i % 3) * 4),
      mood: i < 1 ? null : Math.round((1.9 + i * 0.08 + (i % 2) * 0.05) * 100) / 100,
      sleep: i < 1 ? null : Math.round((5.9 + i * 0.07) * 10) / 10,
      checkins: i < 1 ? null : Math.round(150 + i * 30),
    })),
    by_language: [
      { language: 'en', members: 131, retention30: 66 },
      { language: 'tn', members: 83, retention30: 61 },
    ],
    safety_30d: { logo_orange_opened: 64, logo_pink_opened: 22, logo_red_opened: 9, logo_all_clear: 27, emergency_opened: 6, companion_risk: 4, help_call_counsellor: 18 },
    care: { professional_links: 13, supporter_links: 58, pending_professionals: 2, verified_professionals: 2 },
  };
}
