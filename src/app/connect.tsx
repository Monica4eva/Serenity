// Counsellor or supporter enters the invite code the person in recovery gave them.
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { acceptInvite, careOnline, saveCareProfile } from '../lib/care';
import { currentUserId } from '../lib/supabase';
import { formatCode, isCodeShaped } from '../lib/summary';
import { Txt, announce } from '../components/ui';
import { Card, IconInput, Page, Pill, TopBar, useDS } from '../components/ds';

export default function Connect() {
  const { t, state, update } = useApp();
  const c = useDS();
  const role = state.appRole === 'supporter' ? 'supporter' : 'professional';
  const [name, setName] = useState(state.profile.preferredName || state.account?.fullName || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const go = async () => {
    setMsg('');
    if (!careOnline) return setMsg(t('care.connect.offline'));
    if (!(await currentUserId())) return setMsg(t('care.connect.signIn'));
    if (!isCodeShaped(code)) return setMsg(t('care.connect.invalid'));
    setBusy(true);
    try {
      const p = await acceptInvite(code, name.trim());
      await saveCareProfile(role, name.trim(), state.care.proProfile).catch(() => {});
      update((s) => ({ ...s, profile: { ...s.profile, preferredName: s.profile.preferredName || name.trim() }, care: { ...s.care, people: [...s.care.people.filter((x) => x.linkId !== p.linkId), p] } }));
      announce(t('care.connect.success', { name: p.memberName }));
      router.replace(p.role === 'professional' ? `/pro/client/${p.linkId}` : `/supporter/${p.linkId}`);
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      const text = /Too many/i.test(m) ? t('care.connect.tooMany') : t('care.connect.invalid');
      setMsg(text);
      announce(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page top={<TopBar title={t('care.connect.title')} subtitle={t('care.connect.sub')} />} footer={<Pill title={busy ? t('care.connect.connecting') : t('care.connect.button')} disabled={busy || !code.trim()} chevron onPress={go} />}>
      <IconInput icon={{ name: 'person-outline' }} label={t('care.connect.name')} value={name} onChangeText={setName} autoCapitalize="words" />
      <IconInput icon={{ name: 'key-outline' }} label={t('care.connect.code')} value={code} onChangeText={(v) => setCode(v.length >= 10 && !v.includes('-') ? formatCode(v) : v.toUpperCase())} autoCapitalize="none" />
      {msg ? (
        <Card cream>
          <Txt color={c.title} accessibilityLiveRegion="polite">{msg}</Txt>
        </Card>
      ) : null}
    </Page>
  );
}
