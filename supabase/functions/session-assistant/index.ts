// Edge Function: Serenity Session Assistant (AI agent for counsellors).
//
// A counsellor taps "Prepare my session". This function:
//  1. checks the caller is an active, non-suspended counsellor on that link,
//  2. loads the client's shared summary (the same filtered data the counsellor already sees),
//  3. strips it down to numbers and fixed codes (core.ts: no name, no journal, no free text),
//  4. asks Gemini for a draft, validates it, and adds fixed safety lines; if the AI cannot be
//     reached for any reason it returns a built-in draft from fixed rules, clearly labelled,
//     (only if the admin team has not switched the assistant off; every request's outcome is counted),
//  5. returns a DRAFT the counsellor reviews and edits. Nothing is sent to the client.
//
// Demo mode ("Try the demo", no account): accepts the built-in sample summary instead of a
// link, with the same stripping, so judges can see the real model working.
//
// Setup (once):
//   npx supabase secrets set GEMINI_API_KEY=your-key-from-google-ai-studio
//   npx supabase functions deploy session-assistant
// Optional: npx supabase secrets set GEMINI_MODEL=model-name
// This file is self-contained (one file deploys reliably). The block between the CORE markers is
// copied from core.ts by `npm run build:ai`; edit core.ts, not this block. A test checks they match.
import { createClient } from 'npm:@supabase/supabase-js@2';

// ---- BEGIN CORE (generated from core.ts) ----
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

