// Where each kind of user lands.
import type { State } from './store';

export function homeRoute(s: Pick<State, 'appRole'>): '/pro' | '/supporter' | '/(tabs)' {
  if (s.appRole === 'professional') return '/pro';
  if (s.appRole === 'supporter') return '/supporter';
  return '/(tabs)';
}

export const isViewer = (s: Pick<State, 'appRole'>) => s.appRole === 'professional' || s.appRole === 'supporter';
