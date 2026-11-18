// Personalised habit plan ("My plan"): the person picks a few habits and how many days a week,
// progress is counted automatically from what they already log, and each week the plan adapts:
// a gentle step up after a good week, a smaller target after a hard one. Never a penalty.
// Pure logic (no React Native) so it can be tested.
import type { State } from './store';
import { addDays, dayKey, startOfWeek } from './dates.ts';

export const HABITS = ['checkin', 'connect', 'sleep', 'meals', 'water', 'move', 'activity', 'journal', 'meeting'] as const;
export type HabitId = (typeof HABITS)[number];
export type PlanItem = { id: HabitId; target: number }; // target = days per week (1 to 7)
/** gentle: smaller daily amounts (for low energy, health limits or disability). */
export type HabitPlan = { items: PlanItem[]; createdAt: string; reviewedWeek?: string; gentle?: boolean };

/** Daily amounts that count as done. The gentle set is for whatever the person can manage now. */
export const AMOUNTS = {
  normal: { sleep: 7, meals: 3, water: 6, move: 15 },
  gentle: { sleep: 6, meals: 2, water: 4, move: 5 },
};
export const amounts = (s: State) => (s.habits?.gentle ? AMOUNTS.gentle : AMOUNTS.normal);

/** The first person in their support system, for "Connect with {{name}}". */
export function supportPerson(s: State): string | undefined {
  const c = s.contacts.find((x) => !x.isEmergency) ?? s.contacts[0];
  return c?.name?.replace(/\s*\(.*\)\s*$/, '');
}

export const HABIT_ICON: Record<HabitId, string> = {
  checkin: 'leaf-outline',
  connect: 'chatbubbles-outline',
  sleep: 'moon-outline',
  meals: 'restaurant-outline',
  water: 'water-outline',
  move: 'walk-outline',
  activity: 'sparkles-outline',
  journal: 'create-outline',
  meeting: 'people-outline',
};
export const HABIT_ROUTE: Record<HabitId, string> = {
  checkin: '/daily',
  connect: '/(tabs)/support',
  sleep: '/log',
  meals: '/log',
  water: '/log',
  move: '/log',
  activity: '/activities',
  journal: '/journal',
  meeting: '/meetings',
};
export const MAX_HABITS = 4;

/** Did the person do this habit on this day? Read from data they already log. */
export function doneOn(s: State, id: HabitId, key: string): boolean {
  const onDay = (iso: string) => dayKey(new Date(iso)) === key;
  const log = s.dayLogs[key];
  const a = amounts(s);
  switch (id) {
    case 'checkin':
      return s.checkins.some((c) => onDay(c.at) && c.type !== 'meeting');
    case 'connect':
      // A message to their care team, or the guided "Reach out" activity.
      return s.care.messages.some((m) => m.mine && onDay(m.at)) || s.activitiesDone.some((x) => x.id === 'call' && onDay(x.at));
    case 'sleep':
      return (log?.sleepHours ?? 0) >= a.sleep;
    case 'meals':
      return (log?.meals ?? 0) >= a.meals;
    case 'water':
      return (log?.water ?? 0) >= a.water;
    case 'move':
      return (log?.activityMins ?? 0) >= a.move;
    case 'activity':
      return s.activitiesDone.some((a) => onDay(a.at));
    case 'journal':
      return s.journal.some((j) => onDay(j.at));
    case 'meeting':
      return s.checkins.some((c) => onDay(c.at) && c.type === 'meeting');
  }
}

/** Days done in the week that starts on `weekStart` (Monday), up to and including `upTo`. */
export function weekCount(s: State, id: HabitId, weekStart: Date, upTo?: Date): number {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    if (upTo && d > upTo) break;
    if (doneOn(s, id, dayKey(d))) n++;
  }
  return n;
}

/** A starting plan built from the person's goals, so they never face an empty page. */
export function suggestedPlan(s: State): PlanItem[] {
  const goals = s.goals.map((g) => g.id);
  const items: PlanItem[] = [{ id: 'checkin', target: 5 }];
  // Built around their support system: someone to connect with, if they have added anyone.
  if (s.contacts.length || s.care.links.some((l) => l.status === 'active')) items.push({ id: 'connect', target: 2 });
  if (goals.includes('wellbeing') || !goals.length) items.push({ id: 'sleep', target: 4 }, { id: 'move', target: 3 });
  if (goals.includes('substanceFree') || goals.includes('community')) items.push({ id: 'meeting', target: 2 });
  if (goals.includes('relationships')) items.push({ id: 'journal', target: 3 });
  return items.filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i).slice(0, MAX_HABITS);
}

/** Start gentle when they asked for simpler prompts or read-aloud questions in Settings. */
export const suggestGentle = (s: State) => !!(s.settings.simplePrompts || s.settings.voiceFirst);

/** Habits not done at all in the last `days` days (today excluded), for the Comeback Coach. */
export function planStalled(s: State, now = new Date(), days = 3): boolean {
  const plan = s.habits;
  if (!plan?.items.length) return false;
  if ((now.getTime() - new Date(plan.createdAt).getTime()) / 86400000 < days + 1) return false;
  for (let i = 1; i <= days; i++) {
    const k = dayKey(addDays(now, -i));
    if (plan.items.some((it) => doneOn(s, it.id, k))) return false;
  }
  return true;
}

export type Adjust = { id: HabitId; from: number; to: number; done: number; kind: 'up' | 'down' };

/**
 * Weekly review of last week. A good week (target met) suggests one more day; a hard week
 * (under half) suggests a smaller, reachable target. Only suggestions: the person decides.
 */
export function weeklyAdjustments(s: State, now = new Date()): Adjust[] {
  const plan = s.habits;
  if (!plan?.items.length) return [];
  const thisWeek = startOfWeek(now);
  const thisKey = dayKey(thisWeek);
  if (plan.reviewedWeek === thisKey) return [];
  const lastWeek = addDays(thisWeek, -7);
  if (new Date(plan.createdAt) > addDays(lastWeek, 3)) return []; // need most of a week of data first
  const out: Adjust[] = [];
  for (const it of plan.items) {
    const done = weekCount(s, it.id, lastWeek);
    if (done >= it.target && it.target < 7) out.push({ id: it.id, from: it.target, to: it.target + 1, done, kind: 'up' });
    else if (done < Math.ceil(it.target / 2) && it.target > 1) out.push({ id: it.id, from: it.target, to: Math.max(1, it.target - 1), done, kind: 'down' });
  }
  return out;
}

export function applyAdjustments(s: State, adj: Adjust[], accept: boolean, now = new Date()): State {
  if (!s.habits) return s;
  const items = accept ? s.habits.items.map((it) => ({ ...it, target: adj.find((a) => a.id === it.id)?.to ?? it.target })) : s.habits.items;
  return { ...s, habits: { ...s.habits, items, reviewedWeek: dayKey(startOfWeek(now)) } };
}
