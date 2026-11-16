// Serenity Session Assistant: the safe, testable core of the AI agent for counsellors.
//
// Responsible-AI design:
//  * Data minimisation: the model only ever sees numbers and fixed codes (trends, warning-sign
//    codes, goal ids, days in recovery). Never the person's name, journal, messages or any
//    free text, so nothing personal can leak and nothing can be injected into the prompt.
//  * Human in the loop: the output is a DRAFT for the counsellor, never shown to the client
//    unless the counsellor edits and saves it into the care plan themselves.
//  * Fixed safety lines: anything about red alerts and crisis comes from fixed text here,
//    never from the model.
//  * Output is validated: only the expected fields, limited lengths and counts.
// Pure TypeScript (no Deno or React Native APIs) so it runs in the Edge Function and in tests.

export type Lang = 'en' | 'tn';
export type Colour = 'normal' | 'orange' | 'pink' | 'red';

export const REASONS: Record<string, string> = {
  amberCheckin: 'a recent balance check showed them off balance',
  missed2Days: 'daily tasks slipped for 2 days',
  missed3Days: 'daily tasks slipped for 3 or more days',
  strongCraving: 'strong cravings',
  worryingWords: 'writing that suggested they may be in pain (crisis language)',
  emergencyOpened: 'opened emergency help recently',
  missedAppointment: 'a missed appointment',
  heavyHalt: 'often hungry, angry, lonely or tired',
  lowMoodWords: 'low-mood language in their writing',
  lowMoodRepeated: 'stressed or anxious mood logged more than once',
  shortSleep: 'less sleep than usual',
  lowWellbeing: 'a low wellbeing score',
  disclosure: 'told the app they may be at risk of harm',
  relapse: 'reported a relapse',
};

export const GOALS: Record<string, string> = {
  substanceFree: 'staying substance-free',
  relationships: 'rebuilding relationships',
  wellbeing: 'physical and mental wellbeing',
  lifeSkills: 'life skills',
  community: 'community and belonging',
  opportunities: 'work and education opportunities',
};

export type SafeDay = { day: number; mood?: number; craving?: number; sleep?: number; score?: number; checkedIn: boolean };
export type SafeInput = {
  lang: Lang;
  days?: number;
  colour?: Colour;
  reasons: string[];
  trends: SafeDay[];
  goals: { goal: string; progress: number }[];
  relapses30?: number;
};

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === 'number' ? v : Number.NaN;
  if (!Number.isFinite(n)) return undefined;
  return Math.round(Math.min(max, Math.max(min, n)) * 10) / 10;
};

/** Keep only numbers and known codes from a shared summary. Everything else is dropped. */
export function sanitize(summary: any, lang: string): SafeInput {
  const s = summary && typeof summary === 'object' ? summary : {};
  const colours: Colour[] = ['normal', 'orange', 'pink', 'red'];
  const trends: SafeDay[] = (Array.isArray(s.trends) ? s.trends : []).slice(-14).map((d: any, i: number, arr: any[]) => ({
    day: i - (arr.length - 1),
    mood: num(d?.mood, 0, 4),
    craving: num(d?.craving, 0, 2),
    sleep: num(d?.sleep, 0, 16),
    score: num(d?.score, 0, 100),
    checkedIn: d?.checkedIn === true,
  }));
  return {
    lang: lang === 'tn' ? 'tn' : 'en',
    days: num(s.days, 0, 20000),
    colour: colours.includes(s.logo) ? s.logo : undefined,
    reasons: (Array.isArray(s.reasons) ? s.reasons : []).filter((r: unknown) => typeof r === 'string' && r in REASONS).slice(0, 12),
    trends,
    goals: (Array.isArray(s.goals) ? s.goals : [])
      .filter((g: any) => g && typeof g.id === 'string' && g.id in GOALS)
      .slice(0, 6)
      .map((g: any) => ({ goal: GOALS[g.id], progress: num(g.progress, 0, 100) ?? 0 })),
    relapses30: num(s.relapses30, 0, 100),
  };
}

export function hasEnoughData(i: SafeInput) {
  return i.trends.length >= 3 || i.reasons.length > 0;
}

/** The instruction sent to the model. Plain data in, a fixed JSON shape out. */
export function buildPrompt(i: SafeInput): string {
  const language = i.lang === 'tn' ? 'Setswana (simple, everyday Setswana as spoken in Botswana)' : 'plain English';
  const data = {
    daysInRecovery: i.days,
    escalationColour: i.colour,
    warningSigns: i.reasons.map((r) => REASONS[r]),
    last14Days: i.trends,
    scales: 'mood 0 (very low) to 4 (great); craving 0 (none) to 2 (strong); sleep in hours; score is a 0 to 100 wellbeing score; day 0 is today, -1 yesterday',
    goals: i.goals,
    relapsesLast30Days: i.relapses30,
  };
  return [
    'You help an addiction-recovery counsellor prepare for a session with their client.',
    'You only see anonymous numbers and warning-sign labels. You do not know the client and must not invent facts, events, causes or diagnoses.',
    'Rules: no diagnosis, no medication or dosage advice, no judgement or blame, recovery-positive language, treat a slip as experience to learn from.',
    'Point to patterns in the numbers (for example sleep falling while cravings rise) and say they are possibilities to explore with the client, not conclusions.',
    `Write in ${language}. Keep every item to one short sentence.`,
    'Return ONLY JSON with exactly these keys:',
    '{"changes": [2 to 4 items: what changed over the 14 days], "watch": [1 to 3 items: signs to explore in the session], "talkingPoints": [3 open, non-judgemental questions the counsellor could ask], "planGoals": [2 or 3 small, achievable goals for the next two weeks], "homework": "one small practical task"}',
    `Client data: ${JSON.stringify(data)}`,
  ].join('\n');
}

export type Draft = { changes: string[]; watch: string[]; talkingPoints: string[]; planGoals: string[]; homework: string };

const BLOCKED = /\b(mg|milligram|dose|dosage|prescri|diagnos)/i;
const clean = (v: unknown, max = 220) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const list = (v: unknown, n: number) =>
  (Array.isArray(v) ? v : [])
    .map((x) => clean(x))
    .filter((x) => x && !BLOCKED.test(x))
    .slice(0, n);

/** Parse and validate the model's answer. Returns null if it is not usable. */
export function parseDraft(text: string): Draft | null {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let raw: any;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const homework = clean(raw?.homework, 240);
  const d: Draft = {
    changes: list(raw?.changes, 4),
    watch: list(raw?.watch, 3),
    talkingPoints: list(raw?.talkingPoints, 3),
    planGoals: list(raw?.planGoals, 3),
    homework: BLOCKED.test(homework) ? '' : homework,
  };
  return d.changes.length || d.talkingPoints.length ? d : null;
}

/** Fixed safety guidance, never written by the model. */
export function safetyNote(i: SafeInput): string | undefined {
  const crisis = i.reasons.includes('worryingWords') || i.reasons.includes('disclosure') || i.reasons.includes('emergencyOpened');
  if (i.colour === 'red' || crisis)
    return i.lang === 'tn'
      ? 'Tlhokomelo: konopo e khibidu kgotsa go na le dipontsho tsa kotsi. Ikgolaganye le motho yo o mo thusang gompieno mme o latele tsamaiso ya tshoganyetso ya tirelo ya gago. Sena ga se emele maemo a tshoganyetso.'
      : 'Safety first: the button is red or there are risk signs. Contact your client today and follow your service\'s crisis protocol. This draft does not replace an urgent response.';
  return undefined;
}
