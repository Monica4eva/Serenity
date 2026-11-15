// Mapping between the app's local state and the Supabase tables.
// Pure functions (no React Native imports) so they can be unit-tested.
import type { State } from './store';

export type SyncRecord = {
  table: string;
  /** Unique key across all tables, used to remember what was last uploaded. */
  key: string;
  /** Row to upsert. For journal entries, ciphertext/nonce are added at upload time. */
  row: Record<string, unknown>;
  /** Journal only: the private text that gets encrypted on the phone before upload. */
  secret?: { text: string; prompt?: string };
  /** Columns used for upsert conflicts and deletes. */
  pk: string[];
};

/** Tables the person can add to but never change or delete (audit trail). */
export const APPEND_ONLY = new Set(['consents', 'safety_events', 'dismissals', 'relapses']);
/** Single-row tables that are never deleted from the phone. */
export const SINGLETON = new Set(['profiles', 'baselines']);
/** Tables the app downloads on login. safety_events is deliberately not here: users cannot read it. */
export const PULL_TABLES = [
  'profiles', 'baselines', 'consents', 'support_contacts', 'goals', 'dimension_ratings', 'triggers', 'checkins',
  'journal_entries', 'day_logs', 'appointments', 'activities_completed', 'relapses', 'dismissals',
];

const clean = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export function stateToRecords(s: State, userId: string): SyncRecord[] {
  const u = { user_id: userId };
  const out: SyncRecord[] = [];
  const add = (table: string, id: string, row: Record<string, unknown>, pk = ['user_id', 'id'], secret?: SyncRecord['secret']) =>
    out.push({ table, key: `${table}:${id}`, row: clean({ ...u, ...row }), pk, secret });

  // PIN hash stays on the phone only.
  const { pinHash, ...settings } = s.settings;
  void pinHash;
  add(
    'profiles',
    'me',
    {
      preferred_name: s.profile.preferredName,
      language: s.language,
      approach: s.approach,
      recovery_start: s.recoveryStart,
      six_month_vision: s.profile.sixMonthVision ?? null,
      intro_answers: s.profile.answers,
      support_needs: s.profile.supportNeeds,
      accessibility_settings: settings,
      focus_done: s.focus,
      terms_version_accepted: s.termsVersionAccepted ?? null,
      onboarded: s.onboarded,
      recovery_details: s.details ?? {},
      safety_plan: s.safetyPlan ?? {},
      support_agreement: s.agreement ?? null,
      steps_done: s.stepsDone ?? [],
    },
    ['user_id'],
  );
  const b = s.baseline;
  add(
    'baselines',
    'me',
    { feeling: b.feeling ?? null, halt: b.halt, craving: b.craving ?? null, sleep_hours: b.sleepHours ?? null, note: b.note ?? null, extended: b.extended },
    ['user_id'],
  );
  s.consents.forEach((c) =>
    add('consents', `${c.type}-${c.at}-${c.contactId ?? ''}`, {
      id: `${c.type}-${c.at}-${c.contactId ?? ''}`,
      type: c.type,
      version: c.version,
      granted: c.granted,
      contact_id: c.contactId ?? null,
      created_at: c.at,
    }),
  );
  s.contacts.forEach((c) =>
    add('support_contacts', c.id, {
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email ?? null,
      is_emergency: c.isEmergency,
      consent_level: c.consentLevel,
      last_reconfirmed: c.lastReconfirmed ?? null,
    }),
  );
  s.goals.forEach((g) => add('goals', g.id, { goal_id: g.id, progress: g.progress }, ['user_id', 'goal_id']));
  s.dimensions.forEach((d) =>
    add('dimension_ratings', `${d.dimension}-${d.at}`, { id: `${d.dimension}-${d.at}`, dimension: d.dimension, score: d.score, note: d.note ?? null, rated_at: d.at }),
  );
  s.triggers.forEach((t) => add('triggers', t.id, { id: t.id, category: t.category, label: t.label }));
  s.checkins.forEach((c) =>
    add('checkins', c.id, {
      id: c.id,
      type: c.type,
      answers: c.answers,
      level: c.level ?? null,
      reasons: c.reasons ?? [],
      score: c.score ?? null,
      created_at: c.at,
    }),
  );
  s.journal.forEach((j) =>
    add('journal_entries', j.id, { id: j.id, mood: j.mood ?? null, created_at: j.at }, ['user_id', 'id'], { text: j.text, prompt: j.prompt }),
  );
  Object.entries(s.dayLogs).forEach(([day, l]) =>
    add(
      'day_logs',
      day,
      { day, sleep_hours: l.sleepHours ?? null, meals: l.meals ?? null, water: l.water ?? null, activity_mins: l.activityMins ?? null, steps: l.steps ?? null, bedtime: l.bedtime ?? null, wake: l.wake ?? null },
      ['user_id', 'day'],
    ),
  );
  s.appointments.forEach((a) => add('appointments', a.id, { id: a.id, title: a.title, starts: a.when, status: a.status ?? null, marked_at: a.markedAt ?? null }));
  s.activitiesDone.forEach((a) => add('activities_completed', `${a.id}-${a.at}`, { id: `${a.id}-${a.at}`, activity: a.id, completed_at: a.at }));
  s.relapses.forEach((r) => add('relapses', r.at, { id: r.at, occurred_at: r.at, prior_days: r.priorDays }));
  s.dismissals.forEach((d) => add('dismissals', `${d.context}-${d.at}`, { id: `${d.context}-${d.at}`, context: d.context, created_at: d.at }));
  s.safetyEvents.forEach((e) => add('safety_events', `${e.kind}-${e.at}`, { id: `${e.kind}-${e.at}`, kind: e.kind, created_at: e.at }));
  return out;
}

