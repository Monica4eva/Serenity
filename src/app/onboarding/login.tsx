import React, { useEffect, useState } from 'react';
import { homeRoute, isViewer } from '../../lib/roles';
import { fetchMyRole } from '../../lib/care';
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { biometricAvailable, biometricUnlock, hashSecretStrong, isLegacyHash, verifySecret } from '../../lib/security';
import { backendEnabled } from '../../lib/supabase';
import { sendPasswordReset, signIn } from '../../lib/auth';
import { Txt, announce } from '../../components/ui';
import { Brand, Heading, IconInput, Page, Pill, Seg, TopBar, useDS } from '../../components/ds';
import SocialRow from '../../components/Social';
import { View } from 'react-native';

export default function Login() {
  const { t, state, update, theme } = useApp();
  const c = useDS();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [bio, setBio] = useState(false);

  useEffect(() => {
    // Biometric login is offered only after a first successful password login.
    if (state.account && state.settings.appLock) biometricAvailable().then(setBio);
  }, []);

  const forgot = async () => {
    if (!backendEnabled) return Alert.alert(t('login.forgot'), t('login.forgotBody'));
    if (!/^\S+@\S+\.\S+$/.test(id.trim())) return Alert.alert(t('login.forgot'), t('login.forgotEnterEmail'));
    const r = await sendPasswordReset(id.trim().toLowerCase());
    Alert.alert(t('login.forgot'), r.ok ? t('login.resetSent') : r.message);
  };

  const finish = () => {
    update((s) => ({ ...s, loggedIn: true }));
    router.replace(isViewer(state) ? homeRoute(state) : state.onboarded ? '/(tabs)' : '/onboarding/profile');
  };

  const [busy, setBusy] = useState(false);

  const login = async () => {
    if (backendEnabled) {
      setBusy(true);
      const r = await signIn(id.trim().toLowerCase(), pw);
      setBusy(false);
      if (!r.ok) {
        const msg = /confirm/i.test(r.message) ? t('login.notConfirmed') : /network|fetch/i.test(r.message) ? t('login.offline') : t('login.wrong');
        setErr(msg);
        announce(msg);
        return;
      }
      // Data downloads in the background (SyncProvider). Mark this phone as logged in.
      update((s) => ({
        ...s,
        loggedIn: true,
        account: s.account ?? { fullName: '', email: id.trim().toLowerCase(), createdAt: new Date().toISOString(), userId: r.userId },
      }));
      // On a new phone, find out whether this account belongs to a counsellor or supporter.
      const role = state.appRole ?? (await fetchMyRole());
      if (role && role !== state.appRole) update((s) => ({ ...s, appRole: role }));
      router.replace(homeRoute({ appRole: role ?? undefined }));
      return;
    }
    const a = state.account;
    const match = a && (id.trim().toLowerCase() === a.email || (a.phone && id.replace(/\s/g, '') === a.phone.replace(/\s/g, '')));
    if (match && (await verifySecret(pw, a!.passwordHash))) {
      // Upgrade an old-format password hash to the stronger format.
      if (isLegacyHash(a!.passwordHash)) {
        const passwordHash = await hashSecretStrong(pw);
        update((s) => ({ ...s, account: s.account ? { ...s.account, passwordHash } : s.account }));
      }
      finish();
    }
    else {
      setErr(t('login.wrong'));
      announce(t('login.wrong'));
    }
  };

  return (
    <Page top={<TopBar back={router.canGoBack()} />}>
      <Brand size={78} />
      <Heading title={t('login.title')} subtitle={t('login.subtitle')} />
      <View style={{ paddingHorizontal: 20, gap: 18 }}>
        <Seg
          big
          color="navy"
          value="login"
          onChange={(k) => k === 'signup' && router.replace('/onboarding/language')}
          options={[{ key: 'login', label: t('ui.logIn') }, { key: 'signup', label: t('login.signUp') }]}
        />
        <IconInput icon={{ name: 'mail-outline' }} label={backendEnabled ? t('ui.emailAddress') : t('ui.emailOrPhone')} value={id} onChangeText={setId} keyboardType="email-address" />
        <IconInput icon={{ name: 'lock-closed-outline' }} label={t('login.password')} value={pw} onChangeText={setPw} secure error={err} />
        <Pressable onPress={forgot} accessibilityRole="link" style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'flex-end' }}>
          <Txt color={c.navy}>{t('login.forgot')}</Txt>
        </Pressable>
      </View>
      {/* The mock-up's button said "Sign Up" on the Log in tab; it says "Log in" (build spec fix). */}
      <View style={{ paddingHorizontal: 24 }}>
        <Pill title={t('ui.logIn')} onPress={login} disabled={!id || !pw || busy} />
      </View>
      {bio ? <Pill variant="outline" icon={{ name: 'finger-print' }} title={t('login.biometric')} onPress={() => biometricUnlock(t('login.title')).then((ok) => ok && finish())} /> : null}
      <SocialRow small />
      <Pressable onPress={() => router.replace('/onboarding/language')} accessibilityRole="link" style={{ minHeight: 40, justifyContent: 'center' }}>
        <Txt center color={c.body}>
          {t('ui.noAccount')}{' '}
          <Txt bold color={c.navy} style={{ textDecorationLine: 'underline' }}>
            {t('ui.signUp')}
          </Txt>
        </Txt>
      </Pressable>
    </Page>
  );
}
