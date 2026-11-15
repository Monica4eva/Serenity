// Serenity Guide: a guided, rule-based chat companion.
//
// It follows the specialist's 8-step structure (check-in, validate, ground, re-assess,
// maintain, plan, safety escalation, review after a slip) and the response rules
// ("If they say X, respond with Y, lead to Z"). Every line it says comes from the
// translation files, so it never improvises, diagnoses or gives medication advice,
// and it works offline in English and Setswana.
//
// Safety comes first: a risk signal at any point jumps to the safety questions, and a
// "yes" pauses everything else ("hold") until the person reaches a human and confirms
// they are safe. Typing alone can never end a hold.
//
// This file is pure logic (no React), so it can be tested and reviewed by the clinical lead.
import { scanCraving, scanText } from './engine.ts';

export type Msg = { key: string; vars?: Record<string, string | number> };
export type Reply = { value: string; key?: string; label?: string };
export type InputKind = 'text' | 'scale' | 'choice' | 'none';
export type Ask = { input: InputKind; replies: Reply[]; step: number; canSkip: boolean };
export type Session = { node: string; data: Record<string, any>; hold: boolean };
export type EffectKind = 'baseline' | 'craving' | 'plan' | 'maintain' | 'review' | 'risk' | 'handoff' | 'showHandoff' | 'close' | 'lowMood' | 'cravingWords' | 'allClear' | 'openUrge';
export type Effect = { kind: EffectKind; payload?: Record<string, any> };
export type Ctx = { name: string; contacts: string[]; days: number; checkins: number; journal: number };
export type Turn = { session: Session; bot: Msg[]; ask: Ask; effects: Effect[] };
export type Input = { value?: string; text?: string };

export type Intent = 'crisis' | 'cantGoOn' | 'relapsed' | 'failure' | 'whyBother' | 'deleteNumber' | 'craving' | 'talk' | 'fine';

