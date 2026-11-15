import { scanCraving, scanText, type Signal } from './engine';
import { dayScore } from './metrics';
import type { State } from './store';
import { addDays, dayKey, daysBetween } from './dates';
import type { Level } from './engine';

/** Transparent, simple goal progress rules (shown to the user as percentages). */
export function goalProgress(s: State, id: string): number {
  const days = daysBetween(s.recoveryStart);
  const last14 = Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), -i)));
  const checkDays = new Set(s.checkins.map((c) => dayKey(new Date(c.at))));
  const consistency = last14.filter((d) => checkDays.has(d)).length / 14;
  const dim = (name: string) => {
    const r = [...s.dimensions].reverse().find((d) => d.dimension === name);
    return r ? r.score / 5 : 0;
  };
  const recentActs = s.activitiesDone.filter((a) => daysBetween(a.at) <= 30).length;
  let v = 0;
  switch (id) {
    case 'substanceFree':
      v = days / 90;
      break;
    case 'relationships':
      v = Math.min(s.contacts.length, 3) / 6 + dim('social') / 2;
      break;
    case 'wellbeing':
      v = consistency * 0.6 + dim('physical') * 0.2 + dim('emotional') * 0.2;
      break;
    case 'lifeSkills':
      v = recentActs / 20;
      break;
    case 'community': {
      const att = s.appointments.filter((a) => a.status === 'attended').length;
      v = att / 8;
      break;
    }
    case 'opportunities':
      v = dim('occupational') * 0.6 + dim('financial') * 0.4;
      break;
  }
  return Math.round(Math.max(0, Math.min(1, v)) * 100);
}

export function todaysLevel(s: State): Level | undefined {
  const today = dayKey();
  const c = [...s.checkins].reverse().find((x) => x.level && dayKey(new Date(x.at)) === today);
  return c?.level;
}

export function lastCheckinAt(s: State) {
  const c = s.checkins.filter((x) => x.type !== 'baseline');
  return c.length ? c[c.length - 1].at : undefined;
}

// ---------- Today's Focus, per day (shared by the Today screen and the logo alert) ----------
export type FocusItem = { id: string; route: string; done: boolean };

export function focusForDay(s: State, k: string): FocusItem[] {
  const on = (iso: string) => dayKey(new Date(iso)) === k;
  const doneType = (type: string) => s.checkins.some((c) => c.type === type && on(c.at));
  const manual = s.focus[k] ?? [];
  const part = (p: string) => s.checkins.some((c) => c.type === 'rhythm' && c.answers?.part === p && on(c.at));
  const reading =
    s.approach === 'pillars'
      ? { id: 'pillar', route: '/program', done: manual.includes('pillar') }
      : s.approach === '12step' || s.approach === 'both' || !s.approach
        ? { id: 'reading', route: '/steps', done: manual.includes('reading') || s.journal.some((j) => on(j.at) && !!j.prompt?.startsWith('step')) }
        : { id: 'reflection', route: '/journal', done: manual.includes('reflection') };
  // The designer's eight daily items.
  return [
    { id: 'halt', route: '/halt', done: doneType('halt') || doneType('daily') || doneType('balance') },
    reading,
    { id: 'activity', route: '/activities', done: s.activitiesDone.some((a) => on(a.at)) },
    { id: 'journal', route: '/journal', done: s.journal.some((j) => on(j.at) && !!j.text) },
    { id: 'morning', route: '/rhythm?part=morning', done: part('morning') },
    { id: 'afternoon', route: '/rhythm?part=afternoon', done: part('afternoon') },
    { id: 'evening', route: '/rhythm?part=evening', done: part('evening') },
    { id: 'meetings', route: '/meetings', done: doneType('meeting') },
  ];
}

/**
 * Consecutive past days (ending yesterday) with fewer than `minTasks` focus tasks done.
 * Today is not counted because the day is still in progress. Days before the person
 * joined are never counted.
 */
