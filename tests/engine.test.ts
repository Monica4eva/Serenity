// Unit tests for the early-warning engine. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateBalance,
  missedCheckinNudge,
  scanText,
  wellbeingScore,
  scoreMessageKey,
  cravingPeakDay,
  sleepCravingLink,
  haltFlags,
  joinList,
  type BalanceAnswers,
} from '../src/lib/engine.ts';

const zero: BalanceAnswers = [0, 0, 0, 0, 0, 0, 0, 0];

test('all clear is green with no reasons', () => {
  const r = evaluateBalance(zero);
  assert.equal(r.level, 'green');
  assert.deepEqual(r.reasons, []);
});

test('an ordinary difficult day stays green and is marked as a hard day', () => {
  const r = evaluateBalance([1, 0, 1, 1, 0, 0, 0, 0]);
  assert.equal(r.level, 'green');
  assert.equal(r.hardDay, true);
  assert.ok(r.reasons.includes('hardDay'));
});

test('several warning signs make amber', () => {
  const r = evaluateBalance([1, 1, 1, 1, 1, 1, 0, 0]);
  assert.equal(r.level, 'amber');
});

test('strong urges alone make amber', () => {
  const r = evaluateBalance([0, 0, 0, 2, 0, 0, 0, 0]);
  assert.equal(r.level, 'amber');
  assert.ok(r.reasons.includes('severeCraving'));
});

test('actively returning to triggers makes amber', () => {
  assert.equal(evaluateBalance([0, 0, 0, 0, 0, 0, 2, 0]).level, 'amber');
});

test('not feeling safe is amber and asks the safety question, never auto-red', () => {
  const r = evaluateBalance([0, 0, 0, 0, 0, 0, 0, 2]);
  assert.equal(r.level, 'amber');
  assert.equal(r.needsSafetyQuestion, true);
});

test('direct disclosure of risk is red regardless of other answers', () => {
  const r = evaluateBalance(zero, [], { safetyDisclosure: true });
  assert.equal(r.level, 'red');
  assert.deepEqual(r.reasons, ['disclosure']);
});

test('a developing pattern over several days makes amber', () => {
  const history = [{ score: 3 }, { score: 4 }, { score: 0 }, { score: 3 }];
  const r = evaluateBalance([1, 0, 1, 1, 0, 0, 0, 0], history);
  assert.equal(r.level, 'amber');
  assert.ok(r.reasons.includes('pattern'));
});

test('old hard days outside the window do not count as a pattern', () => {
  const history = [{ score: 5 }, { score: 5 }, { score: 0 }, { score: 0 }, { score: 0 }, { score: 0 }];
  assert.equal(evaluateBalance([1, 0, 1, 1, 0, 0, 0, 0], history).level, 'green');
});

test('sleep well below personal baseline is recorded as a reason, not an escalation', () => {
  const r = evaluateBalance(zero, [], { sleepHours: 4, baselineSleep: 8 });
  assert.equal(r.level, 'green');
  assert.ok(r.reasons.includes('belowBaselineSleep'));
});

test('conflicting answers: high score but feels safe still amber, no safety question', () => {
  const r = evaluateBalance([2, 2, 2, 1, 2, 2, 1, 0]);
  assert.equal(r.level, 'amber');
  assert.equal(r.needsSafetyQuestion, false);
});

test('a missed check-in never escalates, it only nudges', () => {
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  assert.equal(missedCheckinNudge(twoDaysAgo), true);
  assert.equal(missedCheckinNudge(new Date().toISOString()), false);
  assert.equal(missedCheckinNudge(undefined), false);
});

test('crisis language is detected in English and Setswana', () => {
  assert.equal(scanText('some days I want to die'), 'crisis');
  assert.equal(scanText('I keep thinking about ending my life'), 'crisis');
  assert.equal(scanText('ke batla go ipolaya'), 'crisis');
});

test('low mood text gives a gentle signal, not a crisis', () => {
  assert.equal(scanText("I cry a lot nowadays and I don't seem to get much sleep"), 'lowMood');
  assert.equal(scanText('Had a good day at work'), 'none');
});

test('wellbeing score and message are consistent (48% is not "doing well")', () => {
  assert.equal(scoreMessageKey(48), 'mid');
  assert.equal(scoreMessageKey(80), 'high');
  assert.equal(scoreMessageKey(20), 'low');
  assert.equal(scoreMessageKey(null), 'none');
  const r = wellbeingScore({ moodIndex: 4, day: { sleepHours: 8, meals: 4, water: 8, activityMins: 30 }, craving: 0 });
  assert.equal(r.score, 100);
  assert.equal(wellbeingScore({}).score, null);
});

