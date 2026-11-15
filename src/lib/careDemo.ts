// Sample people so counsellors and supporters can see every screen before a real invite
// (and when the app runs without a backend). Clearly marked "Sample" in the app.
import type { CareMessage, LinkedPerson } from './store';
import { buildSummary, type Snapshot, type TrendDay } from './summary';

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

function trend(pattern: { mood: number; craving: number; sleep: number }[]): TrendDay[] {
  return pattern.map((p, i) => ({ day: day(i - (pattern.length - 1)), mood: p.mood, craving: p.craving, sleep: p.sleep, score: Math.round(((p.mood + 1) / 5) * 60 + (2 - p.craving) * 10 + Math.min(p.sleep, 8) * 2.5), checkedIn: i % 5 !== 3 }));
}

const struggling = trend([3, 3, 2, 3, 2, 2, 1, 2, 1, 1, 1, 0, 1, 0].map((m, i) => ({ mood: m, craving: i > 9 ? 2 : i > 5 ? 1 : 0, sleep: i > 8 ? 4.5 : 6.5 })));
const steady = trend([2, 3, 3, 3, 4, 3, 3, 4, 4, 3, 4, 4, 3, 4].map((m) => ({ mood: m, craving: 0, sleep: 7.5 })));
const wobbly = trend([3, 3, 2, 2, 3, 2, 2, 3, 2, 2, 1, 2, 2, 1].map((m, i) => ({ mood: m, craving: i % 4 === 0 ? 1 : 0, sleep: 6 })));

function snap(name: string, days: number, logo: Snapshot['logo'], reasons: string[], trends: TrendDay[], goals: Snapshot['goals'], relapses: string[] = []): Snapshot {
  return { name, days, logo, reasons, trends, goals, relapses: relapses.map((at) => ({ at })), lastCheckinAt: ago(5), nextAppointment: `${day(3)} 10:00` };
}

export function demoPeople(role: 'professional' | 'supporter', lang: 'en' | 'tn' = 'en'): LinkedPerson[] {
  const tn = lang === 'tn';
  if (role === 'supporter') {
    const perms = { alerts: true, status: true, milestones: true, messages: true };
    return [
      { linkId: 'demo-s1', role, memberName: 'Kabelo', permissions: perms, demo: true, journal: [], summary: buildSummary(role, perms, snap('Kabelo', 47, 'orange', ['missed2Days'], wobbly, [])) },
    ];
  }
  const perms = { alerts: true, trends: true, journal: true, status: true, milestones: true, messages: true };
  return [
    {
      linkId: 'demo-p1', role, memberName: 'Neo', permissions: perms, demo: true,
      summary: buildSummary(role, perms, snap('Neo', 23, 'pink', ['strongCraving', 'shortSleep', 'lowMoodWords'], struggling, [{ id: 'substanceFree', progress: 26 }, { id: 'wellbeing', progress: 41 }])),
      journal: [
        { id: 'dj1', at: ago(20), mood: 1, text: tn ? 'Tiro e ne e le thata mme ga ke a kgona go robala. Ke fetile fa bareng ka tsela e ya gae mme ka akanya go tsena. Ke mo boemong jwa moo ka leletsa nnake.' : 'Work was hard and I could not sleep. I walked past the bar on the way home and thought about going in. I called my sister instead.' },
        { id: 'dj2', at: ago(70), mood: 2, text: tn ? 'Ke ile kwa kopanong ya Labobedi. Go thusitse go utlwa batho ba bangwe ba bua dilo tse ke di utlwang.' : 'Went to the Tuesday meeting. It helped to hear other people say the same things I feel.' },
      ],
      plan: { goals: tn ? ['Robala ka 22:30 mo malatsing a tiro', 'Leletsa nnake fa keletso e le kgolo', 'Tsena dikopano di le 2 ka beke'] : ['Sleep by 22:30 on weeknights', 'Call sister when cravings are strong', 'Attend 2 meetings a week'], nextSession: `${day(3)} 10:00`, homework: tn ? 'Kwala dilo di le tharo tse di go tlhotlheleditseng beke eno le se o se dirileng.' : 'Write down three triggers from this week and what you did.' },
    },
    {
      linkId: 'demo-p2', role, memberName: 'Lesedi', permissions: perms, demo: true,
      summary: buildSummary(role, perms, snap('Lesedi', 128, 'normal', [], steady, [{ id: 'substanceFree', progress: 100 }, { id: 'lifeSkills', progress: 65 }])),
      journal: [{ id: 'dj3', at: ago(30), mood: 4, text: tn ? 'Dikgwedi di le nne gompieno. Ke apeetse lelapa la me mme ga go ope yo o neng a tshwenyegile ka nna.' : 'Four months today. I cooked for my family and nobody had to worry about me.' }],
    },
    {
      linkId: 'demo-p3', role, memberName: 'Thato', permissions: perms, demo: true,
      summary: buildSummary(role, perms, snap('Thato', 9, 'orange', ['amberCheckin', 'missedAppointment'], wobbly, [{ id: 'substanceFree', progress: 10 }], [ago(24 * 9)])),
      journal: [],
    },
  ];
}

export function demoMessages(role: 'professional' | 'supporter', lang: 'en' | 'tn' = 'en'): CareMessage[] {
  const tn = lang === 'tn';
  return role === 'supporter'
    ? [{ id: 'dm1', linkId: 'demo-s1', mine: false, body: tn ? 'Ke a leboga ka molaetsa wa maabane. O nthusitse.' : 'Thank you for the message yesterday. It helped.', at: ago(26), read: true }]
    : [{ id: 'dm2', linkId: 'demo-p1', mine: false, body: tn ? 'A re ka fetolela kopano ya Labone mo mosong?' : 'Can we move Thursday to the morning?', at: ago(8), read: false }];
}
