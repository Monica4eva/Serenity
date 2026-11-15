// One-question-per-screen flow with progress, skip, save-and-resume and voice-first
// read-aloud (Section 3A: short, one question per screen, no time limits).
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useApp } from '../lib/useApp';
import { Button, Chip, Field, ListenButton, ProgressBar, Radio, Screen, Txt } from './ui';

export type QItem = {
  key: string;
  prompt: string;
  kind: 'text' | 'choice' | 'multi';
  options?: { key: string; label: string }[];
  required?: boolean;
  requiredMsg?: string;
};

export default function QuestionFlow({
  items,
  initial = {},
  onDone,
  onSaveLater,
  title,
  startIndex = 0,
}: {
  items: QItem[];
  initial?: Record<string, any>;
  onDone: (answers: Record<string, any>) => void;
  onSaveLater?: (answers: Record<string, any>, index: number) => void;
  title?: string;
  startIndex?: number;
}) {
  const { t, state, speak } = useApp();
  const [i, setI] = useState(Math.min(startIndex, items.length - 1));
  const [answers, setAnswers] = useState<Record<string, any>>(initial);
  const [err, setErr] = useState('');
  const q = items[i];
  const val = answers[q.key];

  useEffect(() => {
    if (state.settings.voiceFirst) speak(q.prompt);
  }, [i]);

  const set = (v: any) => {
    setErr('');
    setAnswers({ ...answers, [q.key]: v });
  };
  const empty = val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
  const next = () => {
    // No question is ever mandatory: an empty answer just moves on (like Skip).
    if (i < items.length - 1) setI(i + 1);
    else onDone(answers);
  };
  const skip = () => {
    if (i < items.length - 1) setI(i + 1);
    else onDone(answers);
  };

  return (
    <Screen
      title={title}
      footer={
        <>
          <Button title={i < items.length - 1 ? t('common.next') : t('common.done')} onPress={next} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {i > 0 ? (
              <View style={{ flex: 1 }}>
                <Button variant="ghost" title={t('common.back')} onPress={() => setI(i - 1)} />
              </View>
            ) : null}
            {true ? (
              <View style={{ flex: 1 }}>
                <Button variant="ghost" title={t('common.skip')} onPress={skip} />
              </View>
            ) : null}
          </View>
          {onSaveLater ? <Button variant="ghost" title={t('common.saveLater')} onPress={() => onSaveLater(answers, i)} /> : null}
        </>
      }
    >
      <Txt variant="small">{t('common.progress', { n: i + 1, total: items.length })}</Txt>
      <ProgressBar value={(i + 1) / items.length} />
      <Txt variant="h2" accessibilityLiveRegion="polite">
        {q.prompt}
      </Txt>
      <ListenButton text={q.prompt} />
      {q.kind === 'text' ? (
        <Field hideLabel label={q.prompt} value={val ?? ''} onChangeText={set} multiline placeholder={t('intro.placeholder')} error={err} />
      ) : null}
      {q.kind === 'choice'
        ? q.options!.map((o) => <Radio key={o.key} label={o.label} selected={val === o.key} onPress={() => set(o.key)} />)
        : null}
      {q.kind === 'multi' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {q.options!.map((o) => {
            const sel = Array.isArray(val) && val.includes(o.key);
            return (
              <Chip
                key={o.key}
                label={o.label}
                selected={sel}
                onPress={() => set(sel ? val.filter((x: string) => x !== o.key) : [...(val ?? []), o.key])}
              />
            );
          })}
        </View>
      ) : null}
      {err && q.kind !== 'text' ? <Txt color="#D64545">{err}</Txt> : null}
    </Screen>
  );
}