export const REASONS_TN: Record<string, string> = {
  amberCheckin: 'tlhatlhobo ya tekatekano ya bosheng e bontshitse fa a sa tekatekana',
  missed2Days: 'ditiro tsa letsatsi le letsatsi ga di a dirwa ka malatsi a le 2',
  missed3Days: 'ditiro tsa letsatsi le letsatsi ga di a dirwa ka malatsi a le 3 kgotsa go feta',
  strongCraving: 'dikeletso tse di maatla',
  worryingWords: 'mafoko a a bontshang gore a ka tswa a le mo botlhokong (puo ya tshoganyetso)',
  emergencyOpened: 'o butse thuso ya tshoganyetso bosheng',
  missedAppointment: 'kopano e e tlodilweng',
  heavyHalt: 'gantsi o na le tlala, bogale, bodutu kgotsa letsapa',
  lowMoodWords: 'mafoko a maikutlo a a kwa tlase mo dikwalong',
  lowMoodRepeated: 'kgatelelo kgotsa letshogo di kwadilwe go feta gangwe',
  shortSleep: 'boroko jo bo kwa tlase ga jo bo tlwaelegileng',
  lowWellbeing: 'maduo a boitekanelo a a kwa tlase',
  disclosure: 'o boleletse app gore a ka nna mo kotsing',
  relapse: 'o begile go wela gape',
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
  const noData = !hasEnoughData(i);
  return [
    'You help an addiction-recovery counsellor prepare for a session with their client.',
    noData
      ? 'There is little or no shared data yet (a new client, or they have not checked in). Prepare a warm first or early session instead: what to learn about the client, gentle questions, and simple first goals. Say clearly that there is not enough data to see trends.'
      : 'Use the shared data below.',
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


const avg = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Built-in draft made by fixed rules, used when the AI cannot be reached (no key, network or model
 * error). It is always labelled as built-in, never as AI. Works with no data at all.
 */
export function fallbackDraft(i: SafeInput): Draft {
  const tn = i.lang === 'tn';
  const L = (en: string, tsw: string) => (tn ? tsw : en);
  if (!hasEnoughData(i)) {
    return {
      changes: [L('No check-ins have been shared yet, so there are no trends to compare.', 'Ga go ise go abelanwe ditlhatlhobo, ka jalo ga go na ditlhagiso tse di ka bapisiwang.')],
      watch: [L('How they are settling into recovery and into using Serenity.', 'Ka moo ba tlwaelang go fola le go dirisa Serenity ka teng.')],
      talkingPoints: [
        L('What would make the next two weeks feel like a good start?', 'Ke eng se se ka dirang gore dibeke tse pedi tse di tlang e nne tshimologo e e siameng?'),
        L('What usually helps you on a hard day?', 'Ke eng se gantsi se go thusang mo letsatsing le le thata?'),
        L('Who supports you right now, and who could you call?', 'Ke mang yo o go tshegetsang jaanong, mme o ka leletsa mang?'),
      ],
      planGoals: [
        L('Do a short check-in on Serenity once a day.', 'Dira tlhatlhobo e khutshwane mo Serenity gangwe ka letsatsi.'),
        L('Choose one support person to contact on hard days.', 'Tlhopha motho a le mongwe wa tshegetso yo o tla mo ikgolaganyang le ene mo malatsing a a thata.'),
      ],
      homework: L('Try the HALT check-in each day until the next session.', 'Leka tlhatlhobo ya HALT letsatsi le letsatsi go fitlha kopanong e e latelang.'),
    };
  }
  const t = i.trends;
  const half = Math.max(1, Math.floor(t.length / 2));
  const a = t.slice(0, half);
  const b = t.slice(half);
  const m1 = avg(a.map((d) => d.mood)), m2 = avg(b.map((d) => d.mood));
  const c1 = avg(a.map((d) => d.craving)), c2 = avg(b.map((d) => d.craving));
  const s1 = avg(a.map((d) => d.sleep)), s2 = avg(b.map((d) => d.sleep));
  const checked = t.filter((d) => d.checkedIn).length;
  const changes: string[] = [];
  let moodDown = false, cravUp = false, sleepDown = false;
  if (m1 !== undefined && m2 !== undefined) {
    const d = m2 - m1;
    moodDown = d <= -0.5;
    changes.push(
      d >= 0.5
        ? L(`Mood has improved, from about ${r1(m1 + 1)} to ${r1(m2 + 1)} out of 5.`, `Maikutlo a tokafetse, go tswa go ${r1(m1 + 1)} go ya go ${r1(m2 + 1)} mo go 5.`)
        : moodDown
          ? L(`Mood has dropped, from about ${r1(m1 + 1)} to ${r1(m2 + 1)} out of 5.`, `Maikutlo a wetse, go tswa go ${r1(m1 + 1)} go ya go ${r1(m2 + 1)} mo go 5.`)
          : L(`Mood has been steady at about ${r1(m2 + 1)} out of 5.`, `Maikutlo a ntse a tsepame mo go ${r1(m2 + 1)} mo go 5.`),
    );
  }
  if (c1 !== undefined && c2 !== undefined) {
    cravUp = c2 - c1 >= 0.4 || c2 >= 1.5;
    changes.push(
      cravUp
        ? L('Cravings have been stronger in the most recent days.', 'Dikeletso di nnile di le maatla mo malatsing a bosheng.')
        : c2 < c1 - 0.3
          ? L('Cravings have eased compared with earlier.', 'Dikeletso di fokotsegile fa di bapisiwa le pele.')
          : L('Cravings have stayed at a similar level.', 'Dikeletso di nnile mo selekanyong se se tshwanang.'),
    );
  }
  if (s1 !== undefined && s2 !== undefined) {
    sleepDown = s2 < s1 - 0.7 || s2 < 5.5;
    changes.push(
      sleepDown
        ? L(`Sleep has fallen to about ${r1(s2)} hours a night.`, `Boroko bo fokotsegile go ka nna diura di le ${r1(s2)} ka bosigo.`)
        : L(`Sleep has been about ${r1(s2)} hours a night.`, `Boroko bo nnile go ka nna diura di le ${r1(s2)} ka bosigo.`),
    );
  }
  changes.push(L(`Checked in on ${checked} of the last ${t.length} days.`, `O tlhotse mo malatsing a le ${checked} mo go a le ${t.length} a a fetileng.`));

  const watch = i.reasons.slice(0, 3).map((r) => L(`Warning sign: ${REASONS[r]}.`, `Pontsho ya temoso: ${REASONS_TN[r] ?? REASONS[r]}.`));
  if (cravUp && sleepDown) watch.push(L('Whether shorter sleep and stronger cravings are linked.', 'Fa e le gore boroko jo bo khutshwane le dikeletso tse di maatla di a amana.'));
  if (!watch.length) watch.push(L('No warning signs in the shared data: explore what is helping.', 'Ga go na dipontsho tsa temoso: sekaseka se se thusang.'));

  const talk: string[] = [];
  if (moodDown) talk.push(L('What has felt hardest recently?', 'Ke eng se se nnileng thata thata bosheng?'));
  if (cravUp) talk.push(L('When cravings came, what was happening just before?', 'Fa dikeletso di tla, go ne go diragala eng pele ga moo?'));
  if (sleepDown) talk.push(L('How have the nights been lately?', 'Masigo a ntse jang bosheng?'));
  talk.push(L('What has gone well that you want to keep doing?', 'Ke eng se se tsamaileng sentle se o batlang go tswelela ka sone?'));
  talk.push(L('Who could you lean on this week?', 'O ka ikaega ka mang beke eno?'));

  const goals: string[] = [];
  if (cravUp) goals.push(L('Use urge surfing or a breathing exercise when a craving starts.', 'Dirisa go palama kgatelelo kgotsa thapelo ya go hema fa keletso e simolola.'));
  if (sleepDown) goals.push(L('Keep a regular bedtime on most nights.', 'Nna le nako e e tlwaelegileng ya go robala mo masigong a mantsi.'));
  if (checked < Math.ceil(t.length / 2)) goals.push(L('Check in on Serenity once a day.', 'Dira tlhatlhobo mo Serenity gangwe ka letsatsi.'));
  goals.push(L('Plan one healthy activity each day.', 'Rulaganya tiro e le nngwe e e itekanetseng letsatsi le letsatsi.'));

  return {
    changes: changes.slice(0, 4),
    watch: watch.slice(0, 3),
    talkingPoints: talk.slice(0, 3),
    planGoals: goals.slice(0, 3),
    homework: L('Each day, write down one moment when a craving or hard feeling passed.', 'Letsatsi le letsatsi, kwala nako e le nngwe fa keletso kgotsa maikutlo a a thata a fetile.'),
  };
}
// ---- END CORE ----

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

// Small in-memory rate limit per caller: 20 drafts an hour (demo: 6 an hour per address).
const calls = new Map<string, number[]>();
function allowed(key: string, max: number) {
  const now = Date.now();
  const recent = (calls.get(key) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= max) return false;
  recent.push(now);
  calls.set(key, recent);
  return true;
}

// Newest first; the first that answers is used. GEMINI_MODEL overrides.
const MODELS = [Deno.env.get('GEMINI_MODEL'), 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[];

async function askGemini(prompt: string, key: string): Promise<{ text: string; model: string } | null> {
  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1200, responseMimeType: 'application/json' },
      }),
    }).catch(() => null);
    if (!res) continue;
    if (res.status === 404 || res.status === 400) continue; // model name not available: try the next
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
    if (text) return { text, model };
  }
  return null;
}

