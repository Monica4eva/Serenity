import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, begin, detectIntent, type Ctx, type Turn } from '../src/lib/companion.ts';
import en from '../src/locales/en.ts';
import tn from '../src/locales/tn.ts';

const ctx: Ctx = { name: 'Mompati', contacts: ['Dr Kgosi'], days: 24, checkins: 6, journal: 7 };
const say = (t: Turn, text?: string, value?: string) => advance(t.session, { text, value }, ctx);
const keys = (t: Turn) => t.bot.map((m) => m.key);
const get = (o: any, k: string) => k.replace(/^companion\./, '').split('.').reduce((a, x) => a?.[x], o);

test('starts with the Step 1 check-in question', () => {
  const t = begin(ctx);
  assert.equal(t.session.node, 's1_feel');
  assert.deepEqual(keys(t), ['companion.intro', 'companion.s1.feel']);
});

test('elevated urge goes to validate (Step 2); stable urge goes to maintain (Step 5)', () => {
  const t1 = say(begin(ctx), 'tired');
  const high = say(t1, undefined, '7');
  assert.equal(high.session.node, 's2_hardest');
  assert.ok(high.effects.some((e) => e.kind === 'baseline' && e.payload?.craving === 2));
  const low = say(t1, undefined, '2');
  assert.equal(low.session.node, 's1_happen');
  const s5 = say(say(low, 'work was long'), 'eating well');
  assert.equal(s5.session.node, 's5_helping');
});

test('a crisis phrase at any point goes straight to the safety questions', () => {
  let t = say(say(begin(ctx), 'ok'), undefined, '2');
  t = say(t, 'honestly I want to die');
  assert.equal(t.session.node, 's7_danger');
  assert.ok(t.effects.some((e) => e.kind === 'risk'));
  assert.ok(keys(t).includes('companion.s7.intro'));
});

test('yes to danger hands off and holds; typing cannot end the hold', () => {
  let t = say(begin(ctx), "I can't do this anymore");
  assert.equal(t.session.node, 's7_danger');
  assert.equal(keys(t)[0], 'companion.cantGoOn');
  t = say(t, undefined, 'yes');
  assert.equal(t.session.hold, true);
  assert.ok(t.effects.some((e) => e.kind === 'handoff'));
  t = say(t, 'ok I feel better, lets do grounding');
  assert.equal(t.session.hold, true);
  t = say(t, undefined, 'safe');
  assert.equal(t.session.node, 'hold_confirm');
  const unsure = say(t, undefined, 'no');
  assert.equal(unsure.session.hold, true);
  const released = say(t, undefined, 'yes');
  assert.equal(released.session.hold, false);
  assert.equal(released.session.node, 's3_offer');
});

test('a crisis message during the safety questions hands off at once', () => {
  let t = say(begin(ctx), "I can't go on");
  t = say(t, 'I want to kill myself');
  assert.equal(t.session.hold, true);
});

test('"I already relapsed" leads to a gentle review, then one small step', () => {
  let t = say(begin(ctx), 'I relapsed last night');
  assert.equal(keys(t)[0], 'companion.s8.thanks');
  t = say(t, 'argument at home');
  t = say(t, undefined, 'miss:feeling');
  t = say(t, 'call my sponsor earlier');
  t = say(t, 'I stopped after one');
  assert.equal(t.session.node, 's6_hour');
  const review = t.effects.find((e) => e.kind === 'review');
  assert.equal(review?.payload?.missed, 'feeling');
});

test('craving: validate, ground, re-rate; a rising urge triggers the safety check', () => {
  let t = say(begin(ctx), undefined, 'i:craving');
  assert.equal(t.session.node, 's3_offer');
  assert.equal(keys(t)[0], 'companion.s2.wave');
  t = say(t, undefined, 'yes');
  assert.equal(t.session.node, 's3_breathe');
  t = say(say(t, undefined, 'done'), 'chest');
  assert.equal(t.session.node, 's4_rerate');
  const calm = say(t, undefined, '3');
  assert.equal(calm.session.node, 's4_reach');
  const high = say(t, undefined, '9');
  assert.equal(high.session.node, 's7_danger');
});

test('feeling like a failure, why bother, dealer number and "I\'m fine" follow the guide', () => {
  assert.equal(say(begin(ctx), 'I feel like a failure').bot[0].key, 'companion.failure.reframe');
  const why = say(begin(ctx), 'why bother, nothing works');
  assert.equal(why.session.node, 's6_hour');
  assert.equal(why.bot[1].key, 'companion.whyBother.winCheckins');
  assert.equal(say(begin(ctx), "should I delete my dealer's number?").session.node, 'dealer_safer');
  const fine = say(begin(ctx), "I'm fine, I don't need help");
  assert.equal(fine.session.node, 'fine_end');
});

test('a plan ends with a saved commitment', () => {
  let t = say(begin(ctx), 'why bother');
  t = say(t, undefined, 'idea:walk');
  t = say(t, undefined, 'who:Dr Kgosi');
  t = say(say(t, 'go with my sister'), 'calmer');
  assert.equal(t.session.node, 'end');
  assert.ok(t.effects.some((e) => e.kind === 'plan' && e.payload?.who === 'Dr Kgosi'));
});

test('Setswana phrases are understood', () => {
  assert.equal(detectIntent('ke batla go ipolaya'), 'crisis');
  assert.equal(detectIntent('ke wetse maabane'), 'relapsed');
  assert.equal(detectIntent('ke na le keletso e kgolo'), 'craving');
});

test('every line the guide can say exists in English and Setswana, with no em dashes', () => {
  const walk = (o: any, path: string[] = []): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [[...path, k].join('.')] : Array.isArray(v) ? [] : walk(v, [...path, k])));
  for (const k of walk(en.companion)) {
    const e = get(en.companion, k);
    const s = get(tn.companion, k);
    assert.ok(s, `missing Setswana: ${k}`);
    assert.ok(!e.includes('—') && !s.includes('—'), `em dash in ${k}`);
    assert.ok(!/\baddict\b|rock bottom|calm down|just don't/i.test(e), `forbidden phrase in ${k}`);
  }
});
