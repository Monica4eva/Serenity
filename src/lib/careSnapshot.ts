// Works out the numbers a care summary needs from the phone's own data.
import type { State } from './store';
import { addDays, dayKey, daysBetween } from './dates';
import { cravingForDay, dayScore, moodForDay } from './metrics';
import { goalProgress } from './progress';
import type { LogoColour, Snapshot } from './summary';

export function buildSnapshot(s: State, logo: { state: LogoColour; reasons: string[] }, now = new Date()): Snapshot {
  const days = Array.from({ length: 14 }, (_, i) => dayKey(addDays(now, -(13 - i))));
  const checkDays = new Set(s.checkins.map((c) => dayKey(new Date(c.at))));
  const upcoming = s.appointments
    .filter((a) => !a.status && new Date(a.when.replace(' ', 'T')).getTime() > now.getTime())
    .sort((a, b) => a.when.localeCompare(b.when))[0];
  const lastCheckin = s.checkins.length ? [...s.checkins].sort((a, b) => b.at.localeCompare(a.at))[0].at : undefined;
  return {
    name: s.profile.preferredName || s.account?.fullName?.split(' ')[0] || '',
    days: daysBetween(s.recoveryStart, now) + 1,
    logo: logo.state,
    reasons: logo.reasons,
    trends: days.map((k) => ({
      day: k,
      mood: moodForDay(s, k),
      craving: cravingForDay(s, k),
      sleep: s.dayLogs[k]?.sleepHours,
      score: dayScore(s, k).score,
      checkedIn: checkDays.has(k),
    })),
    goals: s.goals.map((g) => ({ id: g.id, progress: goalProgress(s, g.id) })),
    relapses: s.relapses,
    lastCheckinAt: lastCheckin,
    nextAppointment: upcoming?.when,
    now: now.toISOString(),
  };
}
