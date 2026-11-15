// In-app notifications, built from the person's own data. Nothing is sent off the phone.
import type { State } from './store';
import { missedCheckinNudge } from './engine';

const RECONFIRM_DAYS = 90;
import { lastCheckinAt } from './progress';
import { daysBetween, MILESTONES } from './dates';

export type Notice = { id: string; icon: string; text: string; route: string };
type T = (k: string, v?: Record<string, string | number>) => string;

export function notificationsFor(s: State, t: T, now = new Date()): Notice[] {
  const out: Notice[] = [];
  if (missedCheckinNudge(lastCheckinAt(s), now)) out.push({ id: 'nudge', icon: 'leaf-outline', text: t('ui.notifNudge'), route: '/halt' });
  const days = daysBetween(s.recoveryStart, now) + 1;
  if (MILESTONES.includes(days)) out.push({ id: `ms${days}`, icon: 'trophy-outline', text: t('ui.notifMilestone', { n: days }), route: '/milestones' });
  for (const c of s.contacts) {
    if (!c.isEmergency) continue;
    const since = c.lastReconfirmed ? daysBetween(c.lastReconfirmed, now) : Infinity;
    if (since >= RECONFIRM_DAYS) out.push({ id: `rc${c.id}`, icon: 'shield-checkmark-outline', text: t('ui.notifReconfirm', { name: c.name }), route: `/onboarding/contact?id=${c.id}` });
  }
  if (s.agreement && daysBetween(s.agreement.signedAt, now) >= 30) out.push({ id: 'ag', icon: 'document-text-outline', text: t('ui.notifAgreement'), route: '/agreement' });
  return out;
}
