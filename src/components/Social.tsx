import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { backendEnabled } from '../lib/supabase';
import { enabledProviders, signInWithProvider, type OAuthProvider } from '../lib/auth';
import { Txt, announce } from './ui';
import { useDS } from './ds';

const NAMES: Record<OAuthProvider, string> = { google: 'Google', apple: 'Apple', facebook: 'Facebook' };

/** "or continue with" + Google, Apple and Facebook sign-in (Supabase Auth, PKCE). */
export default function SocialRow({ small }: { small?: boolean }) {
  const { t, state, update } = useApp();
  const c = useDS();
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  const go = async (p: OAuthProvider) => {
    if (!backendEnabled) return Alert.alert(NAMES[p], t('ui.socialNeedsBackend'));
    if (!enabledProviders.includes(p)) return Alert.alert(NAMES[p], t('ui.socialSoon'));
    setBusy(p);
    announce(t('ui.socialBusy', { provider: NAMES[p] }));
    const r = await signInWithProvider(p);
    setBusy(null);
    if (!r.ok) {
      if (!r.cancelled) Alert.alert(NAMES[p], /network|fetch/i.test(r.message) ? t('login.offline') : t('ui.socialFailed', { provider: NAMES[p] }));
      return;
    }
    update((s) => ({
      ...s,
      loggedIn: true,
      account: { ...(s.account ?? {}), fullName: r.fullName || s.account?.fullName || '', email: r.email || s.account?.email || '', userId: r.userId, provider: p, createdAt: s.account?.createdAt ?? new Date().toISOString() },
      profile: { ...s.profile, preferredName: s.profile.preferredName || r.fullName.split(' ')[0] || '' },
    }));
    // New people still read and accept the terms and consent; returning people go straight in
    // (their data downloads in the background).
    router.replace(r.isNew || !state.termsVersionAccepted ? '/onboarding/consent' : '/(tabs)');
  };

  const btn = (p: OAuthProvider, icon: any, color: string) => (
    <Pressable
      key={p}
      onPress={() => go(p)}
      disabled={!!busy}
      accessibilityRole="button"
      accessibilityLabel={t('ui.continueWith', { provider: NAMES[p] })}
      accessibilityState={{ busy: busy === p, disabled: !!busy }}
      style={{ flex: small ? 0 : 1, width: small ? 80 : undefined, height: small ? 46 : 58, borderRadius: 14, borderWidth: 1, borderColor: c.d ? c.border : '#D9DEE2', backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', opacity: busy && busy !== p ? 0.5 : 1 }}
    >
      {busy === p ? <ActivityIndicator color={c.navy} /> : <Ionicons name={icon} size={small ? 22 : 28} color={c.d && color === '#000000' ? '#FFFFFF' : color} />}
    </Pressable>
  );
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.d ? c.border : '#DDE3E8' }} />
        <Txt variant="small" color={c.body}>
          {t('account.orContinue')}
        </Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: c.d ? c.border : '#DDE3E8' }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'center', paddingHorizontal: small ? 0 : 26 }}>
        {btn('google', 'logo-google', '#4285F4')}
        {btn('apple', 'logo-apple', '#000000')}
        {btn('facebook', 'logo-facebook', '#1877F2')}
      </View>
    </View>
  );
}