type Rows = Record<string, any[]>;
type Opener = (ciphertext: string, nonce: string) => { text: string; prompt?: string } | null;

/** Builds local state pieces from downloaded rows. Journal entries that cannot be decrypted are counted, not shown. */
export function rowsToState(rows: Rows, openBox: Opener): { patch: Partial<State>; locked: number } {
  const r = (t: string) => rows[t] ?? [];
  const p = r('profiles')[0];
  const b = r('baselines')[0];
  let locked = 0;
  const journal = r('journal_entries').flatMap((j) => {
    const plain = openBox(j.ciphertext, j.nonce);
    if (!plain) {
      locked++;
      return [];
    }
    return [{ id: j.id, at: j.created_at, mood: j.mood ?? undefined, text: plain.text, prompt: plain.prompt }];
  });
  const patch: Partial<State> = {
    consents: r('consents').map((c) => ({ type: c.type, version: c.version, granted: c.granted, at: c.created_at, contactId: c.contact_id ?? undefined })),
    contacts: r('support_contacts').map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email ?? undefined,
      isEmergency: c.is_emergency,
      consentLevel: c.consent_level,
      lastReconfirmed: c.last_reconfirmed ?? undefined,
    })),
    goals: r('goals').map((g) => ({ id: g.goal_id, progress: g.progress })),
    dimensions: r('dimension_ratings').map((d) => ({ dimension: d.dimension, score: d.score, note: d.note ?? undefined, at: d.rated_at })),
    triggers: r('triggers').map((t) => ({ id: t.id, category: t.category, label: t.label })),
    checkins: r('checkins').map((c) => ({
      id: c.id,
      type: c.type,
      answers: c.answers,
      level: c.level ?? undefined,
      reasons: c.reasons,
      score: c.score ?? undefined,
      at: c.created_at,
    })),
    journal,
    dayLogs: Object.fromEntries(
      r('day_logs').map((d) => [
        d.day,
        { sleepHours: num(d.sleep_hours), meals: num(d.meals), water: num(d.water), activityMins: num(d.activity_mins), steps: num(d.steps), bedtime: d.bedtime ?? undefined, wake: d.wake ?? undefined },
      ]),
    ),
    appointments: r('appointments').map((a) => ({ id: a.id, title: a.title, when: a.starts, status: a.status ?? undefined, markedAt: a.marked_at ?? undefined })),
    activitiesDone: r('activities_completed').map((a) => ({ id: a.activity, at: a.completed_at })),
    relapses: r('relapses').map((x) => ({ at: x.occurred_at, priorDays: x.prior_days })),
    dismissals: r('dismissals').map((d) => ({ context: d.context, at: d.created_at })),
  };
  if (p) {
    patch.language = p.language;
    patch.approach = p.approach;
    patch.recoveryStart = p.recovery_start;
    patch.focus = p.focus_done ?? {};
    patch.termsVersionAccepted = p.terms_version_accepted ?? undefined;
    patch.onboarded = !!p.onboarded;
    patch.details = p.recovery_details ?? {};
    patch.safetyPlan = p.safety_plan ?? {};
    patch.agreement = p.support_agreement ?? undefined;
    patch.stepsDone = p.steps_done ?? [];
    patch.profile = {
      preferredName: p.preferred_name,
      answers: p.intro_answers ?? {},
      supportNeeds: p.support_needs ?? [],
      sixMonthVision: p.six_month_vision ?? undefined,
    };
    (patch as any).settingsFromServer = p.accessibility_settings;
  }
  if (b) {
    patch.baseline = {
      feeling: b.feeling ?? undefined,
      halt: b.halt ?? [],
      craving: b.craving ?? undefined,
      sleepHours: num(b.sleep_hours),
      note: b.note ?? undefined,
      extended: b.extended ?? {},
    };
  }
  return { patch, locked };
}

