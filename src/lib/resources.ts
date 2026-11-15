// Resources hub: recovery meetings and counselling. Links and numbers were checked in
// November 2026 against each organisation's own site or a published listing.
// Confirm Botswana numbers with your clinical partner before launch, and review yearly.
export type Resource = {
  id: string;
  name: string;
  en: string;
  tn: string;
  url?: string;
  phones?: string[];
};
export type ResourceGroup = { id: 'online' | 'botswana' | 'helplines' | 'family'; items: Resource[] };

export const RESOURCES_CHECKED = '2026-11';

export const RESOURCES: ResourceGroup[] = [
  {
    id: 'online',
    items: [
      {
        id: 'oiaa',
        name: 'Alcoholics Anonymous: Online Intergroup (OIAA)',
        en: 'Free online AA meetings any time of day, from anywhere in the world. Filter by language and time.',
        tn: 'Dikopano tsa AA mo inthaneteng mahala, nako nngwe le nngwe, go tswa gongwe le gongwe mo lefatsheng.',
        url: 'https://aa-intergroup.org/',
      },
      {
        id: 'vna',
        name: 'Narcotics Anonymous: Virtual NA',
        en: 'Online and phone NA meetings from many countries, sorted by language and day, available 24/7.',
        tn: 'Dikopano tsa NA mo inthaneteng le ka mogala go tswa mo dinageng di le dintsi, malatsi otlhe, diura tsotlhe.',
        url: 'https://virtual-na.org/meetings/',
      },
      {
        id: 'smart',
        name: 'SMART Recovery International',
        en: 'Science-based, non-12-step meetings online in many languages and time zones.',
        tn: 'Dikopano tse di theilweng mo saenseng, e seng tsa dikgato di le 12, mo inthaneteng ka dipuo le dinako tse dintsi.',
        url: 'https://www.smartrecoveryinternational.org/onlinemeetings',
      },
      {
        id: 'ga',
        name: 'Gamblers Anonymous: virtual meetings',
        en: 'Online meetings for people who want to stop gambling.',
        tn: 'Dikopano tsa mo inthaneteng tsa batho ba ba batlang go emisa go betšha.',
        url: 'https://gamblersanonymous.org/virtual-meetings/',
      },
      {
        id: 'aa',
        name: 'Alcoholics Anonymous (aa.org)',
        en: 'Learn how AA works and find meetings worldwide.',
        tn: 'Ithute ka fa AA e dirang ka teng mme o bone dikopano mo lefatsheng lotlhe.',
        url: 'https://www.aa.org/',
      },
    ],
  },
  {
    id: 'botswana',
    items: [
      {
        id: 'aabw',
        name: 'AA Botswana',
        en: 'AA groups meet in Gaborone (Gabz Angels AA Group) and Francistown (Keep It Simple AA Group), with hybrid and online options. Ask BOSASNet or your counsellor for the current meeting times.',
        tn: 'Ditlhopha tsa AA di kopana kwa Gaborone (Gabz Angels AA Group) le kwa Francistown (Keep It Simple AA Group), ka go tla kgotsa mo inthaneteng. Botsa BOSASNet kgotsa mogakolodi wa gago dinako tsa jaanong.',
      },
      {
        id: 'bosasnet',
        name: 'BOSASNet (Botswana Substance Abuse Support Network)',
        en: 'Outpatient rehabilitation and counselling for substance use, plus family and group counselling. Gaborone and Tsabong.',
        tn: 'Kalafi le kgakololo ya batho ba ba dirisang diritibatsi, le kgakololo ya malapa le ya ditlhopha. Gaborone le Tsabong.',
        phones: ['+267 395 9119', '+267 7265 9891', '+267 654 0010'],
      },
    ],
  },
  {
    id: 'helplines',
    items: [
      {
        id: 'lifeline',
        name: 'Lifeline Botswana (LifeLine/FTMTB)',
        en: 'Free, confidential general counselling and suicide prevention support.',
        tn: 'Kgakololo e e sa duelweng, e e sireletsegileng, le thuso ya go thibela go ipolaya.',
        phones: ['+267 7552 7590', '+267 7380 7492'],
      },
      {
        id: 'bofwa',
        name: 'BOFWA 24-hour Youth Helpline',
        en: 'Free, 24-hour line for young people.',
        tn: 'Mogala wa bašwa o o sa duelweng, diura di le 24.',
        phones: ['16658'],
      },
      {
        id: 'bgbvc',
        name: 'BGBVC tele-counselling',
        en: 'Free counselling for anyone affected by gender-based violence.',
        tn: 'Kgakololo e e sa duelweng ya mongwe le mongwe yo o amilweng ke tirisodikgoka ya bong.',
        phones: ['14655'],
      },
      {
        id: 'childline',
        name: 'Childline Botswana',
        en: 'Free support for children and young people.',
        tn: 'Thuso e e sa duelweng ya bana le bašwa.',
        phones: ['116'],
      },
      {
        id: 'findahelpline',
        name: 'Find A Helpline: Botswana',
        en: 'An up-to-date list of free helplines in Botswana, by topic.',
        tn: 'Lenaane la jaanong la megala ya thuso e e sa duelweng mo Botswana, ka setlhogo.',
        url: 'https://findahelpline.com/countries/bw',
      },
    ],
  },
  {
    id: 'family',
    items: [
      {
        id: 'alanon',
        name: 'Al-Anon: online meetings for family and friends',
        en: 'For anyone worried about someone else’s drinking. Al-Anon also meets in Gaborone.',
        tn: 'Ya mongwe le mongwe yo o tshwenyegileng ka go nwa ga mongwe. Al-Anon e kopana gape kwa Gaborone.',
        url: 'https://meetings.al-anon.org/electronic-meeting-page/',
      },
    ],
  },
];
