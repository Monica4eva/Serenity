import type { State } from './store';
import { addDays, dayKey } from './dates';
import { wellbeingScore } from './engine';

const CRAVING_MAP: Record<string, number> = { none: 0, moderate: 1, strong: 2 };

export function moodForDay(s: State, k: string): number | undefined {
  const j = [...s.journal].reverse().find((x) => x.mood !== undefined && dayKey(new Date(x.at)) === k);
  if (j) return j.mood;
  const d = [...s.checkins].reverse().find((c) => c.type === 'daily' && c.answers.hello && dayKey(new Date(c.at)) === k);
  if (d) return ['stressed', 'anxious', 'okay', 'calm', 'great'].indexOf(d.answers.hello);
  const b = s.checkins.find((c) => c.type === 'baseline' && dayKey(new Date(c.at)) === k);
  return b?.answers.feeling;
}

export function cravingForDay(s: State, k: string): number | undefined {
  const c = [...s.checkins].reverse().find((x) => dayKey(new Date(x.at)) === k && (x.answers.cravings || x.answers.craving !== undefined || x.type === 'balance'));
  if (!c) return undefined;
  if (c.type === 'balance') return c.answers.answers?.[3];
  if (c.answers.cravings) return CRAVING_MAP[c.answers.cravings];
  return c.answers.craving;
}

export function dayScore(s: State, k: string) {
  return wellbeingScore({ moodIndex: moodForDay(s, k), day: s.dayLogs[k], craving: cravingForDay(s, k) });
}

export function lastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => addDays(new Date(), -(n - 1 - i)));
}

export function periodScore(s: State, n: number): number | null {
  const scores = lastNDays(n)
    .map((d) => dayScore(s, dayKey(d)).score)
    .filter((x): x is number => x !== null);
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

/** Four simple nutrition goals: ate at all, 3+ meals, 4+ glasses, 8 glasses. */
export function nutritionGoals(s: State, k: string) {
  const l = s.dayLogs[k];
  if (!l || (l.meals === undefined && l.water === undefined)) return null;
  const m = l.meals ?? 0;
  const w = l.water ?? 0;
  return (m >= 1 ? 1 : 0) + (m >= 3 ? 1 : 0) + (w >= 4 ? 1 : 0) + (w >= 8 ? 1 : 0);
}

