// "Your Recovery Profile & Goals" hub (Step 4 of 4 in the designer's flow).
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { Brand, Heading, Page, Pill, RowCard, TextLink, TopBar } from '../../components/ds';

export default function ProfileHub() {
  const { t, state, update } = useApp();
  const rows = [
    { key: 'details', icon: { name: 'person-outline' }, tint: 'green' as const, color: '#0C6434', title: t('ui.hubDetails'), sub: t('ui.hubDetailsSub'), to: '/onboarding/details', done: !!(state.details.substance || state.details.stage) },
    { key: 'goals', icon: { name: 'target', lib: 'mci' as const }, tint: 'green' as const, color: '#0C6434', title: t('ui.hubGoals'), sub: t('ui.hubGoalsSub'), to: '/onboarding/goals', done: state.goals.length > 0 },
    { key: 'approach', icon: { name: 'layers-outline' }, tint: 'teal' as const, color: '#1F6B5C', title: t('ui.hubApproach'), sub: t('ui.hubApproachSub'), to: '/onboarding/approach', done: !!state.approach },
    { key: 'network', icon: { name: 'account-group', lib: 'mci' as const }, tint: 'peach' as const, color: '#B3672D', title: t('ui.hubNetwork'), sub: t('ui.hubNetworkSub'), to: '/onboarding/network', done: state.contacts.length > 0 },
    { key: 'relapse', icon: { name: 'shield-checkmark-outline' }, tint: 'lavender' as const, color: '#3E3A73', title: t('ui.hubRelapse'), sub: t('ui.hubRelapseSub'), to: '/onboarding/extended', done: Object.keys(state.baseline.extended).length > 0 },
  ];
  return (
    <Page
      top={<TopBar step={4} />}
      footer={
        <>
          <Pill title={t('common.continue')} onPress={() => router.push(state.onboarded ? '/(tabs)' : '/onboarding/baseline?page=1')} />
          <TextLink
            title={t('common.saveLater')}
            onPress={() => {
              update((s) => ({ ...s, onboarded: true }));
              router.replace('/(tabs)');
            }}
          />
        </>
      }
    >
      <Brand size={78} />
      <Heading title={t('ui.hubTitle')} subtitle={t('ui.hubSub')} />
      <View style={{ gap: 14, marginTop: 6 }}>
        {rows.map((r) => (
          <RowCard key={r.key} icon={r.icon} tint={r.tint} iconColor={r.color} title={r.title} subtitle={r.sub} done={r.done} onPress={() => router.push(r.to as any)} />
        ))}
      </View>
    </Page>
  );
}
