// Offline-first app state (Section 2). Everything is saved on the device first
// with AsyncStorage, so check-ins, journal and the craving plan work with no internet.
// A sync queue (`pendingSync`) is kept so a Supabase backend can be attached later.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppRole, CareRole, Permissions, Summary } from './summary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { newKey, open, seal } from './cryptoCore';
import { secureGet, secureSet } from './crypto';
import type { Lang } from './i18n';
import type { Level } from './engine';

const KEY = 'serenity:v1';
const STATE_KEY = 'serenity.stateKey.v1';

// Everything saved on the phone is encrypted (XSalsa20-Poly1305). The key lives in the
// phone's secure hardware store (Keychain / Keystore), never next to the data.
// The web preview has no secure store, so it keeps plain JSON there.
async function stateKey(): Promise<string> {
  let k = await secureGet(STATE_KEY);
  if (!k) {
    k = newKey();
    await secureSet(STATE_KEY, k);
  }
  return k;
}

async function readSaved(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (parsed && parsed.__enc === 1) return open(await stateKey(), parsed.c, parsed.n);
  return parsed; // older, unencrypted save: it is re-saved encrypted on the next change
}

async function writeSaved(value: State) {
  if (Platform.OS === 'web') return AsyncStorage.setItem(KEY, JSON.stringify(value));
  const { ciphertext, nonce } = seal(await stateKey(), value);
  return AsyncStorage.setItem(KEY, JSON.stringify({ __enc: 1, c: ciphertext, n: nonce }));
}

export type Role = 'family' | 'sponsor' | 'counsellor' | 'healthcare' | 'other';
export type Contact = {
  id: string;
  name: string;
  role: Role;
  phone: string;
  email?: string;
  isEmergency: boolean;
  consentLevel: 'none' | 'support' | 'alerts';
  lastReconfirmed?: string;
};
export type ConsentType = 'terms' | 'data' | 'health' | 'analytics' | 'research' | 'emergency';
export type Consent = { type: ConsentType; version: string; granted: boolean; at: string; contactId?: string };
export type CheckIn = {
  id: string;
  type: 'halt' | 'balance' | 'daily' | 'baseline' | 'rhythm' | 'meeting';
  answers: Record<string, any>;
  level?: Level;
  reasons?: string[];
  score?: number;
  at: string;
};
export type JournalEntry = { id: string; at: string; mood?: number; text: string; prompt?: string; photo?: string; audio?: string; audioSecs?: number };
export type Appointment = { id: string; title: string; when: string; status?: 'attended' | 'missed'; markedAt?: string };
export type Trigger = { id: string; category: 'person' | 'place' | 'thing' | 'internal'; label: string };
export type DimensionRating = { dimension: string; score: number; note?: string; at: string };
export type DayLogEntry = { sleepHours?: number; meals?: number; water?: number; activityMins?: number; steps?: number; bedtime?: string; wake?: string };
export type Settings = {
  fontScale: number;
  dyslexia: boolean;
  highContrast: boolean;
  dark: boolean;
  /** Appearance: light, dark, or follow the phone's setting. */
  themeMode: 'light' | 'dark' | 'system';
  voiceFirst: boolean;
  simplePrompts: boolean;
  discreet: boolean;
  appLock: boolean;
  pinHash?: string;
  blockScreenshots: boolean;
  reminders: boolean;
  voiceLang: 'en' | 'tn';
};
export type Approach = '12step' | 'pillars' | 'both' | 'wellbeing' | 'community' | 'lifeskills';
/** Answers from the designer's Recovery Details and Baseline pages (free-form keys). */
export type RecoveryDetails = Record<string, string | undefined>;
export type Agreement = { participant: string; sponsor: string; signedAt: string };
export type EmergencyNumber = { id: string; label: string; labelTn?: string; number: string; verified: boolean };


// ---------- care team (counsellors, therapists, family and friends) ----------
export type CareLinkLocal = {
  id: string; role: CareRole; label: string; permissions: Permissions;
  status: 'pending' | 'active' | 'revoked'; code?: string; expiresAt?: string; createdAt: string;
  viewerName?: string; demo?: boolean;
};
export type CarePlan = { goals: string[]; nextSession?: string; homework?: string; shared?: string; updatedAt?: string };
export type LinkedPerson = {
  linkId: string; role: CareRole; memberName: string; permissions: Permissions;
  summary?: Summary | null; journal: { id: string; at: string; text: string; mood?: number }[];
  plan?: CarePlan; demo?: boolean; acceptedAt?: string;
};
export type CareMessage = { id: string; linkId: string; mine: boolean; body: string; at: string; read?: boolean };
export type ProNote = { id: string; linkId: string; date: string; body: string; at: string };
export type CareState = {
  links: CareLinkLocal[];
  shared: Record<string, string[]>; // journal entry id -> link ids it was shared with
  people: LinkedPerson[];
  messages: CareMessage[];
  plans: Record<string, CarePlan>; // member side: plans from their professionals
  notes: ProNote[];
  proProfile?: { profession?: string; registration?: string; organisation?: string };
  selfCare: { at: string; score: number }[]; // supporters' own wellbeing check
  lastAlert?: string;
};
export const emptyCare = (): CareState => ({ links: [], shared: {}, people: [], messages: [], plans: {}, notes: [], selfCare: [] });

