import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { dayKey, timeOfDay } from '../lib/dates';
import { scanText, TextSignal } from '../lib/engine';
import { Button, Field, Screen, Segmented, announce } from '../components/ui';
import SafetyPrompt from '../components/SafetyPrompt';

const Q = { morning: ['m1', 'm2'], afternoon: ['a1', 'a2'], evening: ['e1', 'e2', 'e3'] } as const;

export default function Rhythm() {
  const { t, state, update } = useApp();
  const q = useLocalSearchParams<{ part?: string }>();
  const [part, setPart] = useState<keyof typeof Q>(((q.part && q.part in Q ? q.part : timeOfDay()) as keyof typeof Q));
  const existing = state.checkins.find((c) => c.type === 'rhythm' && c.answers.part === part && dayKey(new Date(c.at)) === dayKey());
  const [a, setA] = useState<Record<string, string>>(existing?.answers ?? {});
  const [signal, setSignal] = useState<TextSignal>('none');

  const save = () => {
    update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'rhythm', answers: { ...a, part }, at: new Date().toISOString() }] }));
    announce(t('common.saved'));
    const sig = scanText(Object.values(a).join(' '));
    if (sig === 'none') router.back();
    else setSignal(sig);
  };

  return (
    <Screen title={t('rhythm.title')} footer={signal === 'none' ? <Button title={t('common.save')} onPress={save} /> : undefined}>
      <Segmented
        value={part}
        onChange={(k) => { setPart(k as keyof typeof Q); setA({}); }}
        options={(['morning', 'afternoon', 'evening'] as const).map((k) => ({ key: k, label: t(`rhythm.${k}`) }))}
      />
      {Q[part].map((q) => (
        <Field key={q} label={t(`rhythm.${q}`)} value={a[q] ?? ''} onChangeText={(v) => setA({ ...a, [q]: v })} multiline placeholder={t('intro.placeholder')} />
      ))}
      <SafetyPrompt signal={signal} context="rhythm" onClose={() => router.back()} />
    </Screen>
  );
}
