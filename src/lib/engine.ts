// Early-warning engine (Section 7). Pure TypeScript, no React Native imports,
// so it can be unit-tested with `npm test`.
//
// IMPORTANT: These are operational alert levels, not diagnoses or validated
// risk scores. All thresholds live in RULES so a clinician can review and
// change them. Every level change stores its reasons.

export type Level = 'green' | 'amber' | 'red';

export const RULES = {
  version: '0.1-draft-awaiting-clinical-review',
  /** Sum of the 8 balance answers (0-2 each, max 16) at or above which we go Amber. */
  amberScore: 6,
  /** A score in this band on a single day is an "ordinary difficult day" (stays Green). */
  hardDayScore: 3,
  /** Number of recent checks (out of patternWindow) at or above hardDayScore that make a pattern. */
  patternCount: 3,
  patternWindow: 5,
  /** Hours below the person's baseline sleep that count as a deviation. */
  sleepDeviationHours: 2,
};

/** Balance answers: index 0..2 for each of q1..q8 (q8: 0 = safe, 1 = uncertain, 2 = not safe). */
export type BalanceAnswers = [number, number, number, number, number, number, number, number];

export type Evaluation = { level: Level; reasons: string[]; score: number; needsSafetyQuestion: boolean; hardDay: boolean };

const REASON_KEYS = ['isolation', 'missed', 'anger', 'cravings', 'sleepEat', 'hiding', 'exposure'];

export function evaluateBalance(
  answers: BalanceAnswers,
  history: { score: number }[] = [],
  opts: { safetyDisclosure?: boolean; sleepHours?: number; baselineSleep?: number } = {},
): Evaluation {
  const reasons: string[] = [];
  const score = answers.reduce((a, b) => a + b, 0);

  // RED only on direct disclosure of risk of harm. Never on scores alone.
  if (opts.safetyDisclosure) {
    return { level: 'red', reasons: ['disclosure'], score, needsSafetyQuestion: false, hardDay: false };
  }

  answers.slice(0, 7).forEach((v, i) => {
    if (v > 0) reasons.push(REASON_KEYS[i]);
  });
  if (answers[6] === 2) reasons.push('activeReturn');
  if (answers[3] === 2) reasons.splice(reasons.indexOf('cravings'), 1, 'severeCraving');
  if (answers[7] === 1) reasons.push('uncertainSafe');
  if (answers[7] === 2) reasons.push('unsafe');
  if (
    opts.sleepHours !== undefined &&
    opts.baselineSleep !== undefined &&
    opts.baselineSleep - opts.sleepHours >= RULES.sleepDeviationHours
  ) {
    reasons.push('belowBaselineSleep');
  }

  const recent = history.slice(-(RULES.patternWindow - 1));
  const recentHard = recent.filter((h) => h.score >= RULES.hardDayScore).length + (score >= RULES.hardDayScore ? 1 : 0);
  const pattern = recentHard >= RULES.patternCount;
  if (pattern) reasons.push('pattern');

  const amber =
    score >= RULES.amberScore ||
    answers[6] === 2 || // actively returned to triggers
    answers[3] === 2 || // strong urges
    answers[7] >= 1 || // not sure they feel safe, or do not
    pattern;

  if (amber) {
    return { level: 'amber', reasons, score, needsSafetyQuestion: answers[7] === 2, hardDay: false };
  }
  const hardDay = score >= RULES.hardDayScore;
  return { level: 'green', reasons: hardDay ? [...reasons, 'hardDay'] : reasons, score, needsSafetyQuestion: false, hardDay };
}

/** Missing check-ins NEVER escalate. They only produce a kind nudge. */
export function missedCheckinNudge(lastCheckinISO: string | undefined, now = new Date()): boolean {
  if (!lastCheckinISO) return false;
  return now.getTime() - new Date(lastCheckinISO).getTime() > 36 * 3600 * 1000;
}

