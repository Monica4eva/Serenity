import React from 'react';
import { displayName } from '../../lib/names';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { dayKey, dayMonthShort, weekdayLong } from '../../lib/dates';
import { cravingPeakDay, sleepCravingLink } from '../../lib/engine';
import { cravingForDay, lastNDays, moodForDay } from '../../lib/metrics';
import { Bars } from '../../components/Charts';
import { Button, Card, Disclaimer, LevelBadge, Screen, Txt } from '../../components/ui';
import { DIMENSIONS } from '../../lib/constants';

export default function Insight() {
  const { t, state, theme } = useApp();
  const days14 = lastNDays(14);
  const days30 = lastNDays(30);
  const month = new Set(days30.map((d) => dayKey(d)));

  // Pattern recognition in plain language
  const points = days30
    .map((d) => {
      const k = dayKey(d);
      const c = cravingForDay(state, k);
      return c === undefined ? null : { at: d.toISOString(), craving: c, sleepHours: state.dayLogs[k]?.sleepHours };
    })
    .filter(Boolean) as { at: string; craving: number; sleepHours?: number }[];
  const halts = state.checkins.filter((c) => c.type === 'halt' && month.has(dayKey(new Date(c.at))));
  const count = (k: string) => halts.filter((h) => (h.answers[k] ?? 0) > 0).length;
  const checkDays7 = new Set(state.checkins.filter((c) => c.type !== 'baseline').map((c) => dayKey(new Date(c.at))));
  const streak = lastNDays(7).filter((d) => checkDays7.has(dayKey(d))).length;

  const patterns: string[] = [];
  const peak = cravingPeakDay(points);
  if (peak !== null) {
    const ref = new Date(2026, 10, 8 + peak); // 8 Nov 2026 is a Sunday (index 0)
    patterns.push(t('insight.patternCravingDay', { day: weekdayLong(ref, state.language) }));
  }
  if (sleepCravingLink(points)) patterns.push(t('insight.patternSleepCraving'));
  if (count('loneliness') >= 3) patterns.push(t('insight.patternLonely', { n: count('loneliness') }));
  if (count('tiredness') >= 3) patterns.push(t('insight.patternTired', { n: count('tiredness') }));
  if (streak >= 3) patterns.push(t('insight.patternStreak', { n: streak }));

  const levels = state.checkins.filter((c) => c.level).slice(-7).reverse();
  const lastDim = (d: string) => [...state.dimensions].reverse().find((x) => x.dimension === d);

  const exportSummary = () => {
    const none = t('insight.sum.none');
    const lines = [
      t('insight.sum.title', { name: displayName(state) || t('insight.sum.me') }),
      t('insight.sum.days', { n: Math.round((Date.now() - new Date(state.recoveryStart).getTime()) / 86400000) }),
      t('insight.sum.checkins', { n: streak }),
      t('insight.sum.levels', { list: levels.map((l) => `${dayMonthShort(new Date(l.at), state.language)} ${t(`levels.${l.level}`)}`).join(', ') || none }),
      t('insight.sum.patterns', { list: patterns.join(' ') || none }),
      t('insight.sum.halt', { h: count('hunger'), a: count('anger'), l: count('loneliness'), t: count('tiredness') }),
      t('insight.sum.dims', { list: DIMENSIONS.map((d) => `${t(`dimensions.${d}`)} ${lastDim(d)?.score ?? '-'}/5`).join(', ') }),
      '',
      t('insight.sum.note'),
    ];
    Share.share({ message: lines.join('\n') });
  };

  return (
    <Screen back={false} title={t('insight.title')}>
      <Txt center>{t('insight.subtitle')}</Txt>

      <Card style={{ backgroundColor: theme.colors.selected }}>
        <Txt variant="h3">{t('insight.vision')}</Txt>
        <Txt>{state.profile.sixMonthVision ? `“${state.profile.sixMonthVision}”` : t('insight.noVision')}</Txt>
      </Card>

      <Card>
        <Txt variant="h3">{t('insight.patterns')}</Txt>
        {patterns.length === 0 ? <Txt>{t('insight.noPatterns')}</Txt> : null}
        {patterns.map((p) => (
          <View key={p} style={{ flexDirection: 'row', gap: 8 }}>
            <Ionicons name="bulb-outline" size={20} color={theme.colors.orange} />
            <Txt style={{ flex: 1 }}>{p}</Txt>
          </View>
        ))}
      </Card>

      <Card>
        <Txt variant="h3">{t('insight.moodTrend')}</Txt>
        <Bars days={days14} values={days14.map((d) => { const m = moodForDay(state, dayKey(d)); return m === undefined ? undefined : m + 1; })} max={5} unit="/5" color={theme.colors.teal} />
      </Card>

      <Card>
        <Txt variant="h3">{t('insight.haltFreq')}</Txt>
        {(['hunger', 'anger', 'loneliness', 'tiredness'] as const).map((k) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt>{t(`halt.${k}`)}</Txt>
            <Txt bold>{count(k)}</Txt>
          </View>
        ))}
      </Card>

      <Card>
        <Txt variant="h3">{t('insight.levels')}</Txt>
        {levels.length === 0 ? <Txt>{t('insight.noPatterns')}</Txt> : null}
        {levels.map((l) => (
          <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Txt variant="small" style={{ width: 90 }}>
              {dayMonthShort(new Date(l.at), state.language)}
            </Txt>
            <LevelBadge level={l.level!} />
          </View>
        ))}
        <Disclaimer text={t('levels.disclaimer')} />
      </Card>

      <Card>
        <Txt variant="h3">{t('insight.dimensions')}</Txt>
        {DIMENSIONS.map((d) => (
          <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt>{t(`dimensions.${d}`)}</Txt>
            <Txt bold>{lastDim(d) ? `${lastDim(d)!.score}/5` : '–'}</Txt>
          </View>
        ))}
        <Button variant="secondary" title={t('insight.rate')} onPress={() => router.push('/dimensions')} />
      </Card>

      <Button icon="share-outline" title={t('insight.export')} onPress={exportSummary} />
      <Txt variant="small">{t('insight.exportNote')}</Txt>
    </Screen>
  );
}