export type State = {
  /** Who is using the app: the person in recovery, a counsellor, or a family member or friend. */
  appRole?: AppRole;
  care: CareState;
  language: Lang;
  languageChosen: boolean;
  onboarded: boolean;
  account?: { fullName: string; email: string; phone?: string; passwordHash?: string; createdAt: string; userId?: string; provider?: 'email' | 'google' | 'apple' | 'facebook' };
  loggedIn: boolean;
  consents: Consent[];
  termsVersionAccepted?: string;
  profile: { preferredName: string; answers: Record<string, string>; supportNeeds: string[]; sixMonthVision?: string };
  baseline: { feeling?: number; halt: string[]; craving?: number; sleepHours?: number; note?: string; extended: Record<string, string> };
  contacts: Contact[];
  approach: Approach | null;
  details: RecoveryDetails;
  safetyPlan: Record<string, string>;
  agreement?: Agreement;
  stepsDone: number[];
  goals: { id: string; progress: number }[];
  dimensions: DimensionRating[];
  recoveryStart: string;
  relapses: { at: string; priorDays: number }[];
  checkins: CheckIn[];
  journal: JournalEntry[];
  focus: Record<string, string[]>; // dayKey -> done item ids
  dayLogs: Record<string, DayLogEntry>;
  appointments: Appointment[];
  triggers: Trigger[];
  activitiesDone: { id: string; at: string; feeling?: string }[];
  safetyEvents: { at: string; kind: string }[]; // restricted, minimum data
  dismissals: { at: string; context: string }[];
  settings: Settings;
  emergencyNumbers: EmergencyNumber[];
  pendingSync: number;
  /** Journal entries downloaded from the server that this phone cannot unlock (needs the recovery key). */
  journalLocked: number;
  /** "Try the demo": sample data on this device only; never synced. */
  demo?: boolean;
};

export const TERMS_VERSION = '0.1';

// Seed numbers from public sources (Nov 2026). Admin-managed and editable, NOT hard-coded
// into screens. Every number must be verified with a local clinical partner before launch.
export const DEFAULT_EMERGENCY: EmergencyNumber[] = [
  { id: 'ambulance', label: 'Ambulance (Emergency Medical Services)', labelTn: 'Ambulense (Ditirelo tsa Tshoganyetso)', number: '997', verified: false },
  { id: 'police', label: 'Police emergency', labelTn: 'Mapodise (tshoganyetso)', number: '999', verified: false },
  { id: 'fire', label: 'Fire', labelTn: 'Molelo', number: '998', verified: false },
  { id: 'youth', label: 'BOFWA 24-hour youth helpline', labelTn: 'BOFWA: mogala wa thuso wa basha (diura di le 24)', number: '16658', verified: false },
  { id: 'gbv', label: 'Gender-based violence helpline', labelTn: 'Mogala wa thuso wa tirisodikgoka mo bongweng', number: '14655', verified: false },
];

export const initialState = (): State => ({
  care: emptyCare(),
  language: 'en',
  languageChosen: false,
  onboarded: false,
  loggedIn: false,
  consents: [],
  profile: { preferredName: '', answers: {}, supportNeeds: [] },
  baseline: { halt: [], extended: {} },
  contacts: [],
  approach: null,
  details: {},
  safetyPlan: {},
  stepsDone: [],
  goals: [],
  dimensions: [],
  recoveryStart: new Date().toISOString(),
  relapses: [],
  checkins: [],
  journal: [],
  focus: {},
  dayLogs: {},
  appointments: [],
  triggers: [],
  activitiesDone: [],
  safetyEvents: [],
  dismissals: [],
  settings: {
    fontScale: 1,
    dyslexia: false,
    highContrast: false,
    dark: false,
    themeMode: 'system',
    voiceFirst: false,
    simplePrompts: false,
    discreet: true,
    appLock: false,
    blockScreenshots: false,
    reminders: false,
    voiceLang: 'en',
  },
  emergencyNumbers: DEFAULT_EMERGENCY,
  pendingSync: 0,
  journalLocked: 0,
});

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  reset: () => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    readSaved()
      .then((saved) => {
        if (saved) {
          const base = initialState();
          const settings = { ...base.settings, ...saved.settings };
          if (!saved.settings?.themeMode) settings.themeMode = saved.settings?.dark ? 'dark' : 'system';
          setState({ ...base, ...saved, settings, care: { ...emptyCare(), ...(saved.care ?? {}) } });
        }
      })
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (s: State) => State) => {
    setState((prev) => {
      const next = fn(prev);
      const withSync = { ...next, pendingSync: next.pendingSync + 1 };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        writeSaved(withSync).catch(() => {});
      }, 150);
      return withSync;
    });
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setState(initialState());
  }, []);

  const value = useMemo(() => ({ state, ready, update, reset }), [state, ready, update, reset]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/**
 * A different person is signing up or logging in on this phone: start with a clean slate so
 * one person's recovery data never mixes with another's. Keeps only device preferences
 * (language, role just chosen, text size, theme, accessibility) and the emergency numbers.
 */
export function freshForNewPerson(s: State): State {
  const base = initialState();
  return {
    ...base,
    language: s.language,
    languageChosen: s.languageChosen,
    appRole: s.appRole,
    emergencyNumbers: s.emergencyNumbers,
    settings: { ...s.settings, appLock: false, pinHash: undefined },
  };
}

/** True when the phone holds a different person's account than the one now signing in. */
export function isDifferentPerson(s: State, userId?: string, email?: string): boolean {
  const a = s.account;
  if (!a) return false;
  if (a.userId && userId) return a.userId !== userId;
  return !!email && a.email.toLowerCase() !== email.toLowerCase();
}

export function addConsent(s: State, type: ConsentType, granted: boolean, contactId?: string): State {
  return { ...s, consents: [...s.consents, { type, granted, version: TERMS_VERSION, at: new Date().toISOString(), contactId }] };
}

export function latestConsent(s: State, type: ConsentType): boolean {
  const c = [...s.consents].reverse().find((x) => x.type === type);
  return !!c?.granted;
}
