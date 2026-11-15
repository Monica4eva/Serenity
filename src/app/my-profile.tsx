import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { announce } from '../components/ui';
import { FieldBox, Page, Pill, RowCard, SectionLabel, TopBar } from '../components/ds';

export default function MyProfile() {
  const { t, state, update } = useApp();
  const [name, setName] = useState(state.profile.preferredName);
  const [vision, setVision] = useState(state.profile.sixMonthVision ?? '');
  const save = () => {
    update((s) => ({ ...s, profile: { ...s.profile, preferredName: name.trim(), sixMonthVision: vision } }));
    announce(t('common.saved'));
    router.back();
  };
  const links = [
    { k: 'details', label: t('ui.hubDetails'), to: '/onboarding/details' },
    { k: 'goals', label: t('ui.hubGoals'), to: '/onboarding/goals' },
    { k: 'approach', label: t('ui.hubApproach'), to: '/onboarding/approach' },
    { k: 'network', label: t('ui.hubNetwork'), to: '/onboarding/network' },
    { k: 'relapse', label: t('ui.hubRelapse'), to: '/onboarding/extended' },
    { k: 'agreement', label: t('ui.agreementRow'), to: '/agreement' },
    { k: 'safety', label: t('ui.safetyPlan'), to: '/safety-plan' },
    { k: 'triggers', label: t('ui.triggerRow'), to: '/triggers' },
    { k: 'dims', label: t('ui.dimensionsRow'), to: '/dimensions' },
  ];
  return (
    <Page top={<TopBar close title={t('ui.myProfile')} />} footer={<Pill title={t('common.save')} onPress={save} />}>
      <FieldBox label={t('ui.preferredName')} value={name} onChangeText={setName} />
      <FieldBox label={t('ui.sixMonth')} value={vision} onChangeText={setVision} multiline />
      <SectionLabel>{t('ui.hubTitle')}</SectionLabel>
      <View style={{ gap: 10 }}>
        {links.map((l) => (
          <RowCard key={l.k} title={l.label} onPress={() => router.push(l.to as any)} />
        ))}
      </View>
    </Page>
  );
}
