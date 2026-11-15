import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alertAudience, buildSummary, cleanPermissions, formatCode, isCodeShaped, simpleStatus, sortBySeverity, type Snapshot } from '../src/lib/summary.ts';

const snap: Snapshot = {
  name: 'Neo', days: 31, logo: 'red', reasons: ['worryingWords'],
  trends: [{ day: '2026-11-14', mood: 1, craving: 2, sleep: 4, score: 30, checkedIn: true }],
  goals: [{ id: 'wellbeing', progress: 40.4 }], relapses: [{ at: '2026-11-10T08:00:00Z' }], now: '2026-11-15T08:00:00Z',
};

test('supporters only ever get a simple status and milestones', () => {
  const s = buildSummary('supporter', { alerts: true, status: true, milestones: true, trends: true, journal: true }, snap);
  assert.equal(s.status, 'help');
  assert.equal(s.days, 31);
  assert.deepEqual(s.milestonesReached, [1, 7, 14, 30]);
  assert.equal(s.nextMilestone, 60);
  for (const k of ['logo', 'reasons', 'trends', 'goals', 'relapses30']) assert.equal((s as any)[k], undefined, k);
  assert.ok(!JSON.stringify(s).includes('worryingWords'));
});

test('a supporter without the alerts permission never sees "needs help now"', () => {
  assert.equal(simpleStatus('red', { status: true }), 'support');
  assert.equal(simpleStatus('red', {}), undefined);
  assert.equal(simpleStatus('normal', { alerts: true }), undefined);
  assert.equal(simpleStatus('normal', { status: true }), 'okay');
});

test('professional summary follows permissions', () => {
  const full = buildSummary('professional', { alerts: true, trends: true, milestones: true }, snap);
  assert.equal(full.logo, 'red');
  assert.deepEqual(full.reasons, ['worryingWords']);
  assert.equal(full.trends?.length, 1);
  assert.equal(full.goals?.[0].progress, 40);
  assert.equal(full.relapses30, 1);
  const none = buildSummary('professional', {}, snap);
  assert.equal(none.logo, undefined);
  assert.equal(none.trends, undefined);
  assert.equal(none.days, undefined);
});

test('supporters cannot be given trend or journal permissions', () => {
  assert.deepEqual(cleanPermissions('supporter', { trends: true, journal: true, alerts: true }), { alerts: true, status: false, milestones: false, messages: false });
});

test('alerts: counsellors on pink and red, supporters on red only, never when it gets better', () => {
  assert.deepEqual(alertAudience('normal', 'orange'), { professional: false, supporter: false });
  assert.deepEqual(alertAudience('orange', 'pink'), { professional: true, supporter: false });
  assert.deepEqual(alertAudience('pink', 'red'), { professional: true, supporter: true });
  assert.deepEqual(alertAudience('red', 'pink'), { professional: false, supporter: false });
});

test('clients are sorted with the most urgent first', () => {
  const list = sortBySeverity([
    { n: 'a', summary: { v: 1, role: 'professional', name: 'a', updatedAt: '1', logo: 'normal' } },
    { n: 'b', summary: null },
    { n: 'c', summary: { v: 1, role: 'professional', name: 'c', updatedAt: '1', logo: 'red' } },
    { n: 'd', summary: { v: 1, role: 'professional', name: 'd', updatedAt: '1', logo: 'orange' } },
  ] as any[]);
  assert.deepEqual(list.map((x: any) => x.n), ['c', 'd', 'a', 'b']);
});

test('invite codes ignore case, spaces and dashes', () => {
  assert.ok(isCodeShaped('abcde-fghjk'));
  assert.ok(!isCodeShaped('ABCDE-FGHI1')); // I and 1 are never used
  assert.equal(formatCode('abcdefghjk'), 'ABCDE-FGHJK');
});
