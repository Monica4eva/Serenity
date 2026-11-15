// "Set a new password": opened from the password-reset email.
// The link carries a one-time code; we swap it for a short session, save the new password,
// then send the person to log in with it.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../lib/useApp';
import { openResetLink, setNewPassword } from '../lib/auth';
import { Txt, announce } from '../components/ui';
import { Brand, Card, Heading, IconInput, Page, Pill, TopBar, useDS } from '../components/ds';

export default function ResetPassword() {
  const { t, update } = useApp();
  const c = useDS();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [stage, setStage] = useState<'opening' | 'form' | 'expired' | 'done'>('opening');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return setStage('expired');
    openResetLink(String(code)).then((r) => setStage(r.ok ? 'form' : 'expired'));
  }, [code]);

  const save = async () => {
    const weak = pw.length < 10 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw);
    if (weak) return setErr(t('account.errPassword'));
    if (pw !== pw2) return setErr(t('account.errMatch'));
    setBusy(true);
    const r = await setNewPassword(pw);
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    update((s) => ({ ...s, loggedIn: false }));
    announce(t('reset.done'));
    setStage('done');
  };

  return (
    <Page top={<TopBar back={false} />} footer={stage === 'form' ? <Pill title={busy ? t('reset.saving') : t('reset.save')} disabled={busy} onPress={save} /> : stage === 'opening' ? null : <Pill title={t('reset.toLogin')} onPress={() => router.replace('/onboarding/login')} />}>
      <Brand size={70} />
      <Heading title={t('reset.title')} subtitle={stage === 'form' ? t('reset.sub') : undefined} />
      {stage === 'opening' ? (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <ActivityIndicator color={c.navy} />
        </View>
      ) : null}
      {stage === 'form' ? (
        <View style={{ gap: 12 }}>
          <IconInput icon={{ name: 'lock-closed-outline' }} label={t('reset.pw')} value={pw} onChangeText={setPw} secure />
          <IconInput icon={{ name: 'lock-closed-outline' }} label={t('reset.pw2')} value={pw2} onChangeText={setPw2} secure error={err || undefined} />
          <Txt variant="small" color={c.body}>{t('reset.rules')}</Txt>
        </View>
      ) : null}
      {stage === 'expired' ? (
        <Card cream>
          <Txt color={c.title}>{t('reset.expired')}</Txt>
        </Card>
      ) : null}
      {stage === 'done' ? (
        <Card cream>
          <Txt color={c.title}>{t('reset.done')}</Txt>
        </Card>
      ) : null}
    </Page>
  );
}