// ---------- Crisis language detection (English + Setswana + code-switching) ----------
// DRAFT LISTS. Must be reviewed by fluent speakers and clinicians (Section 8.7).
// We err on the side of offering help: a match only OFFERS support, the user can dismiss.
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)? myself\b/i,
  /\bend(ing)? (my|it all|my life)\b/i,
  /\bsuicid/i,
  /\bwant(ed)? to die\b/i,
  /\bbetter off dead\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bself[- ]?harm/i,
  /\boverdos/i,
  /\bno reason to live\b/i,
  /\bcan'?t go on\b/i,
  /\bhurt (someone|somebody|him|her|them)\b/i,
  /\bkill (someone|somebody|him|her|them)\b/i,
  /\btake my (own )?life\b/i,
  /\b(don'?t|do not) want to (live|be alive|be here( anymore)?|wake up)\b/i,
  /\bwish i (was|were) dead\b/i,
  /\bnothing (left )?to live for\b/i,
  /\bend (it|everything) (all|tonight|now)\b/i,
  /\bhang myself\b/i,
  /\bjump (off|in front)\b/i,
  /\bcut(ting)? myself\b/i,
  /\bgoodbye (forever|everyone)\b/i,
  /\bnot safe\b/i,
  // Setswana (draft, needs review)
  /\bga ke batle go tshela\b/i, // I don't want to live
  /\bke tla ipolaya\b/i, // I will kill myself
  /\bke batla go ikgobatsa\b/i, // I want to hurt myself
  /\bipolaya\b/i, // to kill oneself
  /\bke batla go swa\b/i, // I want to die
  /\bke ikutlwisa botlhoko\b/i, // I hurt myself
];

const LOW_MOOD_PATTERNS: RegExp[] = [
  /\bcry(ing)?\b/i,
  /\bcan'?t sleep\b/i,
  /\bdon'?t seem to get much sleep\b/i,
  /\bhopeless\b/i,
  /\bworthless\b/i,
  /\balone\b/i,
  /\bempty\b/i,
  /\bexhausted\b/i,
  /\bheavy\b/i,
  /\bke hutsafetse\b/i, // I am sad (draft)
  /\bgive up\b/i,
  /\bnobody cares\b/i,
  /\bwhat'?s the point\b/i,
  /\bcan'?t do this anymore\b/i,
  /\bke latlhegetswe ke tsholofelo\b/i, // I have lost hope (draft)
];

const CRAVING_PATTERNS: RegExp[] = [
  /\b(going|want|need|about) to (use|drink|get high|smoke)\b/i,
  /\bstrong (craving|urge)\b/i,
  /\bcan'?t stop thinking about (using|drinking)\b/i,
  /\bcall(ed|ing)? my dealer\b/i,
  /\bke batla go nwa\b/i, // I want to drink
  /\bke batla go dirisa\b/i, // I want to use
];

/** Strong craving language (counts like a strong craving check-in). */
export function scanCraving(text: string): boolean {
  return !!text && CRAVING_PATTERNS.some((r) => r.test(text));
}

export type TextSignal = 'crisis' | 'lowMood' | 'none';

export function scanText(text: string): TextSignal {
  if (!text) return 'none';
  if (CRISIS_PATTERNS.some((r) => r.test(text))) return 'crisis';
  if (LOW_MOOD_PATTERNS.some((r) => r.test(text))) return 'lowMood';
  return 'none';
}

// ---------- HALT insight ----------
export type HaltAnswer = 0 | 1 | 2 | undefined; // No, A little, Yes
export type HaltAnswers = { hunger?: HaltAnswer; anger?: HaltAnswer; loneliness?: HaltAnswer; tiredness?: HaltAnswer };

export function haltFlags(a: HaltAnswers): (keyof HaltAnswers)[] {
  return (['hunger', 'anger', 'loneliness', 'tiredness'] as const).filter((k) => (a[k] ?? 0) > 0);
}