// Order matters: the first match wins, and safety is checked first.
const INTENTS: [Intent, RegExp][] = [
  ['crisis', /(kill myself|end (it all|my life)|suicid|want to die|better off dead|hurt (myself|someone)|harm (myself|someone)|go ipolaya|ke batla go swa|ke batla go ikgobatsa)/i],
  ['cantGoOn', /(can'?t do (this|it) anymore|cannot do (this|it) anymore|can'?t go on|cannot go on|ga ke sa kgone|ga ke kgone go tswelela)/i],
  ['relapsed', /(relaps|i slipped|i used (again|today|last night)|i drank|had a drink|i took (something|drugs)|ke wetse|ke nole|ke dirisitse|ke boetse)/i],
  ['deleteNumber', /((delete|block|remove).{0,20}(dealer|number|contact))|dealer/i],
  ['talk', /(just (need|want) to talk|need to talk|want to talk|ke batla go bua|ke tlhoka go bua)/i],
  ['failure', /(failure|i failed|i'?m useless|worthless|i'?m broken|ke paletswe|ga ke na mosola|ke senyegile)/i],
  ['whyBother', /(why bother|nothing works|what'?s the point|no point|ga go thuse|ga go na mosola)/i],
  ['craving', /(crav|urge|want to (use|drink)|tempted|keletso|ke batla go nwa|ke batla go dirisa)/i],
  ['fine', /(don'?t need (any )?help|do not need (any )?help|no help needed|leave me alone|ga ke tlhoke thuso)/i],
];

export function detectIntent(text: string): Intent | null {
  const t = text.trim();
  if (!t) return null;
  if (scanText(t) === 'crisis') return 'crisis';
  for (const [intent, re] of INTENTS) if (re.test(t)) return intent;
  return null;
}

// Intents that change direction from any point in the chat.
const ANYWHERE: Intent[] = ['crisis', 'cantGoOn', 'relapsed', 'talk', 'deleteNumber'];
// Points where the person is speaking freely, so any intent can redirect.
const OPEN = new Set(['s1_feel', 's2_listen', 's2_more', 'end', 'closed', 'fine_end', 's5_helping']);

const YES = /^(yes|yeah|yep|y|ee|ehe|ee rra|ee mma)\b/i;
const NO = /^(no|nope|n|nnyaa|nya)\b/i;

const r = (value: string, key: string): Reply => ({ value, key });
const skipNodes = new Set(['s1_feel', 's1_happen', 's1_steady', 's2_hardest', 's3_body', 's5_helping', 's5_protect', 's5_risk', 's5_prepare', 's5_win', 's6_easier', 's6_know', 's8_warning', 's8_adjust', 's8_well', 'fail_friend', 'fail_need', 'dealer_safer', 's1_urge', 's4_rerate', 's6_hour', 's6_who', 's8_missed']);

const QUESTION: Record<string, string> = {
  s1_feel: 'companion.s1.feel',
  s1_urge: 'companion.s1.urge',
  s1_happen: 'companion.s1.happen',
  s1_steady: 'companion.s1.steady',
  s2_hardest: 'companion.s2.hardest',
  s2_need: 'companion.s2.need',
  s2_listen: 'companion.s2.listen',
  s2_more: 'companion.s2.more',
  s3_offer: 'companion.s3.offer',
  s3_breathe: 'companion.s3.breathe',
  s3_body: 'companion.s3.body',
  s4_rerate: 'companion.s4.rerate',
  s4_reach: 'companion.s4.reach',
  s5_helping: 'companion.s5.helping',
  s5_protect: 'companion.s5.protect',
  s5_risk: 'companion.s5.risk',
  s5_prepare: 'companion.s5.prepare',
  s5_win: 'companion.s5.win',
  s6_hour: 'companion.s6.hour',
  s6_who: 'companion.s6.who',
  s6_easier: 'companion.s6.easier',
  s6_know: 'companion.s6.know',
  s7_danger: 'companion.s7.danger',
  s7_harm: 'companion.s7.harm',
  s7_with: 'companion.s7.with',
  s7_willing: 'companion.s7.willing',
  hold: 'companion.s7.handoff',
  hold_confirm: 'companion.s7.confirm',
  s8_warning: 'companion.s8.warning',
  s8_missed: 'companion.s8.missed',
  s8_adjust: 'companion.s8.adjust',
  s8_well: 'companion.s8.well',
  fail_friend: 'companion.s2.friend',
  fail_need: 'companion.failure.need',
  dealer_safer: 'companion.dealer.line',
  dealer_who: 'companion.dealer.who',
  fine_end: 'companion.fine',
  end: 'companion.end.q',
  closed: 'companion.end.bye',
};

const STEP: Record<string, number> = {
  s1: 1, s2: 2, s3: 3, s4: 4, s5: 5, s6: 6, s7: 7, hold: 7, hold_confirm: 7, s8: 8, fail: 8, dealer: 6, fine: 5, end: 6, closed: 6,
};

export function askFor(node: string, ctx: Ctx): Ask {
  const step = STEP[node.split('_')[0]] ?? STEP[node] ?? 1;
  const canSkip = skipNodes.has(node);
  const people = ctx.contacts.slice(0, 4).map((n) => ({ value: `who:${n}`, label: n }));
  switch (node) {
    case 's1_feel':
      return { input: 'text', step, canSkip, replies: [r('i:ok', 'companion.quick.ok'), r('i:stressed', 'companion.quick.stressed'), r('i:low', 'companion.quick.low'), r('i:craving', 'companion.quick.craving'), r('i:relapsed', 'companion.quick.relapsed')] };
    case 's1_urge':
    case 's4_rerate':
      return { input: 'scale', step, canSkip, replies: [] };
    case 's2_need':
      return { input: 'choice', step, canSkip, replies: [r('heard', 'companion.s2.heard'), r('plan', 'companion.s2.plan')] };
    case 's2_more':
      return { input: 'text', step, canSkip, replies: [r('more', 'companion.s2.sayMore'), r('settle', 'companion.s2.settle')] };
    case 's3_offer':
      return { input: 'choice', step, canSkip, replies: [r('yes', 'companion.s3.yes'), r('surf', 'companion.s3.surf'), r('no', 'companion.s3.notNow')] };
    case 's3_breathe':
      return { input: 'choice', step, canSkip, replies: [r('done', 'companion.s3.done')] };
    case 's4_reach':
      return { input: 'choice', step, canSkip, replies: [r('reach', 'companion.s4.reachYes'), r('keep', 'companion.s4.keepGoing')] };
    case 's5_risk':
      return { input: 'text', step, canSkip, replies: [r('nothing', 'companion.s5.nothing')] };
    case 's6_hour':
      return { input: 'text', step, canSkip, replies: ['eat', 'water', 'walk', 'call', 'meeting', 'rest'].map((k) => r(`idea:${k}`, `companion.s6.ideas.${k}`)) };
    case 's6_who':
    case 'dealer_who':
      return { input: 'text', step, canSkip, replies: [...people, r('who:none', 'companion.s6.noOne')] };
    case 's7_danger':
      return { input: 'choice', step, canSkip, replies: [r('yes', 'companion.s7.dangerYes'), r('no', 'companion.s7.dangerNo')] };
    case 's7_harm':
    case 's7_with':
      return { input: 'choice', step, canSkip, replies: [r('yes', 'companion.s7.yes'), r('no', 'companion.s7.no')] };
    case 's7_willing':
      return { input: 'choice', step, canSkip, replies: [r('yes', 'companion.s7.willingYes'), r('no', 'companion.s7.willingNo')] };
    case 'hold':
      return { input: 'text', step, canSkip: false, replies: [r('contacted', 'companion.s7.contacted'), r('safe', 'companion.s7.safeNow')] };
    case 'hold_confirm':
      return { input: 'choice', step, canSkip: false, replies: [r('yes', 'companion.s7.confirmYes'), r('no', 'companion.s7.confirmNo')] };
    case 's8_missed':
      return { input: 'text', step, canSkip, replies: ['trigger', 'time', 'feeling', 'person', 'notSure'].map((k) => r(`miss:${k}`, `companion.s8.missOpts.${k}`)) };
    case 'fine_end':
      return { input: 'text', step, canSkip, replies: [r('check', 'companion.fineCheck'), r('close', 'companion.close')] };
    case 'end':
      return { input: 'text', step, canSkip, replies: [r('keep', 'companion.end.keep'), r('done', 'companion.end.done')] };
    case 'closed':
      return { input: 'text', step, canSkip: false, replies: [r('again', 'companion.end.again')] };
    default:
      return { input: 'text', step, canSkip, replies: [] };
  }
}

const go = (session: Session, node: string, ctx: Ctx, pre: Msg[] = [], effects: Effect[] = [], data: Record<string, any> = {}, hold?: boolean): Turn => {
  const s: Session = { node, data: { ...session.data, ...data }, hold: hold ?? session.hold };
  const q = QUESTION[node];
  return { session: s, bot: q ? [...pre, { key: q }] : pre, ask: askFor(node, ctx), effects };
};

export function begin(ctx: Ctx): Turn {
  const t = go({ node: 'start', data: {}, hold: false }, 's1_feel', ctx);
  return { ...t, bot: [{ key: 'companion.intro', vars: { name: ctx.name } }, ...t.bot] };
}

const urgeToCraving = (n: number) => (n >= 7 ? 2 : n >= 4 ? 1 : 0);

function parseScale(input: Input): number | undefined {
  const raw = input.value ?? input.text ?? '';
  const m = String(raw).match(/\b(10|[1-9])\b/);
  return m ? Number(m[1]) : undefined;
}

function yesNo(input: Input): 'yes' | 'no' | undefined {
  if (input.value === 'yes' || input.value === 'no') return input.value;
  const t = (input.text ?? '').trim();
  if (YES.test(t)) return 'yes';
  if (NO.test(t)) return 'no';
  return undefined;
}

/** Start the safety screen (Step 7). */
const safety = (session: Session, ctx: Ctx, pre: Msg[], effects: Effect[] = []) => go(session, 's7_danger', ctx, [...pre, { key: 'companion.s7.intro' }], effects);
/** Hand off to a human and pause everything else until the person confirms they are safe. */
const handoff = (session: Session, ctx: Ctx, effects: Effect[]) => go(session, 'hold', ctx, [], [...effects, { kind: 'handoff' }], {}, true);

/**
 * One step of the conversation. Anything the person types is also checked for low-mood and
 * craving words (these feed the escalation button) without saving the words themselves.
 */
export function advance(session: Session, input: Input, ctx: Ctx): Turn {
  const turn = step(session, input, ctx);
  const text = (input.text ?? '').trim();
  if (text && !turn.effects.some((e) => e.kind === 'risk')) {
    if (scanCraving(text)) turn.effects.push({ kind: 'cravingWords' });
    else if (scanText(text) === 'lowMood') turn.effects.push({ kind: 'lowMood' });
  }
  return turn;
}

function step(session: Session, input: Input, ctx: Ctx): Turn {
  const text = (input.text ?? '').trim();
  const value = input.value;
  const skipped = value === 'skip';
  const answer = skipped ? '' : text;
  const n = session.node;

  // ----- Safety hold: only a confirmed "I'm safe" ends it. -----
  if (session.hold) {
    const crisis = !!text && detectIntent(text) === 'crisis';
    if (n === 'hold_confirm') {
      const yn = yesNo(input);
      // Two safety answers given ("I'm safe", "safe right now and no one at risk"): the button can go back to blue.
      if (yn === 'yes' && !crisis) return go(session, 's3_offer', ctx, [{ key: 'companion.s7.released' }], [{ kind: 'allClear' }], {}, false);
      return go(session, 'hold', ctx, [{ key: 'companion.s7.hold' }], crisis ? [{ kind: 'risk' }] : []);
    }
    if (value === 'contacted') return go(session, 'hold_confirm', ctx, [{ key: 'companion.s7.contactedReply' }]);
    if (value === 'safe') return go(session, 'hold_confirm', ctx);
    return { session, bot: [{ key: 'companion.s7.hold' }], ask: askFor('hold', ctx), effects: crisis ? [{ kind: 'risk' }] : [] };
  }

  // ----- Intents (from typed text, or from a quick reply such as "I'm craving") -----
  let intent: Intent | null = text ? detectIntent(text) : null;
  if (value === 'i:craving') intent = 'craving';
  if (value === 'i:relapsed') intent = 'relapsed';
  if (value === 'talk') intent = 'talk';
  // Inside the safety questions, only a crisis signal changes direction: straight to a person.
  if (n.startsWith('s7') && intent) {
    if (intent === 'crisis') return handoff(session, ctx, [{ kind: 'risk' }]);
    intent = null;
  }
  if (intent && (ANYWHERE.includes(intent) || OPEN.has(n))) {
    switch (intent) {
      case 'crisis':
        return safety(session, ctx, [], [{ kind: 'risk' }]);
      case 'cantGoOn':
        return safety(session, ctx, [{ key: 'companion.cantGoOn' }]);
      case 'relapsed':
        return go(session, 's8_warning', ctx, [{ key: 'companion.s8.thanks' }], [], { path: 'review' });
      case 'talk':
        return go(session, 's2_listen', ctx);
      case 'deleteNumber':
        return go(session, 'dealer_safer', ctx);
      case 'craving':
        return go(session, 's3_offer', ctx, [{ key: 'companion.s2.wave' }], [{ kind: 'craving', payload: { urge: session.data.urge } }], { path: 'craving' });
      case 'failure':
        return go(session, 'fail_friend', ctx, [{ key: 'companion.failure.reframe' }]);
      case 'whyBother': {
        const win: Msg = ctx.checkins > 0 || ctx.journal > 0 ? { key: 'companion.whyBother.winCheckins', vars: { n: ctx.checkins, j: ctx.journal } } : { key: 'companion.whyBother.winDays', vars: { n: ctx.days } };
        return go(session, 's6_hour', ctx, [{ key: 'companion.whyBother.line' }, win, { key: 'companion.s4.smallest' }]);
      }
      case 'fine':
        return go(session, 'fine_end', ctx);
    }
  }

  // ----- Step-by-step flow -----
  switch (n) {
    // Step 1: check-in / baseline
    case 's1_feel':
      return go(session, 's1_urge', ctx, [], [], { feel: answer || (value?.startsWith('i:') ? value.slice(2) : '') });
    case 's1_urge': {
      const u = parseScale(input);
      if (u === undefined && !skipped) return go(session, 's1_urge', ctx, [{ key: 'companion.scaleAgain' }]);
      const data = { urge: u };
      const fx: Effect[] = [{ kind: 'baseline', payload: { feeling: session.data.feel, urge: u, craving: u === undefined ? undefined : urgeToCraving(u) } }];
      if (u !== undefined && u >= 4) return go(session, 's2_hardest', ctx, [{ key: 'companion.s1.saved' }, { key: 'companion.s2.wave' }], fx, { ...data, path: 'craving' });
      return go(session, 's1_happen', ctx, [{ key: 'companion.s1.saved' }], fx, data);
    }
    case 's1_happen':
      return go(session, 's1_steady', ctx, [], [], { happen: answer });
    case 's1_steady':
      return go(session, 's5_helping', ctx, [], [], { steady: answer, path: 'maintain' });

    // Step 2: validate and normalise
    case 's2_hardest':
      return go(session, 's2_need', ctx, answer ? [{ key: 'companion.s2.reflect' }, { key: 'companion.s2.normal' }] : [{ key: 'companion.s2.normal' }], [], { hardest: answer });
    case 's2_need':
      if (value === 'plan') return go(session, 's3_offer', ctx);
      if (value === 'heard') return go(session, 's2_listen', ctx);
      if (answer) return go(session, 's2_more', ctx, [{ key: 'companion.s2.reflect' }]);
      return go(session, 's3_offer', ctx);
    case 's2_listen':
      return go(session, 's2_more', ctx, answer ? [{ key: 'companion.s2.reflect' }] : []);
    case 's2_more':
      if (value === 'settle') return go(session, 's3_offer', ctx);
      if (value === 'more') return go(session, 's2_listen', ctx);
      return go(session, 's2_more', ctx, answer ? [{ key: 'companion.listening' }] : []);

    // Step 3: ground and regulate
    case 's3_offer':
      if (value === 'surf') return go(session, 'end', ctx, [{ key: 'companion.s3.surfLine' }], [{ kind: 'openUrge' }]);
      if (value === 'yes' || yesNo(input) === 'yes') return go(session, 's3_breathe', ctx);
      return go(session, session.data.urge !== undefined || session.data.path === 'craving' ? 's4_rerate' : 's6_hour', ctx, [{ key: 'companion.s3.okay' }]);
    case 's3_breathe':
      return go(session, 's3_body', ctx, [{ key: 'companion.s3.welldone' }]);
    case 's3_body':
      return go(session, 's4_rerate', ctx, [], [], { body: answer });

    // Step 4: re-assess and decide
    case 's4_rerate': {
      const u = parseScale(input);
      if (u === undefined && !skipped) return go(session, 's4_rerate', ctx, [{ key: 'companion.scaleAgain' }]);
      if (u === undefined) return go(session, 's4_reach', ctx);
      const fx: Effect[] = [{ kind: 'craving', payload: { urge: u, craving: urgeToCraving(u) } }];
      const before = session.data.urge as number | undefined;
      // High or rising urge: put safety before skills (Step 7).
      if (u >= 8 || (before !== undefined && u > before)) return safety(session, ctx, [{ key: 'companion.s4.same' }], fx);
      const line: Msg =
        before === undefined ? { key: 'companion.s4.noted' } : u < before ? { key: 'companion.s4.lower', vars: { a: before, b: u } } : { key: 'companion.s4.same' };
      return go(session, 's4_reach', ctx, [line], fx, { urgeNow: u });
    }
    case 's4_reach':
      if (value === 'reach') return go(session, 's6_hour', ctx, [{ key: 'companion.s4.reachLine' }], [{ kind: 'showHandoff' }]);
      return go(session, 's6_hour', ctx, [{ key: 'companion.s4.smallest' }]);

    // Step 5: maintain and reinforce (when stable)
    case 's5_helping':
      return go(session, 's5_protect', ctx, [], [], { helping: answer });
    case 's5_protect':
      return go(session, 's5_risk', ctx, [], [], { protect: answer });
    case 's5_risk':
      if (value === 'nothing' || !answer) return go(session, 's5_win', ctx, [], [], { risk: '' });
      return go(session, 's5_prepare', ctx, [], [], { risk: answer });
    case 's5_prepare':
      return go(session, 's5_win', ctx, [], [], { prepare: answer });
    case 's5_win': {
      const d: Record<string, any> = { ...session.data, win: answer };
      return go(session, 'end', ctx, [{ key: 'companion.s5.close' }], [{ kind: 'maintain', payload: { helping: d.helping, protect: d.protect, risk: d.risk, prepare: d.prepare, win: d.win, happen: d.happen, steady: d.steady } }], { win: answer });
    }

    // Step 6: plan the next small step
    case 's6_hour': {
      const step = value?.startsWith('idea:') ? `@companion.s6.ideas.${value.slice(5)}` : answer;
      return go(session, 's6_who', ctx, [], [], { step });
    }
    case 's6_who': {
      const who = value?.startsWith('who:') ? (value === 'who:none' ? '' : value.slice(4)) : answer;
      return go(session, 's6_easier', ctx, [], [], { who });
    }
    case 's6_easier':
      return go(session, 's6_know', ctx, [], [], { easier: answer });
    case 's6_know': {
      const d: Record<string, any> = { ...session.data, know: answer };
      const pre: Msg[] = [];
      if (d.step) pre.push({ key: 'companion.s6.commit', vars: { step: d.step } });
      else pre.push({ key: 'companion.s6.commitNone' });
      if (d.who) pre.push({ key: 'companion.s6.whoLine', vars: { who: d.who } });
      return go(session, 'end', ctx, pre, [{ kind: 'plan', payload: { plan: d.step, who: d.who, easier: d.easier, know: d.know } }], { know: answer });
    }

    // Step 7: safety escalation
    case 's7_danger': {
      const yn = yesNo(input);
      if (yn === 'yes') return handoff(session, ctx, [{ kind: 'risk' }]);
      if (yn === 'no') return go(session, 's7_harm', ctx);
      return go(session, 's7_danger', ctx, [{ key: 'companion.s7.unsure' }]);
    }
    case 's7_harm': {
      const yn = yesNo(input);
      if (yn === 'yes') return handoff(session, ctx, [{ kind: 'risk' }]);
      if (yn === 'no') return go(session, 's7_with', ctx);
      return go(session, 's7_harm', ctx, [{ key: 'companion.s7.unsure' }]);
    }
    case 's7_with':
      return go(session, 's7_willing', ctx, [], [], { someoneWith: yesNo(input) });
    case 's7_willing': {
      const yn = yesNo(input);
      if (yn === 'yes') return handoff(session, ctx, []);
      return go(session, 's3_offer', ctx, [{ key: 'companion.s7.keepOpen' }]);
    }

    // Step 8: review after a slip (a slip is information, not a verdict)
    case 's8_warning':
      return go(session, 's8_missed', ctx, [], [], { warning: answer });
    case 's8_missed': {
      const missed = value?.startsWith('miss:') ? value.slice(5) : answer;
      return go(session, 's8_adjust', ctx, [], [], { missed });
    }
    case 's8_adjust':
      return go(session, 's8_well', ctx, [], [], { adjust: answer });
    case 's8_well': {
      const d: Record<string, any> = { ...session.data, well: answer };
      return go(session, 's6_hour', ctx, [{ key: 'companion.s8.saved' }], [{ kind: 'review', payload: { warning: d.warning, missed: d.missed, adjust: d.adjust, well: d.well } }], { well: answer });
    }

    // "I feel like a failure": self-compassion, then one unmet need, then one small step.
    case 'fail_friend':
      return go(session, 'fail_need', ctx, answer ? [{ key: 'companion.failure.kind' }] : [], [], { friend: answer });
    case 'fail_need':
      return go(session, 's6_hour', ctx, [{ key: 'companion.s4.smallest' }], [], { need: answer });

    // "Should I delete my dealer's number?": supportive planning plus an accountability contact.
    case 'dealer_safer':
      return go(session, 'dealer_who', ctx, [], [], { safer: answer });
    case 'dealer_who': {
      const who = value?.startsWith('who:') ? (value === 'who:none' ? '' : value.slice(4)) : answer;
      const pre: Msg[] = [{ key: 'companion.s6.commit', vars: { step: '@companion.dealer.step' } }];
      if (who) pre.push({ key: 'companion.s6.whoLine', vars: { who } });
      return go(session, 'end', ctx, pre, [{ kind: 'plan', payload: { plan: 'delete-number', who, easier: session.data.safer } }], { who });
    }

    // "I'm fine, I don't need help": leave the door open.
    case 'fine_end':
      if (value === 'check') return go(session, 's1_feel', ctx);
      return go(session, 'closed', ctx, [], [{ kind: 'close' }]);

    case 'end':
      if (value === 'done') return go(session, 'closed', ctx, [], [{ kind: 'close' }]);
      if (value === 'keep') return go(session, 's2_listen', ctx);
      return go(session, 's2_more', ctx, answer ? [{ key: 'companion.s2.reflect' }] : []);

    case 'closed':
    default:
      if (value === 'again') return go(session, 's1_feel', ctx);
      return go(session, 's2_more', ctx, answer ? [{ key: 'companion.s2.reflect' }] : []);
  }
}
