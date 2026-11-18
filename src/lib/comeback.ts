// Comeback Coach: support to get going again after a slip or after some days away.
// No blame and no reset: it asks what got in the way, builds a tiny 3-day restart plan from the
// answer, and checks in each day. Pure logic (no React Native) so it can be tested.
import type { State } from './store';
import { addDays, dayKey, daysBetween } from './dates.ts';
import { planStalled } from './habits.ts';

export const BARRIERS = ['stress', 'cravings', 'sleep', 'people', 'low', 'busy', 'forgot', 'other'] as const;
export type Barrier = (typeof BARRIERS)[number];

/** Small actions the plan can use. Each opens a screen that helps, or is ticked by hand. */
export const ACTIONS: Record<string, { route?: string; icon: string }> = {
  checkin: { route: '/daily', icon: 'leaf-outline' },
  breathe: { route: '/activity/box', icon: 'cloud-outline' },
  urge: { route: '/urge', icon: 'water-outline' },
  call: { route: '/(tabs)/support', icon: 'call-outline' },
  walk: { route: '/activity/walk', icon: 'walk-outline' },
  meeting: { route: '/meetings', icon: 'people-outline' },
  journal: { route: '/journal', icon: 'create-outline' },
  sleep: { route: '/sleep', icon: 'moon-outline' },
  triggers: { route: '/triggers', icon: 'git-branch-outline' },
  safety: { route: '/safety-plan', icon: 'shield-checkmark-outline' },
  reminders: { route: '/settings?section=app', icon: 'notifications-outline' },
  plan: { route: '/plan', icon: 'list-outline' },
};

const FOR_BARRIER: Record<Barrier, string[]> = {
  stress: ['breathe', 'walk', 'journal'],
  cravings: ['urge', 'call', 'triggers'],
  sleep: ['sleep', 'breathe', 'checkin'],
  people: ['triggers', 'call', 'meeting'],
  low: ['call', 'journal', 'walk'],
  busy: ['plan', 'checkin', 'breathe'],
  forgot: ['reminders', 'checkin', 'plan'],
  other: ['call', 'journal', 'meeting'],
};

/** slip: a relapse. away: 3+ days with no activity. hard: a difficult day (logo orange or pink).
 *  missed: none of their plan habits done for 3 days. */
export type ComebackReason = 'slip' | 'away' | 'hard' | 'missed';
export const REASONS = ['slip', 'away', 'hard', 'missed'] as const;

export type ComebackPlanDay = { day: 1 | 2 | 3; action: string };
export type Comeback = {
  startedAt: string;
  reason: ComebackReason;
  barriers: string[];
  plan: ComebackPlanDay[];
  done: number[]; // days completed
  finishedAt?: string;
  helped?: string;
};

/** Day 1 is always the smallest step (a check-in); days 2 and 3 answer what got in the way. */
export function buildPlan(barriers: string[]): ComebackPlanDay[] {
  const picks: string[] = ['checkin'];
  // Take turns between the chosen barriers, so each one gets a step of its own.
  const lists = (barriers.length ? barriers : ['other']).map((b) => FOR_BARRIER[b as Barrier] ?? FOR_BARRIER.other);
  const pool: string[] = [];
  for (let i = 0; i < 3; i++) for (const l of lists) if (l[i]) pool.push(l[i]);
  for (const a of pool) {
    if (picks.length >= 3) break;
    if (!picks.includes(a)) picks.push(a);
  }
  for (const a of ['call', 'journal', 'breathe']) if (picks.length < 3 && !picks.includes(a)) picks.push(a);
  return picks.slice(0, 3).map((action, i) => ({ day: (i + 1) as 1 | 2 | 3, action }));
}

/** When the person last did anything in the app (check-in, journal, activity). */
export function lastActive(s: State): string | undefined {
  const all = [...s.checkins.map((c) => c.at), ...s.journal.map((j) => j.at), ...s.activitiesDone.map((a) => a.at)];
  return all.sort().at(-1);
}

export const AWAY_DAYS = 3;

/** Should the coach be offered, and why? Nothing while a plan runs. A slip or time away is
 *  offered again after "not now" once 3 days pass; a hard day or missed plan once a week at most. */
export function comebackNeeded(s: State, now = new Date(), logo = 'normal'): ComebackReason | null {
  const cb = s.comeback;
  if (cb && !cb.finishedAt) return null;
  const dismissed = s.comebackDismissedAt;
  const since = (iso?: string) => (iso ? daysBetween(iso, now) : Infinity);
  // A slip is either a counter reset or a check-in marked as a slip (when they kept their count).
  const lastSlip = [...s.relapses.map((r) => r.at), ...s.checkins.filter((c) => c.answers?.relapse).map((c) => c.at)].sort().at(-1);
  const after = (iso: string) => (!cb || iso > cb.startedAt) && (!dismissed || iso > dismissed);
  if (lastSlip && since(lastSlip) <= 3 && after(lastSlip)) return 'slip';
  if (!s.onboarded) return null;
  const lastCoach = cb ? since(cb.finishedAt ?? cb.startedAt) : Infinity;
  const last = lastActive(s);
  if (last && since(last) >= AWAY_DAYS && since(dismissed) >= AWAY_DAYS && lastCoach >= AWAY_DAYS) return 'away';
  // Gentler offers: at most once a week, and not if they said "not now" this week.
  if (since(dismissed) < 7 || lastCoach < 7) return null;
  if (logo === 'orange' || logo === 'pink') return 'hard';
  if (planStalled(s, now)) return 'missed';
  return null;
}

/** Which day of the 3-day plan it is (1 to 3), or 4 when the plan time has passed. */
export function comebackDay(cb: Comeback, now = new Date()): number {
  return Math.min(4, Math.max(1, daysBetween(cb.startedAt, now) + 1));
}

export function startComeback(s: State, reason: ComebackReason, barriers: string[], now = new Date()): State {
  return { ...s, comeback: { startedAt: now.toISOString(), reason, barriers, plan: buildPlan(barriers), done: [] } };
}

export function markDayDone(s: State, day: number): State {
  if (!s.comeback || s.comeback.done.includes(day)) return s;
  return { ...s, comeback: { ...s.comeback, done: [...s.comeback.done, day].sort() } };
}

export function finishComeback(s: State, helped?: string, now = new Date()): State {
  if (!s.comeback) return s;
  return { ...s, comeback: { ...s.comeback, finishedAt: now.toISOString(), helped } };
}

/** The date each plan day falls on, for display. */
export const planDate = (cb: Comeback, day: number) => dayKey(addDays(new Date(cb.startedAt), day - 1));
