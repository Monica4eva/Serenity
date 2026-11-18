// Keeps the care team up to date in the background.
//  * Person in recovery: publishes a filtered summary for each link (debounced), alerts the care
//    team when the button gets worse, and downloads care plans and messages.
//  * Counsellor or supporter: downloads the people they support every minute while the app is open.
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import { useStore, type CareMessage } from '../lib/store';
import { useLogoState } from '../lib/useLogoState';
import { alertCareTeam, careOnline, fetchMemberData, fetchViewerData, publishSummaries } from '../lib/care';
import type { LogoColour } from '../lib/summary';

function mergeMessages(local: CareMessage[], remote: CareMessage[]) {
  const ids = new Set(remote.map((m) => m.id));
  return [...remote, ...local.filter((m) => !ids.has(m.id) && m.id.length !== 36)].sort((a, b) => a.at.localeCompare(b.at));
}

export function CareSync() {
  const { state, ready, update } = useStore();
  const logo = useLogoState();
  const role = state.appRole ?? 'member';
  const prevLogo = useRef<LogoColour | null>(null);
  const latest = useRef(state);
  latest.current = state;

  const refresh = async () => {
    if (!careOnline || latest.current.demo) return;
    try {
      if (role === 'member') {
        const d = await fetchMemberData();
        if (d)
          update((s) => ({
            ...s,
            care: {
              ...s.care,
              links: [...d.links, ...s.care.links.filter((l) => l.demo)].map((l) => ({ ...l, code: s.care.links.find((x) => x.id === l.id)?.code })),
              plans: d.plans,
              messages: mergeMessages(s.care.messages, d.messages),
            },
          }));
      } else {
        const d = await fetchViewerData();
        if (d) update((s) => ({ ...s, care: { ...s.care, people: [...d.people, ...s.care.people.filter((p) => p.demo)], messages: mergeMessages(s.care.messages, d.messages) } }));
      }
    } catch {}
  };

  // Tapping a care-team alert opens the right screen.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove: () => void } | undefined;
    import('expo-notifications')
      .then((N) => {
        N.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
        sub = N.addNotificationResponseReceivedListener((r) => {
          const route = r.notification.request.content.data?.route;
          if (typeof route === 'string' && /^\/(pro|supporter|daily|comeback|plan)/.test(route)) {
            refresh();
            router.push(route as any);
          }
        });
      })
      .catch(() => {});
    return () => sub?.remove();
  }, []);

  // Initial load, every minute, and when the app comes back to the front.
  useEffect(() => {
    if (!ready || !careOnline) return;
    refresh();
    const timer = setInterval(() => AppState.currentState === 'active' && refresh(), 60000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [ready, role]);

  // Alert the care team when the colour gets worse.
  useEffect(() => {
    if (!ready || role !== 'member' || !state.onboarded || state.demo) return;
    const next = logo.state as LogoColour;
    const prev = prevLogo.current;
    prevLogo.current = next;
    if (prev && prev !== next) alertCareTeam(prev, next);
  }, [logo.state, ready, role]);

  // Publish summaries a little after changes (and straight away when the colour changes).
  useEffect(() => {
    if (!ready || role !== 'member' || !careOnline || !state.care.links.some((l) => !l.demo && l.status !== 'revoked')) return;
    const t = setTimeout(() => publishSummaries(latest.current, { state: logo.state as LogoColour, reasons: logo.reasons as string[] }).catch(() => {}), 8000);
    return () => clearTimeout(t);
  }, [state, logo.state, ready, role]);

  return null;
}
