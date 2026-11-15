import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { BalanceAnswers, evaluateBalance, Evaluation, RULES } from '../lib/engine';
import { dayKey } from '../lib/dates';
import QuestionFlow, { QItem } from '../components/QuestionFlow';
import { Button, Card, Disclaimer, LevelBadge, Screen, Txt } from '../components/ui';
import SafetyPrompt from '../components/SafetyPrompt';

export default function Balance() {
  const { t, state, update, theme } = useApp();
  const [result, setResult] = useState<(Evaluation & { answers: BalanceAnswers }) | null>(null);
  const [safetyAsked, setSafetyAsked] = useState(false);

  if (!result) {
    const items: QItem[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      key: `q${n}`,
      prompt: t(`balance.q${n}`),
      kind: 'choice',
      options: (t(`balance.a${n}`) as string[]).map((label, i) => ({ key: String(i), label })),
    }));
    return (
      <QuestionFlow
        title={t('balance.title')}
        items={items}
        onDone={(a) => {
          // A skipped safety question (q8) counts as "not sure", so a gentle safety check follows.
          const answers = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => Number(a[`q${n}`] ?? (n === 8 ? 1 : 0))) as BalanceAnswers;
          const history = state.checkins.filter((c) => c.type === 'balance').map((c) => ({ score: c.score ?? 0 }));
          const log = state.dayLogs[dayKey()];
          const baselineSleep = state.baseline.sleepHours;
          const ev = evaluateBalance(answers, history, { sleepHours: log?.sleepHours, baselineSleep });
          update((s) => ({
            ...s,
            checkins: [
              ...s.checkins,
              { id: uid(), type: 'balance', answers: { answers, rules: RULES.version }, level: ev.level, reasons: ev.reasons, score: ev.score, at: new Date().toISOString() },
            ],
          }));
          setResult({ ...ev, answers });
        }}
      />
    );
  }

  const bodyKey = result.level === 'green' ? (result.hardDay ? 'greenHard' : 'greenBody') : `${result.level}Body`;
  const actionable = result.reasons.filter((r) => t(`responses.${r}`) !== `responses.${r}`);

  return (
    <Screen title={t('balance.summary')} footer={<Button title={t('common.done')} onPress={() => router.replace('/(tabs)')} />}>
      {result.needsSafetyQuestion && !safetyAsked ? (
        <SafetyPrompt signal="crisis" context="balance" onClose={() => setSafetyAsked(true)} />
      ) : null}
      <LevelBadge level={result.level} />
      <Txt variant="h3">{t(`levels.${bodyKey}`)}</Txt>
      {result.reasons.length ? (
        <Card>
          <Txt variant="h3">{t('levels.why')}</Txt>
          {result.reasons.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
              <Ionicons name="ellipse" size={8} color={theme.colors.body} style={{ marginTop: 9 }} />
              <Txt style={{ flex: 1 }}>{t(`reasons.${r}`)}</Txt>
            </View>
          ))}
        </Card>
      ) : null}
      {result.level !== 'green' && actionable.length ? (
        <Card style={{ backgroundColor: theme.colors.selected }}>
          {actionable.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
              <Ionicons name="arrow-forward-circle" size={20} color={theme.colors.success} />
              <Txt style={{ flex: 1 }}>
                {t(`responses.${r}`)}
              </Txt>
            </View>
          ))}
        </Card>
      ) : null}
      {result.level === 'amber' ? (
        <>
          {result.reasons.includes('cravings') || result.reasons.includes('severeCraving') ? (
            <Button title={t('hub.craving')} onPress={() => router.push('/crisis?mode=craving')} />
          ) : null}
          <Button variant="secondary" title={t('tabs.support')} onPress={() => router.push('/(tabs)/support')} />
          <Button variant="secondary" title={t('activities.title')} onPress={() => router.push('/activities')} />
        </>
      ) : null}
      <Disclaimer text={t('levels.disclaimer')} />
    </Screen>
  );
}
