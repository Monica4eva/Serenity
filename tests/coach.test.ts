// Comeback Coach, personalised habit plan and adaptive reminders. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, comebackDay, comebackNeeded, finishComeback, markDayDone, startComeback } from '../src/lib/comeback.ts';
import { applyAdjustments, doneOn, planStalled, suggestedPlan, supportPerson, weekCount, weeklyAdjustments } from '../src/lib/habits.ts';
import { inAppReminderDue, inQuiet, missedDays, reminderPlan, usualHour } from '../src/lib/reminders.ts';
import { addDays, dayKey, startOfWeek } from '../src/lib/dates.ts';
import en from '../src/locales/en.ts';
import tn from '../src/locales/tn.ts';

const NOW = new Date(2026, 10, 18, 20, 0); // Wed 18 Nov 2026, 20:00
const ago = (days: number, h = 19, m = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const base = (extra: any = {}): any => ({
  onboarded: true,
  recoveryStart: ago(30),
  goals: [{ id: 'substanceFree', progress: 0 }],
  relapses: [],
  checkins: [],
  journal: [],
  activitiesDone: [],
  dayLogs: {},
  contacts: [],
  care: { messages: [], links: [] },
  settings: { reminders: true, discreet: false },
  ...extra,
});
const ci = (daysAgo: number, h = 19, m = 0, answers: any = {}) => ({ id: `c${daysAgo}${h}${m}`, type: 'daily', answers, at: ago(daysAgo, h, m) });

// ---------------- Comeback Coach ----------------
test('comeback: offered after 3 days away, not after 2', () => {
  assert.equal(comebackNeeded(base({ checkins: [ci(2)] }), NOW), null);
  assert.equal(comebackNeeded(base({ checkins: [ci(3)] }), NOW), 'away');
});

test('comeback: offered after a recent slip, either reset or kept count', () => {
  assert.equal(comebackNeeded(base({ checkins: [ci(0)], relapses: [{ at: ago(1), priorDays: 20 }] }), NOW), 'slip');
  assert.equal(comebackNeeded(base({ checkins: [ci(1, 19, 0, { relapse: true })] }), NOW), 'slip');
  assert.equal(comebackNeeded(base({ checkins: [ci(0)], relapses: [{ at: ago(6), priorDays: 20 }] }), NOW), null);
});

test('comeback: not offered while a plan is running, or right after "not now"', () => {
  const running = startComeback(base({ checkins: [ci(5)] }), 'away', [], new Date(ago(1)));
  assert.equal(comebackNeeded(running, NOW), null);
  assert.equal(comebackNeeded(base({ checkins: [ci(4)], comebackDismissedAt: ago(1) }), NOW), null);
});

test('comeback: plan starts with a check-in and answers the barriers', () => {
  const p = buildPlan(['cravings']);
  assert.equal(p.length, 3);
  assert.equal(p[0].action, 'checkin');
  assert.deepEqual(p.map((x) => x.action), ['checkin', 'urge', 'call']);
  assert.deepEqual(buildPlan(['cravings', 'sleep']).map((x) => x.action), ['checkin', 'urge', 'sleep']);
  assert.equal(buildPlan([]).length, 3); // no answer still gives a full plan
  assert.equal(new Set(buildPlan(['busy', 'forgot']).map((x) => x.action)).size, 3); // no repeats
});

test('comeback: days, ticks and finishing never touch the recovery count', () => {
  const s0 = base();
  let s = startComeback(s0, 'slip', ['stress'], new Date(ago(1, 9)));
  assert.equal(comebackDay(s.comeback, NOW), 2);
  s = markDayDone(markDayDone(s, 1), 1);
  assert.deepEqual(s.comeback.done, [1]);
  s = finishComeback(s, 'evening walk', NOW);
  assert.equal(s.comeback.helped, 'evening walk');
  assert.equal(s.recoveryStart, s0.recoveryStart);
});

// ---------------- Habit plan ----------------
test('habits: counted from data already logged', () => {
  const k = dayKey(NOW);
  const s = base({ dayLogs: { [k]: { sleepHours: 7.5, meals: 2, water: 6, activityMins: 20 } }, checkins: [ci(0)], journal: [{ id: 'j', at: ago(0), text: 'hi' }] });
  assert.equal(doneOn(s, 'sleep', k), true);
  assert.equal(doneOn(s, 'meals', k), false);
  assert.equal(doneOn(s, 'water', k), true);
  assert.equal(doneOn(s, 'move', k), true);
  assert.equal(doneOn(s, 'checkin', k), true);
  assert.equal(doneOn(s, 'journal', k), true);
  assert.equal(doneOn(s, 'meeting', k), false);
});

test('habits: a suggested plan is never empty and never over 4', () => {
  const p = suggestedPlan(base({ goals: [] }));
  assert.ok(p.length >= 1 && p.length <= 4);
  assert.equal(p[0].id, 'checkin');
});

test('habits: weekly review steps up after a good week and eases after a hard one', () => {
  const lastWeek = addDays(startOfWeek(NOW), -7);
  const checkins = [0, 1, 2, 3, 4].map((i) => ({ id: `w${i}`, type: 'daily', answers: {}, at: addDays(lastWeek, i).toISOString() }));
  const s = base({ checkins, habits: { createdAt: addDays(lastWeek, -3).toISOString(), items: [{ id: 'checkin', target: 4 }, { id: 'journal', target: 4 }] } });
  assert.equal(weekCount(s, 'checkin', lastWeek), 5);
  const adj = weeklyAdjustments(s, NOW);
  assert.deepEqual(adj.map((a) => [a.id, a.kind, a.to]), [['checkin', 'up', 5], ['journal', 'down', 3]]);
  const yes = applyAdjustments(s, adj, true, NOW);
  assert.deepEqual(yes.habits.items.map((i: any) => i.target), [5, 3]);
  assert.equal(weeklyAdjustments(yes, NOW).length, 0); // asked once a week only
  const no = applyAdjustments(s, adj, false, NOW);
  assert.deepEqual(no.habits.items.map((i: any) => i.target), [4, 4]);
});

test('habits: no review before there is most of a week of data', () => {
  const s = base({ habits: { createdAt: ago(1), items: [{ id: 'checkin', target: 4 }] } });
  assert.equal(weeklyAdjustments(s, NOW).length, 0);
});

// ---------------- Adaptive reminders ----------------
test('reminders: learn the usual time, else 19:00', () => {
  assert.deepEqual(usualHour(base(), NOW), { hour: 19, minute: 0, learned: false });
  const s = base({ checkins: [ci(1, 8, 30), ci(2, 8, 40), ci(3, 8, 35), ci(4, 9, 0)] });
  assert.deepEqual(usualHour(s, NOW), { hour: 8, minute: 15, learned: true });
});

test('reminders: quiet hours are respected, including across midnight', () => {
  assert.equal(inQuiet(23, 22, 7), true);
  assert.equal(inQuiet(6, 22, 7), true);
  assert.equal(inQuiet(19, 22, 7), false);
  const late = base({ checkins: [ci(1, 23, 30), ci(2, 23, 30), ci(3, 23, 45)] });
  const p = reminderPlan(late, 'normal', NOW);
  assert.equal(p.hour, 21);
});

test('reminders: tone and frequency adapt', () => {
  assert.equal(reminderPlan(base({ checkins: [ci(0)] }), 'normal', NOW).kind, 'daily');
  assert.equal(reminderPlan(base({ checkins: [ci(0)] }), 'orange', NOW).kind, 'support');
  const away = reminderPlan(base({ checkins: [ci(5)] }), 'normal', NOW);
  assert.equal(away.kind, 'away');
  assert.equal(away.everyOtherDay, true);
  const cb = startComeback(base({ checkins: [ci(0)] }), 'slip', [], NOW);
  assert.equal(reminderPlan(cb, 'normal', NOW).kind, 'comeback');
});

test('reminders: in-app reminder only when on, due, not done and not dismissed', () => {
  const s = base({ checkins: [ci(1)] });
  assert.equal(inAppReminderDue(s, 'normal', NOW), 'daily');
  assert.equal(inAppReminderDue({ ...s, settings: { reminders: false } }, 'normal', NOW), null);
  assert.equal(inAppReminderDue(base({ checkins: [ci(1), ci(0, 9)] }), 'normal', NOW), null);
  assert.equal(inAppReminderDue({ ...s, reminderDismissed: dayKey(NOW) }, 'normal', NOW), null);
  const early = new Date(NOW);
  early.setHours(10);
  assert.equal(inAppReminderDue(s, 'normal', early), null);
});

// ---------------- Closing the gaps ----------------
test('comeback: offered on a hard day or when the plan stalls, at most weekly', () => {
  const active = base({ checkins: [ci(0)] });
  assert.equal(comebackNeeded(active, NOW, 'orange'), 'hard');
  assert.equal(comebackNeeded(active, NOW, 'pink'), 'hard');
  assert.equal(comebackNeeded(active, NOW, 'red'), null); // red goes to crisis support, not a coach
  assert.equal(comebackNeeded({ ...active, comebackDismissedAt: ago(4) }, NOW, 'orange'), null);
  const finished = { ...active, comeback: { startedAt: ago(6), finishedAt: ago(3), reason: 'away', barriers: [], plan: [], done: [] } };
  assert.equal(comebackNeeded(finished, NOW, 'orange'), null);
  const plan = { createdAt: ago(10), items: [{ id: 'journal', target: 3 }] };
  const stalled = base({ checkins: [ci(0)], habits: plan });
  assert.equal(planStalled(stalled, NOW), true);
  assert.equal(comebackNeeded(stalled, NOW), 'missed');
  assert.equal(planStalled(base({ checkins: [ci(0)], habits: plan, journal: [{ id: 'j', at: ago(2), text: 'x' }] }), NOW), false);
});

test('habits: built around the support system, with a gentle version', () => {
  const s = base({ contacts: [{ id: 'a', name: 'Naledi (sister)', isEmergency: false }] });
  assert.equal(supportPerson(s), 'Naledi');
  assert.ok(suggestedPlan(s).some((i) => i.id === 'connect'));
  assert.ok(!suggestedPlan(base()).some((i) => i.id === 'connect'));
  const k = dayKey(NOW);
  const msg = { ...s, care: { messages: [{ id: 'm', linkId: 'l', mine: true, body: 'hi', at: ago(0) }], links: [] } };
  assert.equal(doneOn(msg, 'connect', k), true);
  const logged = base({ dayLogs: { [k]: { activityMins: 6, sleepHours: 6 } } });
  assert.equal(doneOn(logged, 'move', k), false);
  const gentle = { ...logged, habits: { createdAt: ago(1), items: [], gentle: true } };
  assert.equal(doneOn(gentle, 'move', k), true);
  assert.equal(doneOn(gentle, 'sleep', k), true);
});

test('reminders: adapt when dismissed or unanswered', () => {
  const s = base({ checkins: [ci(0), ci(1), ci(2)] });
  assert.equal(reminderPlan(s, 'normal', NOW).hour, 18);
  const dismissed = { ...s, reminderDismissals: [dayKey(new Date(ago(1))), dayKey(new Date(ago(2)))] };
  const p = reminderPlan(dismissed, 'normal', NOW);
  assert.equal(p.hour, 19);
  assert.equal(p.adjusted, 'later');
  const sparse = base({ checkins: [ci(8), ci(2), ci(0)] });
  assert.equal(missedDays(sparse, NOW), 6);
  const q = reminderPlan(sparse, 'normal', NOW);
  assert.equal(q.everyOtherDay, true);
  assert.equal(q.adjusted, 'fewer');
});

// ---------------- Strings ----------------
test('coach strings exist in English and Setswana, with no em dashes', () => {
  for (const sec of ['comeback', 'habits', 'remind'] as const) {
    const walk = (a: any, b: any, path: string) => {
      for (const k of Object.keys(a)) {
        assert.ok(b && k in b, `tn missing ${path}.${k}`);
        if (typeof a[k] === 'object') walk(a[k], b[k], `${path}.${k}`);
        else {
          assert.ok(!String(a[k]).includes('—') && !String(b[k]).includes('—'), `em dash in ${path}.${k}`);
        }
      }
    };
    walk((en as any)[sec], (tn as any)[sec], sec);
  }
});