test('craving peak day is found only with enough evidence', () => {
  const fri = (h: number) => new Date(2026, 10, 13, h).toISOString(); // Friday 13 Nov 2026
  const pts = [
    { at: fri(20), craving: 2 },
    { at: new Date(2026, 10, 6, 20).toISOString(), craving: 1 },
    { at: new Date(2026, 10, 10, 9).toISOString(), craving: 1 },
  ];
  assert.equal(cravingPeakDay(pts), 5);
  assert.equal(cravingPeakDay(pts.slice(0, 2)), null);
});

test('sleep and craving link needs both groups', () => {
  const p = (c: number, s: number) => ({ at: new Date().toISOString(), craving: c, sleepHours: s });
  assert.equal(sleepCravingLink([p(2, 4), p(2, 5), p(0, 8), p(0, 7), p(0, 8)]), true);
  assert.equal(sleepCravingLink([p(0, 8), p(0, 7), p(0, 8), p(0, 8), p(0, 7)]), false);
});

test('HALT flags and list joining', () => {
  assert.deepEqual(haltFlags({ hunger: 1, anger: 0, tiredness: 2 }), ['hunger', 'tiredness']);
  assert.equal(joinList(['hungry', 'tired']), 'hungry and tired');
  assert.equal(joinList(['a', 'b', 'c']), 'a, b and c');
});

test('13 November 2026 is a Friday', () => {
  assert.equal(new Date(2026, 10, 13).getDay(), 5);
});

// ---------- Centre logo escalation button ----------
import { logoState, LOGO_RULES, scanCraving } from '../src/lib/engine.ts';
const NOW = new Date(2026, 10, 13, 20);
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600000).toISOString();

test('logo is normal when tasks are done and there are no signs', () => {
  assert.equal(logoState({ levels: [], missedTaskDays: 0, now: NOW }).state, 'normal');
});

test('a single small sign does not change the logo', () => {
  assert.equal(logoState({ levels: [], missedTaskDays: 0, signals: [{ kind: 'shortSleep', at: hoursAgo(5) }], now: NOW }).state, 'normal');
});

test('missed tasks alone turn the logo orange, never red by default', () => {
  assert.equal(logoState({ levels: [], missedTaskDays: 2, now: NOW }).state, 'orange');
  assert.equal(logoState({ levels: [], missedTaskDays: 10, now: NOW }).state, 'orange');
});

test('a strong craving turns the logo orange', () => {
  const r = logoState({ levels: [], missedTaskDays: 0, signals: [{ kind: 'strongCraving', at: hoursAgo(3) }], now: NOW });
  assert.equal(r.state, 'orange');
  assert.deepEqual(r.reasons, ['strongCraving']);
});

test('several signs together turn the logo red', () => {
  const r = logoState({
    levels: [],
    missedTaskDays: 0,
    signals: [
      { kind: 'strongCraving', at: hoursAgo(3) },
      { kind: 'lowMoodWords', at: hoursAgo(6) },
      { kind: 'shortSleep', at: hoursAgo(10) },
      { kind: 'missedAppointment', at: hoursAgo(20) },
    ],
    now: NOW,
  });
  assert.equal(r.state, 'red');
  assert.equal(r.points, 5);
});

test('missed tasks plus a recent Amber check-in turn the logo red', () => {
  assert.equal(logoState({ levels: [{ level: 'amber', at: hoursAgo(30) }], missedTaskDays: 3, now: NOW }).state, 'red');
});

test('old signs outside the 48-hour window do not count', () => {
  assert.equal(logoState({ levels: [], missedTaskDays: 0, signals: [{ kind: 'strongCraving', at: hoursAgo(60) }], now: NOW }).state, 'normal');
});

test('the same sign repeated many times counts at most twice', () => {
  const sig = Array.from({ length: 6 }, (_, i) => ({ kind: 'heavyHalt' as const, at: hoursAgo(i + 1) }));
  assert.equal(logoState({ levels: [], missedTaskDays: 0, signals: sig, now: NOW }).points, 2);
});

test('a Red level or a relapse in the last day turns the logo red', () => {
  assert.equal(logoState({ levels: [{ level: 'red', at: hoursAgo(2) }], missedTaskDays: 0, now: NOW }).state, 'red');
  const r = logoState({ levels: [], missedTaskDays: 0, relapses: [{ at: hoursAgo(5) }], now: NOW });
  assert.equal(r.state, 'red');
  assert.deepEqual(r.reasons, ['relapse']);
});

test('crisis language goes straight to red', () => {
  const r = logoState({ levels: [], missedTaskDays: 0, signals: [{ kind: 'worryingWords', at: hoursAgo(1) }], now: NOW });
  assert.equal(r.state, 'red');
  assert.deepEqual(r.reasons, ['worryingWords']);
});

