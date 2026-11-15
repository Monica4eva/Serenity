// Shared top section for the counsellor and supporter home screens: sample data switch,
// phone alerts, connect with a code, language, resources and switching role.
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { careOnline, registerPush } from '../lib/care';
import { demoMessages, demoPeople } from '../lib/careDemo';
import type { CareRole } from '../lib/summary';
import { Txt } from './ui';
import { Card, RowCard, TextLink, useDS } from './ds';

/** Adds sample people the first time (always when there is no backend). */
export function useSampleSeed(role: CareRole) {
  const { state, update } = useApp();
  useEffect(() => {
    const real = state.care.people.filter((p) => !p.demo && p.role === role);
    const hasDemo = state.care.people.some((p) => p.demo && p.role === role);
    if (!real.length && !hasDemo && !careOnline) setSample(update, role, true);
  }, []);
  return state.care.people.some((p) => p.demo && p.role === role);
}

export function setSample(update: ReturnType<typeof useApp>['update'], role: CareRole, on: boolean) {
  update((s) => ({
    ...s,
    care: {
      ...s.care,
      people: on ? [...s.care.people.filter((p) => !p.demo), ...demoPeople(role, s.language)] : s.care.people.filter((p) => !p.demo),
      messages: on ? [...s.care.messages.filter((m) => !m.linkId.startsWith('demo-')), ...demoMessages(role, s.language)] : s.care.messages.filter((m) => !m.linkId.startsWith('demo-')),
    },
  }));
}

export function ViewerTools({ role }: { role: CareRole }) {
  const { t, state, update } = useApp();
  const c = useDS();
  const [push, setPush] = useState<'idle' | 'on' | 'na'>('idle');
  const hasDemo = state.care.people.some((p) => p.demo);
  return (
    <View style={{ gap: 10 }}>
      <RowCard title={t(role === 'professional' ? 'care.pro.add' : 'care.sup.add')} icon={{ name: 'key-outline' }} tint="green" iconColor={c.green} onPress={() => router.push('/connect')} />
      {role === 'supporter' ? <RowCard title={t('care.sup.guide')} subtitle={t('care.sup.guideSub')} icon={{ name: 'book-outline' }} tint="yellow" onPress={() => router.push('/supporter/guide')} /> : null}
      {role === 'professional' ? <RowCard title={t('care.pro.profile')} icon={{ name: 'id-card-outline' }} tint="lavender" onPress={() => router.push('/pro/profile')} /> : null}
      <RowCard title={t('care.home.resources')} icon={{ name: 'globe-outline' }} tint="sky" onPress={() => router.push('/resources')} />
      {careOnline && Platform.OS !== 'web' ? (
        <Card style={{ gap: 6 }}>
          <Txt bold color={c.title}>{t('care.home.alerts')}</Txt>
          {push === 'on' ? <Txt color={c.green}>{t('care.home.alertsOn')}</Txt> : push === 'na' ? <Txt variant="small" color={c.body}>{t('care.home.alertsNA')}</Txt> : (
            <TextLink center={false} title={t('care.home.alertsOff')} onPress={async () => setPush((await registerPush()) ? 'on' : 'na')} />
          )}
        </Card>
      ) : null}
      <TextLink title={hasDemo ? t(`care.${role === 'professional' ? 'pro' : 'sup'}.hideSample`) : t(`care.${role === 'professional' ? 'pro' : 'sup'}.showSample`)} onPress={() => setSample(update, role, !hasDemo)} />
      <TextLink title={`${t('care.home.language')}: ${state.language === 'tn' ? 'Setswana' : 'English'}`} onPress={() => {
          update((s) => ({ ...s, language: s.language === 'tn' ? 'en' : 'tn' }));
          if (hasDemo) setSample(update, role, true);
        }} />
      <TextLink title={t('care.home.switchRole')} onPress={() => router.push('/onboarding/role?switch=1')} />
    </View>
  );
}