export function missedTaskDays(s: State, minTasks: number, now = new Date(), since?: string): number {
  const joined = s.account?.createdAt ?? s.recoveryStart;
  // Days before joining, or before "I'm alright now", are never counted.
  const from = since && new Date(since) > new Date(joined) ? since : joined;
  const joinedKey = dayKey(new Date(from));
  let n = 0;
  for (let i = 1; i <= 60; i++) {
    const k = dayKey(addDays(now, -i));
    if (k < joinedKey) break;
    const done = focusForDay(s, k).filter((f) => f.done).length;
    if (done >= minTasks) break;
    n++;
  }
  return n;
}

// ---------- Signs for the escalation button (read from the person's own data) ----------

export function collectSignals(s: State, now = new Date()): Signal[] {
  const out: Signal[] = [];
  const recent = (iso: string) => now.getTime() - new Date(iso).getTime() <= 72 * 3600000;

  for (const c of s.checkins) {
    if (!recent(c.at)) continue;
    const a = c.answers ?? {};
    const strong =
      a.cravings === 'strong' || a.craving === 2 || a.cravingHelp === true || (c.type === 'balance' && Array.isArray(a.answers) && a.answers[3] === 2);
    if (strong) out.push({ kind: 'strongCraving', at: c.at });
    if (c.type === 'halt') {
      const heavy = ['hunger', 'anger', 'loneliness', 'tiredness'].filter((k) => (a[k] ?? 0) > 0).length >= 3;
      if (heavy) out.push({ kind: 'heavyHalt', at: c.at });
    }
    const words = [a.intention, a.m1, a.m2, a.a1, a.a2, a.e1, a.e2, a.e3, a.note, a.feeling].filter(Boolean).join(' ');
    pushWords(s, out, words, c.at);
  }
  const lowMoods = s.journal.filter((j) => recent(j.at) && j.mood !== undefined && j.mood <= 1);
  if (lowMoods.length >= 2) out.push({ kind: 'lowMoodRepeated', at: lowMoods[lowMoods.length - 1].at });
  for (const j of s.journal) if (recent(j.at)) pushWords(s, out, j.text, j.at);

  for (const ap of s.appointments) if (ap.status === 'missed' && ap.markedAt && recent(ap.markedAt)) out.push({ kind: 'missedAppointment', at: ap.markedAt });
  for (const e of s.safetyEvents) {
    const within24 = now.getTime() - new Date(e.at).getTime() <= 24 * 3600000;
    if (e.kind === 'emergency_opened' && within24) out.push({ kind: 'emergencyOpened', at: e.at });
    // A risk answer in the Serenity Guide chat counts like worrying words.
    if (e.kind === 'companion_risk' && within24) out.push({ kind: 'worryingWords', at: e.at });
    if (e.kind === 'companion_lowmood' && recent(e.at)) out.push({ kind: 'lowMoodWords', at: e.at });
    if (e.kind === 'companion_craving' && recent(e.at)) out.push({ kind: 'strongCraving', at: e.at });
  }

  // Body: today and yesterday.
  for (let i = 0; i < 2; i++) {
    const d = addDays(now, -i);
    const k = dayKey(d);
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString();
    const sleep = s.dayLogs[k]?.sleepHours;
    const usual = s.baseline.sleepHours;
    if (sleep !== undefined && (sleep < 5 || (usual !== undefined && usual - sleep >= 2))) out.push({ kind: 'shortSleep', at });
    const score = dayScore(s, k).score;
    if (score !== null && score < 40) out.push({ kind: 'lowWellbeing', at });
  }
  return out;
}

function pushWords(s: State, out: Signal[], text: string | undefined, at: string) {
  const sig = scanText(text ?? '');
  if (sig !== 'crisis' && scanCraving(text ?? '')) out.push({ kind: 'strongCraving', at });
  if (sig === 'lowMood') out.push({ kind: 'lowMoodWords', at });
  if (sig === 'crisis') {
    // Counts unless the person answered "No" to the safety question afterwards.
    const dismissed = s.dismissals.some((d) => d.context.endsWith(':crisis') && d.at >= at);
    if (!dismissed) out.push({ kind: 'worryingWords', at });
  }
}
