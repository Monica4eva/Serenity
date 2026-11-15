// One name for the person everywhere in the app: the name they asked to be called,
// otherwise the first word of their account name.
import type { State } from './store';

export function displayName(s: Pick<State, 'profile' | 'account'>): string {
  return (s.profile.preferredName || s.account?.fullName?.trim().split(/\s+/)[0] || '').trim();
}
