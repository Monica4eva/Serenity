import React from 'react';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import QuestionFlow, { QItem } from '../../components/QuestionFlow';

// "The stable version of me": presented gently, one question per screen,
// with save-and-finish-later on every screen.
export const EXTENDED_KEYS = [
  'sleep', 'nutrition', 'emotional', 'behaviour', 'recovery', 'relationships', 'responsibilities',
  'physical', 'cravings', 'coping', 'earlyWarning', 'bodyMeaning', 'medication', 'overwhelmed', 'safe', 'stability',
];

export default function Extended() {
  const { t, state, update } = useApp();
  const items: QItem[] = EXTENDED_KEYS.map((k) => ({ key: k, prompt: t(`extended.${k}`), kind: 'text' }));
  const save = (a: Record<string, any>) => update((s) => ({ ...s, baseline: { ...s.baseline, extended: { ...s.baseline.extended, ...a } } }));
  return (
    <QuestionFlow
      title={t('extended.title')}
      items={items}
      initial={state.baseline.extended}
      onDone={(a) => {
        save(a);
        router.back();
      }}
      onSaveLater={(a) => {
        save(a);
        router.back();
      }}
    />
  );
}