test('signs build up: orange, then pink, then red', () => {
  const sg = (k: any, h: number) => ({ kind: k, at: hoursAgo(h) });
  assert.equal(logoState({ levels: [], missedTaskDays: 0, signals: [sg('strongCraving', 1)], now: NOW }).state, 'orange');
  assert.equal(logoState({ levels: [], missedTaskDays: 0, signals: [sg('strongCraving', 1), sg('lowMoodWords', 2), sg('shortSleep', 3)], now: NOW }).state, 'pink');
  assert.equal(logoState({ levels: [], missedTaskDays: 0, signals: [sg('strongCraving', 1), sg('strongCraving', 2), sg('lowMoodWords', 3)], now: NOW }).state, 'red');
});

test('"I\'m alright now" clears earlier signs, red included, and new signs count again', () => {
  const base = { levels: [{ level: 'red' as const, at: hoursAgo(3) }], missedTaskDays: 0, relapses: [{ at: hoursAgo(4) }], signals: [{ kind: 'worryingWords' as const, at: hoursAgo(2) }], now: NOW };
  assert.equal(logoState(base).state, 'red');
  assert.equal(logoState({ ...base, allClearAt: hoursAgo(1) }).state, 'normal');
  const after = logoState({ ...base, allClearAt: hoursAgo(1), signals: [...base.signals, { kind: 'worryingWords', at: hoursAgo(0.5) }] });
  assert.equal(after.state, 'red');
});

test('crisis and craving words are recognised in English and Setswana', () => {
  assert.equal(scanText("honestly I don't want to be here anymore"), 'crisis');
  assert.equal(scanText('ga ke batle go tshela'), 'crisis');
  assert.ok(scanCraving('I am going to drink tonight'));
  assert.ok(scanCraving('ke batla go nwa'));
  assert.ok(!scanCraving('I went for a walk'));
});

test('product-owner switch lets missed tasks alone turn the logo red', () => {
  LOGO_RULES.redFromMissedTasksAlone = true;
  assert.equal(logoState({ levels: [], missedTaskDays: 3, now: NOW }).state, 'red');
  LOGO_RULES.redFromMissedTasksAlone = false;
});

// ---------- Encryption and sync mapping ----------
import { newKey, seal, open, isValidKey, fingerprint } from '../src/lib/cryptoCore.ts';
import { stateToRecords, rowsToState, mergeIntoState } from '../src/lib/syncMap.ts';

test('journal encryption round-trips and the server only sees ciphertext', () => {
  const k = newKey();
  const box = seal(k, { text: 'I cry a lot nowadays', prompt: 'p1' });
  assert.ok(!box.ciphertext.includes('cry'));
  assert.deepEqual(open(k, box.ciphertext, box.nonce), { text: 'I cry a lot nowadays', prompt: 'p1' });
});

test('a wrong key or tampered data cannot open the journal', () => {
  const box = seal(newKey(), { text: 'secret' });
  assert.equal(open(newKey(), box.ciphertext, box.nonce), null);
  const k = newKey();
  const b2 = seal(k, { text: 'secret' });
  const tampered = (b2.ciphertext[0] === 'A' ? 'B' : 'A') + b2.ciphertext.slice(1);
  assert.equal(open(k, tampered, b2.nonce), null);
});

test('recovery keys are validated', () => {
  assert.equal(isValidKey(newKey()), true);
  assert.equal(isValidKey('not a key'), false);
});

const sampleState = (): any => ({
  language: 'en', languageChosen: true, onboarded: true, loggedIn: true, consents: [{ type: 'terms', version: '0.1', granted: true, at: '2026-11-13T10:00:00.000Z' }],
  profile: { preferredName: 'Mompati', answers: { why: 'my daughter' }, supportNeeds: ['reminders'], sixMonthVision: 'working again' },
  baseline: { halt: ['tiredness'], extended: { sleep: '22:00' }, sleepHours: 7, feeling: 2, craving: 0 },
  contacts: [{ id: 'c1', name: 'Dr K', role: 'counsellor', phone: '+267 71', isEmergency: true, consentLevel: 'alerts' }],
  approach: '12step', goals: [{ id: 'substanceFree', progress: 0 }], dimensions: [{ dimension: 'social', score: 3, at: '2026-11-13T10:00:00.000Z' }],
  recoveryStart: '2026-11-10T08:00:00.000Z', relapses: [], checkins: [{ id: 'k1', type: 'balance', answers: { answers: [0, 1] }, level: 'amber', reasons: ['missed'], score: 4, at: '2026-11-13T12:00:00.000Z' }],
  journal: [{ id: 'j1', at: '2026-11-13T13:00:00.000Z', mood: 1, text: 'hard day' }], focus: { '2026-11-13': ['reading'] },
  dayLogs: { '2026-11-13': { sleepHours: 6, water: 4 } }, appointments: [{ id: 'a1', title: 'Clinic', when: '2026-11-20 10:00' }],
  triggers: [{ id: 't1', category: 'place', label: 'the bar on Main St' }], activitiesDone: [{ id: 'walk', at: '2026-11-13T14:00:00.000Z' }],
  safetyEvents: [{ at: '2026-11-13T15:00:00.000Z', kind: 'emergency_opened' }], dismissals: [],
  settings: { fontScale: 1, dyslexia: true, highContrast: false, dark: false, voiceFirst: false, simplePrompts: false, discreet: true, appLock: true, pinHash: 'SECRET', blockScreenshots: false },
  emergencyNumbers: [], pendingSync: 0, journalLocked: 0,
});

