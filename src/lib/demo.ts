// "Try the demo": lets judges and visitors explore Serenity without signing up.
// Everything stays on this device. Demo data is never uploaded (sync and care-team calls
// skip demo mode) and "Exit demo" wipes it.
import { demoMessages, demoPeople } from './careDemo';
import { dayKey } from './dates';
import { initialState, TERMS_VERSION, type CheckIn, type DayLogEntry, type JournalEntry, type State } from './store';

export type DemoRole = 'member' | 'professional' | 'supporter';

const daysAgo = (n: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export function demoState(role: DemoRole, prev: State): State {
  const base = initialState();
  const lang = prev.language;
  const tn = lang === 'tn';
  const now = new Date().toISOString();
  const common: State = {
    ...base,
    demo: true,
    language: lang,
    languageChosen: true,
    appRole: role,
    settings: { ...prev.settings, appLock: false, pinHash: undefined },
    emergencyNumbers: prev.emergencyNumbers,
    account: { fullName: role === 'member' ? 'Thabo Demo' : role === 'professional' ? 'Mma Kgosi (Demo)' : 'Lesego (Demo)', email: 'demo@serenity.local', createdAt: now },
    loggedIn: true,
    termsVersionAccepted: TERMS_VERSION,
    consents: [
      { type: 'terms', version: TERMS_VERSION, granted: true, at: now },
      { type: 'data', version: TERMS_VERSION, granted: true, at: now },
    ],
  };

  if (role !== 'member') {
    return {
      ...common,
      onboarded: true,
      profile: { ...common.profile, preferredName: role === 'professional' ? 'Mma Kgosi' : 'Lesego' },
      care: {
        ...common.care,
        people: demoPeople(role, lang),
        messages: demoMessages(role, lang),
        proProfile: role === 'professional' ? { profession: tn ? 'Mogakolodi' : 'Counsellor', organisation: tn ? 'Sekao' : 'Demo clinic' } : undefined,
      },
    };
  }

  // A person in recovery, 23 days in, who had a hard day yesterday (strong craving), so the
  // escalation button shows orange with "What we noticed".
  const checkins: CheckIn[] = [];
  const dayLogs: Record<string, DayLogEntry> = {};
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i);
    const hard = i <= 2;
    checkins.push({
      id: `demo-halt-${i}`,
      type: 'halt',
      answers: { hunger: 0, anger: 0, loneliness: hard || i % 4 === 0 ? 1 : 0, tiredness: hard ? 2 : i % 3 === 0 ? 1 : 0 },
      at: d.toISOString(),
    });
    dayLogs[dayKey(d)] = {
      sleepHours: hard ? 6 : 7 + (i % 3) * 0.5,
      meals: hard ? 2 : 3,
      water: hard ? 4 : 6 + (i % 2),
      activityMins: hard ? 10 : 20 + (i % 4) * 5,
    };
  }
  checkins.push({
    id: 'demo-daily-1',
    type: 'daily',
    answers: {
      cravings: 'strong',
      support: 'needCoping',
      intention: tn ? 'Ke tla leletsa mogakolodi wa me mme ke tsamaye ka maoto fa ke tswa kwa tirong.' : 'I will call my counsellor and go for a walk after work.',
    },
    at: hoursAgo(30),
  });

  const journal: JournalEntry[] = [
    {
      id: 'demo-j1', at: daysAgo(9, 20).toISOString(), mood: 3,
      text: tn ? 'Malatsi a le lesome mme ke a ikutlwa ke le botoka. Ke robetse sentle maabane bosigo mme ke jele sefitlholo le bana.' : 'Ten days in and I feel stronger. I slept well last night and had breakfast with the kids.',
    },
    {
      id: 'demo-j2', at: daysAgo(5, 21).toISOString(), mood: 3,
      text: tn ? 'Ke ile kwa kopanong ya Labobedi. Go thusitse go utlwa batho ba bangwe ba bua dilo tse ke di utlwang.' : 'Went to the Tuesday meeting. It helped to hear other people say the same things I feel.',
    },
    {
      id: 'demo-j3', at: hoursAgo(28), mood: 1,
      text: tn ? 'Letsatsi le le thata kwa tirong. Ke ne ke akanya go nwa fa ke feta fa bareng. Ke ne ka leletsa kgaitsadiake mo boemong jwa moo.' : 'Hard day at work. I thought about drinking when I walked past the bar. I called my sister instead.',
    },
    {
      id: 'demo-j4', at: hoursAgo(3), mood: 2,
      text: tn ? 'Ke dirile thapelo ya go hema mme ke ikutlwa ke ritibetse go feta. Gompieno ke tla tsamaya ka maoto.' : 'Did the breathing exercise and feel calmer. Going for a walk today.',
    },
  ];

  return {
    ...common,
    onboarded: true,
    profile: {
      preferredName: 'Thabo',
      answers: {},
      supportNeeds: [],
      sixMonthVision: tn ? 'Dikgwedi di le thataro ke sa nwe, ke boetse kwa tirong, ke na le bana ba me ka Latshipi.' : 'Six months sober, back at work, and spending Sundays with my children.',
    },
    baseline: { feeling: 3, halt: [], craving: 0, sleepHours: 7, extended: {} },
    contacts: [
      { id: 'demo-c1', name: tn ? 'Mma Kgosi (mogakolodi)' : 'Mma Kgosi (counsellor)', role: 'counsellor', phone: '+267 7100 0000', isEmergency: true, consentLevel: 'alerts', lastReconfirmed: now },
      { id: 'demo-c2', name: tn ? 'Naledi (kgaitsadi)' : 'Naledi (sister)', role: 'family', phone: '+267 7200 0000', isEmergency: false, consentLevel: 'support', lastReconfirmed: now },
    ],
    approach: '12step',
    goals: [
      { id: 'substanceFree', progress: 40 },
      { id: 'wellbeing', progress: 55 },
      { id: 'relationships', progress: 30 },
    ],
    stepsDone: [1, 2],
    recoveryStart: daysAgo(23, 8).toISOString(),
    relapses: [{ at: daysAgo(23, 8).toISOString(), priorDays: 41 }],
    checkins,
    journal,
    dayLogs,
    appointments: [{ id: 'demo-a1', title: tn ? 'Kopano le Mma Kgosi' : 'Session with Mma Kgosi', when: `${dayKey(daysAgo(-3))} 10:00` }],
    // My plan, set up 12 days ago, so the weekly suggestion shows (a step up and an easier goal).
    habits: {
      createdAt: daysAgo(12, 9).toISOString(),
      items: [
        { id: 'checkin', target: 5 },
        { id: 'connect', target: 1 },
        { id: 'sleep', target: 7 },
        { id: 'meeting', target: 2 },
      ],
    },
    settings: { ...common.settings, reminders: true },
    activitiesDone: [
      { id: 'grounding', at: daysAgo(6, 18).toISOString(), feeling: 'better' },
      { id: 'walk', at: daysAgo(4, 17).toISOString(), feeling: 'better' },
      { id: 'box', at: hoursAgo(3), feeling: 'better' },
    ],
  };
}
