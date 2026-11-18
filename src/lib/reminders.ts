// Adaptive reminders: when and how Serenity reminds someone, worked out from their own data.
//  * Time: learned from when they usually check in (median of the last 14 days), else 19:00.
//  * Tone: everyday, supportive when signs are building, gentle after days away, or a
//    comeback-plan nudge while the Comeback Coach is running.
//  * Frequency: daily, but every other day after 3 or more days away, so silence is not met
//    with nagging. Nothing at all inside the person's quiet hours, and off unless they turn it on.
// Pure logic (no React Native) so it can be tested. Phone scheduling is in reminderSchedule.ts.
import type { State } from './store';
import { dayKey, daysBetween } from './dates.ts';
import { lastActive } from './comeback.ts';

export type ReminderKind = 'daily' | 'support' | 'away' | 'comeback';
export type ReminderPlan = {
  on: boolean;
  hour: number;
  minute: number;
  kind: ReminderKind;
  everyOtherDay: boolean;
  learned: boolean;
  /** Why the plan was changed by how reminders were received: dismissed often, or often missed. */
  adjusted?: 'later' | 'fewer';
};

/** Days in the last week (not today) with no check-in, counted only after their first check-in. */
export function missedDays(s: State, now = new Date()): number {
  const first = s.checkins.map((c) => c.at).sort()[0];
  if (!first) return 0;
  let n = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (dayKey(d) < dayKey(new Date(first))) break;
    if (!s.checkins.some((c) => dayKey(new Date(c.at)) === dayKey(d))) n++;
  }
  return n;
}

/** In-app reminders dismissed in the last 7 days. */
export const recentDismissals = (s: State, now = new Date()) => (s.reminderDismissals ?? []).filter((k) => daysBetween(k, now) <= 7).length;

export function usualHour(s: State, now = new Date()): { hour: number; minute: number; learned: boolean } {
  const recent = s.checkins.filter((c) => daysBetween(c.at, now) <= 14).map((c) => new Date(c.at));
  if (recent.length < 3) return { hour: 19, minute: 0, learned: false };
  const mins = recent.map((d) => d.getHours() * 60 + d.getMinutes()).sort((a, b) => a - b);
  const mid = mins[Math.floor(mins.length / 2)];
  // Remind about 15 minutes before their usual time, on a quarter hour.
  const t = Math.max(6 * 60, mid - 15);
  return { hour: Math.floor(t / 60), minute: Math.floor((t % 60) / 15) * 15, learned: true };
}

/** True when the hour falls in the quiet window (which may wrap past midnight). */
export function inQuiet(hour: number, from: number, to: number) {
  if (from === to) return false;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

export function reminderPlan(s: State, logo: string, now = new Date()): ReminderPlan {
  const set = s.settings;
  const base = usualHour(s, now);
  let { hour, minute } = base;
  let adjusted: ReminderPlan['adjusted'];
  // Dismissed twice or more this week: the time is not working, so try an hour later.
  if (recentDismissals(s, now) >= 2) {
    hour = Math.min(23, hour + 1);
    adjusted = 'later';
  }
  const qFrom = set.quietFrom ?? 22;
  const qTo = set.quietTo ?? 7;
  if (inQuiet(hour, qFrom, qTo)) {
    // Move just before quiet hours start.
    hour = (qFrom + 23) % 24;
    minute = 0;
  }
  const last = lastActive(s);
  const away = last ? daysBetween(last, now) >= 3 : false;
  // Most reminders this week went unanswered: fewer reminders, not more.
  const ignored = !away && missedDays(s, now) >= 4;
  if (ignored) adjusted = 'fewer';
  const kind: ReminderKind = s.comeback && !s.comeback.finishedAt ? 'comeback' : away ? 'away' : logo !== 'normal' ? 'support' : 'daily';
  return { on: !!set.reminders, hour, minute, kind, everyOtherDay: away || ignored, learned: base.learned, adjusted };
}

/** In-app reminder on Today: shown after the reminder time if they have not checked in today. */
export function inAppReminderDue(s: State, logo: string, now = new Date()): ReminderKind | null {
  const p = reminderPlan(s, logo, now);
  if (!p.on) return null;
  const today = dayKey(now);
  if (s.checkins.some((c) => dayKey(new Date(c.at)) === today)) return null;
  if (s.reminderDismissed === today) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= p.hour * 60 + p.minute ? p.kind : null;
}
