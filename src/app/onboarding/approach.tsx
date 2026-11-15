import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import type { Approach as A } from '../../lib/store';
import { Brand, Heading, OptionCard, Page, Pill, TextLink, TopBar } from '../../components/ds';

const OPTIONS: { key: A; label: string }[] = [
  { key: '12step', label: 'twelve' },
  { key: 'pillars', label: 'pillars' },
  { key: 'wellbeing', label: 'wellbeing' },
  { key: 'community', label: 'community' },
  { key: 'lifeskills', label: 'lifeskills' },
];

export default function Approach() {
  const { t, state, update } = useApp();
  const set = (approach: A) => update((s) => ({ ...s, approach }));
  return (
    <Page
      top={<TopBar />}
      footer={
        <>
          <Pill title={t('common.continue')} onPress={() => router.back()} />
          <TextLink title={t('common.saveLater')} onPress={() => router.back()} />
        </>
      }
    >
      <Brand wordmark={false} size={90} />
      <Heading small title={t('approach.title')} subtitle={t('ui.apprSub')} />
      <View style={{ gap: 14 }} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => (
          <OptionCard key={o.key} title={t(`ui.approaches.${o.label}`)} desc={t(`ui.approaches.${o.label}Desc`)} selected={state.approach === o.key} onPress={() => set(o.key)} />
        ))}
      </View>
    </Page>
  );
}
