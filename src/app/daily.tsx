import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { scanText } from '../lib/engine';
import QuestionFlow, { QItem } from '../components/QuestionFlow';
import { Button, Card, Screen, Txt } from '../components/ui';
import SafetyPrompt from '../components/SafetyPrompt';

// The "Serenity daily flow" (Section 7.1).
export default function Daily() {
  const { t, update, state } = useApp();
  const [done, setDone] = useState<Record<string, any> | null>(null);
  const ymn = [
    { key: 'yes', label: t('common.yes') },
    { key: 'mostly', label: t('daily.mostly') },
    { key: 'no', label: t('daily.notReally') },
  ];
  const items: QItem[] = [
    { key: 'hello', prompt: t('daily.hello'), kind: 'choice', options: ['stressed', 'anxious', 'okay', 'calm', 'great'].map((k) => ({ key: k, label: t(`baseline.moods.${k}`) })) },
    { key: 'body', prompt: t('daily.body'), kind: 'choice', options: ymn },
    { key: 'halt', prompt: t('daily.halt'), kind: 'multi', options: ['hunger', 'anger', 'loneliness', 'tiredness'].map((k) => ({ key: k, label: t(`baseline.haltItems.${k}`) })) },
    { key: 'ppt', prompt: t('daily.ppt'), kind: 'choice', options: [{ key: 'no', label: t('common.no') }, { key: 'yes', label: t('common.yes') }] },
    { key: 'behaviour', prompt: t('daily.behaviour'), kind: 'choice', options: ymn },
    { key: 'cravings', prompt: t('daily.cravings'), kind: 'choice', options: ['none', 'moderate', 'strong'].map((k) => ({ key: k, label: t(`baseline.craving.${k}`) })) },
    {
      key: 'support',
      prompt: t('daily.support'),
      kind: 'choice',
      options: ['needEncourage', 'needCoping', 'needMeeting', 'needPro', 'needNothing'].map((k) => ({ key: k, label: t(`daily.${k}`) })),
    },
    { key: 'intention', prompt: t('daily.intention'), kind: 'text' },
  ];
  if (!done)
    return (
      <QuestionFlow
        title={t('daily.title')}
        items={items}
        onDone={(a) => {
          update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'daily', answers: a, at: new Date().toISOString() }] }));
          setDone(a);
        }}
      />
    );

  const signal = scanText(done.intention ?? '');
  return (
    <Screen title={t('daily.title')} footer={<Button title={t('common.done')} onPress={() => router.replace('/(tabs)')} />}>
      <SafetyPrompt signal={signal} context="daily" onClose={() => {}} />
      {done.intention ? (
        <Card>
          <Txt variant="h3">{t('daily.intention')}</Txt>
          <Txt>{done.intention}</Txt>
        </Card>
      ) : null}
      {done.cravings === 'strong' ? <Button title={t('hub.craving')} onPress={() => router.push('/crisis?mode=craving')} /> : null}
      {done.support === 'needCoping' ? <Button title={t('activities.title')} onPress={() => router.push('/activities')} /> : null}
      {done.support === 'needMeeting' || done.support === 'needPro' ? <Button title={t('tabs.support')} onPress={() => router.push('/(tabs)/support')} /> : null}
      {done.support === 'needEncourage' ? (
        <Card>
          <Txt variant="h3">{t('levels.greenBody')}</Txt>
          {state.profile.sixMonthVision ? <Txt>“{state.profile.sixMonthVision}”</Txt> : null}
        </Card>
      ) : null}
      <Button variant="secondary" title={t('balance.title')} onPress={() => router.push('/balance')} />
    </Screen>
  );
}
