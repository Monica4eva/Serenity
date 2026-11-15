import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import QuestionFlow, { QItem } from '../../components/QuestionFlow';
import { Button, ListenButton, Screen, Txt } from '../../components/ui';
import Logo from '../../components/Logo';

export default function Intro() {
  const { t, state, update } = useApp();
  const [started, setStarted] = useState(false);

  if (!started)
    return (
      <Screen back={false} footer={<Button title={t('intro.begin')} onPress={() => setStarted(true)} />}>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Logo size={90} />
        </View>
        <Txt variant="h3">{t('intro.opening')}</Txt>
        <ListenButton text={t('intro.opening')} />
      </Screen>
    );

  const yn = [
    { key: 'yes', label: t('common.yes') },
    { key: 'no', label: t('common.no') },
    { key: 'unsure', label: t('balance.safetyUnsure') },
  ];
  const items: QItem[] = [
    { key: 'name', prompt: t('intro.q1'), kind: 'text' },
    { key: 'why', prompt: t('intro.q2'), kind: 'text' },
    { key: 'beyond', prompt: t('intro.q3'), kind: 'text' },
    { key: 'takenAway', prompt: t('intro.q4'), kind: 'text' },
    { key: 'regain', prompt: t('intro.q5'), kind: 'text' },
    { key: 'afraid', prompt: t('intro.q6'), kind: 'text' },
    { key: 'hopeful', prompt: t('intro.q7'), kind: 'text' },
    { key: 'proSupport', prompt: t('intro.q8'), kind: 'choice', options: yn },
    { key: 'hasPro', prompt: t('intro.q9'), kind: 'choice', options: yn },
    {
      key: 'needs',
      prompt: t('intro.q10'),
      kind: 'multi',
      options: ['encouragement', 'accountability', 'checkins', 'reminders', 'patterns'].map((k) => ({ key: k, label: t(`intro.needs.${k}`) })),
    },
    { key: 'vision', prompt: t('intro.signature'), kind: 'text' },
  ];

  const save = (a: Record<string, any>) =>
    update((s) => ({
      ...s,
      profile: {
        preferredName: (a.name || s.profile.preferredName || '').trim(),
        answers: { ...s.profile.answers, ...a },
        supportNeeds: a.needs ?? s.profile.supportNeeds,
        sixMonthVision: a.vision ?? s.profile.sixMonthVision,
      },
    }));

  return (
    <QuestionFlow
      items={items}
      initial={{ name: state.profile.preferredName, ...state.profile.answers }}
      onDone={(a) => {
        save(a);
        update((s) => ({ ...s, onboarded: true }));
        router.replace('/(tabs)');
      }}
      onSaveLater={(a) => {
        save(a);
        update((s) => ({ ...s, onboarded: true }));
        router.replace('/(tabs)');
      }}
    />
  );
}
