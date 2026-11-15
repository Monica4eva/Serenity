import { Redirect } from 'expo-router';
import { useApp } from '../lib/useApp';
import { homeRoute, isViewer } from '../lib/roles';

export default function Index() {
  const { state } = useApp();
  // Counsellors and supporters: account and terms, then their own home (no recovery onboarding).
  if (isViewer(state)) {
    if (state.account && state.loggedIn && state.termsVersionAccepted) return <Redirect href={homeRoute(state)} />;
    if (state.account && !state.loggedIn) return <Redirect href="/onboarding/login" />;
    if (state.account && state.loggedIn) return <Redirect href="/onboarding/consent" />;
    return <Redirect href="/onboarding/welcome" />;
  }
  if (state.onboarded && state.loggedIn) return <Redirect href="/(tabs)" />;
  if (state.account && !state.loggedIn) return <Redirect href="/onboarding/login" />;
  if (state.account && state.loggedIn && !state.termsVersionAccepted) return <Redirect href="/onboarding/consent" />;
  if (state.account && state.termsVersionAccepted) return <Redirect href="/onboarding/profile" />;
  return <Redirect href="/onboarding/welcome" />;
}