const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));

/** Merge downloaded data into what is already on the phone. Lists are joined by id; the phone's copy wins on clashes. */
export function mergeIntoState(local: State, patch: Partial<State>, locked: number): State {
  const byKey = <T,>(a: T[], b: T[] | undefined, k: (x: T) => string) => {
    if (!b) return a;
    const seen = new Set(a.map(k));
    return [...a, ...b.filter((x) => !seen.has(k(x)))].sort((x: any, y: any) => String(x.at ?? '').localeCompare(String(y.at ?? '')));
  };
  // A phone that has not been set up yet takes the server's profile, baseline and settings.
  const fresh = !local.onboarded && !local.profile.preferredName;
  const serverSettings = (patch as any).settingsFromServer;
  return {
    ...local,
    ...(fresh && patch.profile
      ? {
          profile: patch.profile,
          baseline: patch.baseline ?? local.baseline,
          language: patch.language ?? local.language,
          approach: patch.approach ?? local.approach,
          recoveryStart: patch.recoveryStart ?? local.recoveryStart,
          termsVersionAccepted: patch.termsVersionAccepted ?? local.termsVersionAccepted,
          details: patch.details ?? local.details,
          safetyPlan: patch.safetyPlan ?? local.safetyPlan,
          agreement: patch.agreement ?? local.agreement,
          stepsDone: patch.stepsDone ?? local.stepsDone,
          settings: serverSettings ? { ...local.settings, ...serverSettings, pinHash: local.settings.pinHash } : local.settings,
        }
      : {}),
    onboarded: local.onboarded || !!patch.onboarded,
    consents: byKey(local.consents, patch.consents, (c) => `${c.type}-${c.at}-${c.contactId ?? ''}`),
    contacts: byKey(local.contacts, patch.contacts, (c) => c.id),
    goals: local.goals.length ? local.goals : patch.goals ?? [],
    dimensions: byKey(local.dimensions, patch.dimensions, (d) => `${d.dimension}-${d.at}`),
    triggers: byKey(local.triggers, patch.triggers, (t) => t.id),
    checkins: byKey(local.checkins, patch.checkins, (c) => c.id),
    journal: byKey(local.journal, patch.journal, (j) => j.id),
    dayLogs: { ...(patch.dayLogs ?? {}), ...local.dayLogs },
    appointments: byKey(local.appointments, patch.appointments, (a) => a.id),
    activitiesDone: byKey(local.activitiesDone, patch.activitiesDone, (a) => `${a.id}-${a.at}`),
    relapses: byKey(local.relapses, patch.relapses, (r) => r.at),
    dismissals: byKey(local.dismissals, patch.dismissals, (d) => `${d.context}-${d.at}`),
    focus: { ...(patch.focus ?? {}), ...local.focus },
    journalLocked: locked,
  };
}
