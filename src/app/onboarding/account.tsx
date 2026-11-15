import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { hashSecretStrong } from '../../lib/security';
import { backendEnabled } from '../../lib/supabase';
import { signUp } from '../../lib/auth';
import { Alert } from 'react-native';
import { Txt } from '../../components/ui';
import { Brand, Heading, IconInput, Page, Pill, TopBar, useDS } from '../../components/ds';
import SocialRow from '../../components/Social';
import { Pressable } from 'react-native';

function strength(p: string) {
  let n = 0;
  if (p.length >= 8) n++;
  if (/\d/.test(p)) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) n++;
  return n <= 1 ? 'weak' : n <= 2 ? 'fair' : 'strong';
}

export default function Account() {
  const { t, update, theme } = useApp();
  const c = useDS();
  const [f, setF] = useState({ name: '', email: '', phone: '', pw: '', pw2: '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const errs = {
    name: !f.name.trim() ? t('account.errName') : '',
    email: !/^\S+@\S+\.\S+$/.test(f.email.trim()) ? t('account.errEmail') : '',
    pw: f.pw.length < 10 || !/\d/.test(f.pw) || !/[A-Za-z]/.test(f.pw) ? t('account.errPassword') : '',
    pw2: f.pw !== f.pw2 ? t('account.errMatch') : '',
  };
  const valid = !Object.values(errs).some(Boolean);
  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    const preferred = f.name.trim().split(' ')[0];
    let userId: string | undefined;
    // With Supabase: real account on the server. Without: local-only account on this phone.
    let passwordHash: string | undefined;
    if (backendEnabled) {
      setBusy(true);
      const r = await signUp(f.email.trim().toLowerCase(), f.pw, f.name.trim(), preferred);
      setBusy(false);
      if (!r.ok) {
        setServerErr(
          /fetch|network/i.test(r.message) ? t('account.offline') : /registered|exists/i.test(r.message) ? t('account.exists') : r.message,
        );
        return;
      }
      userId = r.userId;
      if (r.needsConfirm) Alert.alert(t('account.confirmTitle'), t('account.confirmBody'));
    } else {
      passwordHash = await hashSecretStrong(f.pw);
    }
    update((s) => ({
      ...s,
      loggedIn: true,
      account: { fullName: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim() || undefined, passwordHash, userId, provider: 'email', createdAt: new Date().toISOString() },
      profile: { ...s.profile, preferredName: s.profile.preferredName || f.name.trim().split(' ')[0] },
    }));
    router.push('/onboarding/consent');
  };
  const st = f.pw ? strength(f.pw) : null;
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  return (
    <Page top={<TopBar step={2} />}>
      <Brand size={78} />
      <Heading title={t('account.title')} subtitle={t('ui.acctSub')} />
      {serverErr ? (
        <Txt center color={theme.colors.red} accessibilityLiveRegion="polite">
          {serverErr}
        </Txt>
      ) : null}
      <IconInput icon={{ name: 'person-outline' }} label={t('account.fullName')} value={f.name} onChangeText={set('name')} error={touched ? errs.name : ''} autoCapitalize="words" />
      <IconInput icon={{ name: 'mail-outline' }} label={t('ui.emailAddress')} value={f.email} onChangeText={set('email')} keyboardType="email-address" error={touched ? errs.email : ''} />
      <IconInput icon={{ name: 'call-outline' }} label={t('ui.phoneOptional')} value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <IconInput icon={{ name: 'lock-closed-outline' }} label={t('ui.createPassword')} value={f.pw} onChangeText={set('pw')} secure error={touched ? errs.pw : ''} />
      {st ? (
        <Txt variant="small" bold color={st === 'strong' ? theme.colors.success : st === 'fair' ? theme.colors.warnText : theme.colors.red} style={{ paddingLeft: 8 }}>
          {t(`account.${st}`)}
        </Txt>
      ) : null}
      <IconInput icon={{ name: 'lock-closed-outline' }} label={t('account.confirm')} value={f.pw2} onChangeText={set('pw2')} secure error={touched ? errs.pw2 : ''} />
      <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
        <Pill title={t('account.signUp')} onPress={submit} disabled={busy} />
      </View>
      <SocialRow />
      <Pressable onPress={() => router.push('/onboarding/login')} accessibilityRole="link" style={{ minHeight: 40, justifyContent: 'center' }}>
        <Txt center color={c.body}>
          {t('ui.haveAccount')}{' '}
          <Txt bold color={c.navy} style={{ textDecorationLine: 'underline' }}>
            {t('ui.logIn')}
          </Txt>
        </Txt>
      </Pressable>
      {!backendEnabled ? (
        <Txt variant="small" center color={c.body}>
          {t('account.localOnly')}
        </Txt>
      ) : null}
    </Page>
  );
}