test('sync never uploads the PIN or plain journal text', () => {
  const recs = stateToRecords(sampleState(), 'u1');
  const all = JSON.stringify(recs.map((r) => r.row));
  assert.ok(!all.includes('SECRET'), 'PIN hash must stay on the phone');
  assert.ok(!all.includes('hard day'), 'journal text must only travel encrypted');
  assert.ok(recs.every((r) => r.row.user_id === 'u1'));
});

test('a new phone gets everything back after login (round trip)', () => {
  const s = sampleState();
  const k = newKey();
  const recs = stateToRecords(s, 'u1');
  const rows: Record<string, any[]> = {};
  for (const r of recs) {
    const row = r.secret ? { ...r.row, ...seal(k, r.secret) } : r.row;
    (rows[r.table] ??= []).push(row);
  }
  delete rows.safety_events; // users can never read these back
  const { patch, locked } = rowsToState(rows, (c, n) => open(k, c, n));
  assert.equal(locked, 0);
  const blank: any = { ...sampleState(), onboarded: false, profile: { preferredName: '', answers: {}, supportNeeds: [] }, consents: [], contacts: [], goals: [], dimensions: [], checkins: [], journal: [], focus: {}, dayLogs: {}, appointments: [], triggers: [], activitiesDone: [], safetyEvents: [], settings: { ...s.settings, dyslexia: false, pinHash: undefined } };
  const merged = mergeIntoState(blank, patch, locked);
  assert.equal(merged.profile.preferredName, 'Mompati');
  assert.equal(merged.onboarded, true);
  assert.equal(merged.journal[0].text, 'hard day');
  assert.equal(merged.contacts[0].name, 'Dr K');
  assert.equal(merged.checkins[0].level, 'amber');
  assert.equal(merged.dayLogs['2026-11-13'].sleepHours, 6);
  assert.equal(merged.settings.dyslexia, true, 'accessibility settings follow the person');
  assert.equal(merged.settings.pinHash, undefined, 'PIN is never restored from the server');
});

test('journal entries from another key are counted as locked, not shown', () => {
  const box = seal(newKey(), { text: 'x' });
  const { patch, locked } = rowsToState({ journal_entries: [{ id: 'j', created_at: 'now', ...box }] }, (c, n) => open(newKey(), c, n));
  assert.equal(locked, 1);
  assert.equal(patch.journal!.length, 0);
});

test('changing a record changes its fingerprint, identical records do not', () => {
  assert.equal(fingerprint({ a: 1 }), fingerprint({ a: 1 }));
  assert.notEqual(fingerprint({ a: 1 }), fingerprint({ a: 2 }));
});

// ---------- Translations: Setswana covers everything, with matching placeholders ----------
import en from '../src/locales/en.ts';
import tnStrings from '../src/locales/tn.ts';

test('every English string has a Setswana version with the same placeholders', () => {
  const missing: string[] = [];
  const walk = (a: any, b: any, path: string) => {
    if (typeof a === 'string') {
      if (typeof b !== 'string' || (!b.trim() && a.trim() !== '')) return missing.push(path);
      const ph = (x: string) => (x.match(/\{\{\w+\}\}/g) ?? []).sort().join(',');
      if (ph(a) !== ph(b)) missing.push(`${path} (placeholders ${ph(a)} vs ${ph(b)})`);
      return;
    }
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return missing.push(`${path} (list length)`);
      return a.forEach((x, i) => walk(x, b[i], `${path}[${i}]`));
    }
    for (const k of Object.keys(a)) walk(a[k], b?.[k], path ? `${path}.${k}` : k);
  };
  walk(en, tnStrings, '');
  assert.deepEqual(missing, []);
});

test('Setswana day names line up with real dates', () => {
  assert.equal(tnStrings.dates.days[new Date(2026, 10, 13).getDay()], 'Labotlhano'); // Friday
  assert.equal(tnStrings.dates.months[10], 'Ngwanatsele'); // November
});