export function joinList(items: string[], and = 'and'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

// ---------- Wellbeing score ----------
export type DayLog = { sleepHours?: number; meals?: number; water?: number; activityMins?: number };

export function wellbeingScore(input: {
  moodIndex?: number; // 0 (stressed) .. 4 (great)
  day?: DayLog;
  craving?: number; // 0 none, 1 moderate, 2 strong
}): { score: number | null; parts: Record<string, number> } {
  const parts: Record<string, number> = {};
  if (input.moodIndex !== undefined) parts.mood = input.moodIndex / 4;
  const d = input.day ?? {};
  if (d.sleepHours !== undefined) {
    const s = d.sleepHours;
    parts.sleep = s >= 7 && s <= 9 ? 1 : s >= 6 || s === 10 ? 0.7 : s >= 5 ? 0.4 : 0.15;
  }
  if (d.meals !== undefined) parts.nutrition = Math.min(d.meals, 4) / 4;
  if (d.water !== undefined) parts.hydration = Math.min(d.water, 8) / 8;
  if (d.activityMins !== undefined) parts.activity = Math.min(d.activityMins, 30) / 30;
  if (input.craving !== undefined) parts.cravings = 1 - input.craving / 2;
  const vals = Object.values(parts);
  if (!vals.length) return { score: null, parts };
  return { score: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100), parts };
}