Deno.serve(async (req: Request) => {
  try {
    return await handle(req);
  } catch {
    // Never crash: the app then makes its built-in draft.
    return json({ error: 'server' }, 500);
  }
});

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const key = Deno.env.get('GEMINI_API_KEY');

  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const lang = body?.lang === 'tn' ? 'tn' : 'en';
  let summary: unknown;
  let limited = false;
  const demo = !body?.linkId;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Oversight: one row per request with the outcome only (nothing personal), shown on the
  // admin site's AI oversight page.
  const log = (outcome: string, model: string | null = null) =>
    admin.from('ai_usage').insert({ demo, outcome, model, lang, ms: Math.min(600000, Date.now() - started) }).then(() => {}, () => {});
  const fail = async (error: string, status: number) => {
    await log(error);
    return json({ error }, status);
  };

  // Admins and clinicians can switch the assistant off instantly from the admin site.
  const { data: setting } = await admin.from('app_settings').select('value').eq('key', 'ai_assistant').maybeSingle();
  if (setting?.value?.enabled === false) return fail('disabled', 503);

  if (typeof body?.linkId === 'string') {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return fail('signed_out', 401);
    if (!allowed(who.user.id, 20)) limited = true;

    const { data: link } = await admin.from('care_links').select('id, role, viewer_id, status').eq('id', body.linkId).maybeSingle();
    if (!link || link.viewer_id !== who.user.id || link.role !== 'professional' || link.status !== 'active') return fail('forbidden', 403);
    const { data: prof } = await admin.from('care_profiles').select('review_status').eq('user_id', who.user.id).maybeSingle();
    if (prof?.review_status === 'suspended') return fail('forbidden', 403);

    const { data: shared } = await admin.from('shared_summaries').select('payload').eq('link_id', link.id).maybeSingle();
    summary = shared?.payload;
  } else if (body?.demoSummary && typeof body.demoSummary === 'object') {
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    const demoLimited = !allowed(`demo:${ip}`, 30);
    if (demoLimited) limited = true;
    summary = body.demoSummary;
  } else {
    return fail('bad_request', 400);
  }

  const input = sanitize(summary, lang);
  const reply = (draft: Draft, source: 'ai' | 'builtin', model: string | null, note?: string) =>
    json({ draft, source, model, note, safety: safetyNote(input), demo, at: new Date().toISOString() });

  // Built-in draft whenever the AI cannot be used: no key, hourly limit reached, or the model failed.
  if (!key || limited) {
    await log(limited ? 'rate' : 'model_unavailable');
    return reply(fallbackDraft(input), 'builtin', null, limited ? 'rate' : 'not_configured');
  }
  const answer = await askGemini(buildPrompt(input), key).catch(() => null);
  const draft = answer ? parseDraft(answer.text) : null;
  if (!draft) {
    await log('model_unavailable');
    return reply(fallbackDraft(input), 'builtin', null, 'model_unavailable');
  }
  await log('ok', answer!.model);
  return reply(draft, 'ai', answer!.model);
}