export function scoreMessageKey(score: number | null): 'none' | 'high' | 'mid' | 'low' {
  if (score === null) return 'none';
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

// ---------- Pattern recognition (plain language) ----------
export type CravingPoint = { at: string; craving: number; sleepHours?: number };

export function cravingPeakDay(points: CravingPoint[]): number | null {
  const strong = points.filter((p) => p.craving >= 1);
  if (strong.length < 3) return null;
  const counts = new Array(7).fill(0);
  strong.forEach((p) => counts[new Date(p.at).getDay()]++);
  const max = Math.max(...counts);
  const idx = counts.indexOf(max);
  return max >= 2 && counts.filter((c) => c === max).length === 1 ? idx : null;
}

export function sleepCravingLink(points: CravingPoint[]): boolean {
  const withSleep = points.filter((p) => p.sleepHours !== undefined);
  if (withSleep.length < 5) return false;
  const short = withSleep.filter((p) => (p.sleepHours as number) < 6);
  const ok = withSleep.filter((p) => (p.sleepHours as number) >= 6);
  if (short.length < 2 || ok.length < 2) return false;
  const avg = (xs: CravingPoint[]) => xs.reduce((a, p) => a + p.craving, 0) / xs.length;
  return avg(short) - avg(ok) >= 0.5;
}

// ---------- Centre logo escalation button ----------
// The Serenity logo in the tab bar is the escalation button.
//   normal : blue (navy) button with a white logo. Tap for quick actions.
//   orange : signs that the person needs ATTENTION. Tap for gentle support.
//   pink   : signs are building up: CONCERN. Tap for support and a check-in.
//   red    : signs that the person needs INTERVENTION now. Tap to reach their psychologist,
//            counsellor or emergency help straight away.
// Signs from the person's own data add points. Some signs go straight to red: a Red level
// (the person said they may be at risk), crisis language in anything they wrote, or a relapse
// in the last 24 hours. All weights are here so the clinical lead can review and change them.
// "I'm alright now" (after two safety questions) clears every sign up to that moment, so the
// button goes back to blue. Any new sign after that counts again.
export const LOGO_RULES = {
  /** A day counts as "missed" when fewer than this many Today's Focus tasks were done. */
  minTasksPerDay: 2,
  /** Points that turn the logo orange / pink / red. */
  orangePoints: 2,
  pinkPoints: 4,
  redPoints: 5,
  /** How far back signs count, in hours. */
  windowHours: 48,
  /** Crisis language turns the button red straight away for this many hours. */
  crisisWordsHours: 24,
  points: {
    amberCheckin: 2, // a Balance Check came out Amber in the last 72 hours
    missed2Days: 2, // Today's Focus mostly missed 2 days running
    missed3Days: 3, // ... 3 or more days running
    strongCraving: 2,
    worryingWords: 3, // crisis language in journal, check-in or chat text (also goes straight to red)
    emergencyOpened: 3, // opened the "I'm not safe" screen in the last 24 hours
    missedAppointment: 1,
    heavyHalt: 1, // 3 or more of Hungry, Angry, Lonely, Tired
    lowMoodWords: 1,
    lowMoodRepeated: 1, // stressed or anxious mood logged twice
    shortSleep: 1, // 2+ hours below their usual, or under 5 hours
    lowWellbeing: 1, // wellbeing score under 40%
  },
  /** Product-owner switch: let missed tasks alone turn the logo red (needs clinical sign-off). */
  redFromMissedTasksAlone: false,
  redMissedDays: 3,
};

export type LogoState = 'normal' | 'orange' | 'pink' | 'red';
export type SignalKind = keyof typeof LOGO_RULES.points | 'disclosure' | 'relapse';
export type Signal = { kind: SignalKind; at: string };

export function logoState(input: {
  levels: { level: Level; at: string }[];
  missedTaskDays: number;
  signals?: Signal[];
  relapses?: { at: string }[];
  /** When the person last confirmed "I'm alright now". Signs from before this are cleared. */
  allClearAt?: string;
  now?: Date;
}): { state: LogoState; reasons: SignalKind[]; points: number } {
  const now = (input.now ?? new Date()).getTime();
  const clear = input.allClearAt ? new Date(input.allClearAt).getTime() : -Infinity;
  const fresh = (iso: string) => new Date(iso).getTime() > clear;
  const within = (iso: string, hours: number) => {
    const t = now - new Date(iso).getTime();
    return t >= -60000 && t <= hours * 3600000 && fresh(iso);
  };
  const P = LOGO_RULES.points;
  const signals = (input.signals ?? []).filter((x) => fresh(x.at));

  // Immediate intervention: a Red level (direct disclosure), crisis language, or a relapse in the last 24 hours.
  if (input.levels.some((l) => l.level === 'red' && within(l.at, 24))) return { state: 'red', reasons: ['disclosure'], points: 99 };
  if (signals.some((x) => x.kind === 'worryingWords' && within(x.at, LOGO_RULES.crisisWordsHours))) return { state: 'red', reasons: ['worryingWords'], points: 99 };
  if ((input.relapses ?? []).some((r) => within(r.at, 24))) return { state: 'red', reasons: ['relapse'], points: 99 };

  let points = 0;
  const reasons: SignalKind[] = [];
  const add = (k: SignalKind, n: number) => {
    points += n;
    if (!reasons.includes(k)) reasons.push(k);
  };
  if (input.levels.some((l) => l.level === 'amber' && within(l.at, 72))) add('amberCheckin', P.amberCheckin);
  if (input.missedTaskDays >= 3) add('missed3Days', P.missed3Days);
  else if (input.missedTaskDays >= 2) add('missed2Days', P.missed2Days);
  const counted: Record<string, number> = {};
  for (const sgl of signals) {
    const w = (P as Record<string, number>)[sgl.kind];
    if (!w || !within(sgl.at, LOGO_RULES.windowHours)) continue;
    counted[sgl.kind] = (counted[sgl.kind] ?? 0) + 1;
    if (counted[sgl.kind] > 2) continue; // the same sign can count at most twice
    add(sgl.kind, w);
  }

  const missedOnlyRed = LOGO_RULES.redFromMissedTasksAlone && input.missedTaskDays >= LOGO_RULES.redMissedDays;
  if (points >= LOGO_RULES.redPoints || missedOnlyRed) return { state: 'red', reasons, points };
  if (points >= LOGO_RULES.pinkPoints) return { state: 'pink', reasons, points };
  if (points >= LOGO_RULES.orangePoints) return { state: 'orange', reasons, points };
  return { state: 'normal', reasons, points };
}
