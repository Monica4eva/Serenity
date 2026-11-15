// Health & Well-being (designer's layout).
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { dayKey, weekdayShort, dateNames } from '../../lib/dates';
import { scoreMessageKey } from '../../lib/engine';
import { dayScore, lastNDays, moodForDay, nutritionGoals, periodScore } from '../../lib/metrics';
import { Txt } from '../../components/ui';
import { Card, Page, Seg, TopBar, useDS, DS } from '../../components/ds';
import { Ring } from '../../components/Ring';
import { LineChart } from '../../components/LineChart';
import { MOODS } from '../../components/MoodRow';

const avg = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
};

export default function Health() {
  const { t, state } = useApp();
  const c = useDS();
  const [period, setPeriod] = useState('today');
  const k = dayKey();
  const n = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const days = lastNDays(n).map((d) => dayKey(d));
  const score = period === 'today' ? dayScore(state, k).score : periodScore(state, n);
  const msg = t(`health.${scoreMessageKey(score)}`);
  const dot = msg.indexOf('. ');
  const msgTitle = dot > 0 ? msg.slice(0, dot) : msg;
  const msgBody = dot > 0 ? msg.slice(dot + 2) : '';

  const sleep = avg(days.map((d) => state.dayLogs[d]?.sleepHours));
  const act = avg(days.map((d) => state.dayLogs[d]?.activityMins));
  const nut = avg(days.map((d) => nutritionGoals(state, d) ?? undefined));
  const mood = avg(days.map((d) => moodForDay(state, d)));
  const nutLevel = nut === undefined ? 'none' : nut <= 1 ? 'low' : nut < 3 ? 'fair' : 'good';
  const hm = (h: number) => t('ui.hm', { h: Math.floor(h), m: Math.round((h % 1) * 60) });
  const today = new Date();
  const names = dateNames(state.language);

  const tiles = [
    { k: 'sleep', icon: 'moon-outline', ion: true, tint: DS.tints.blue, color: '#2F5C86', title: t('health.sleep'), value: sleep !== undefined ? hm(sleep) : '—', sub: t('ui.goal79'), go: () => router.push('/sleep') },
    { k: 'act', icon: 'run-fast', tint: DS.tints.mint, color: '#2E7D4F', title: t('health.activity'), value: act !== undefined ? t('ui.minN', { n: Math.round(act) }) : '—', sub: t('ui.goal30'), go: () => router.push('/sleep?tab=activity') },
    { k: 'nut', icon: 'food-apple-outline', tint: DS.tints.yellow, color: '#8A6A1A', title: t('health.nutrition'), value: t(`ui.nutLevels.${nutLevel}`), sub: nut !== undefined ? t('ui.ofGoals', { n: Math.round(nut) }) : '', go: () => router.push('/log') },
    { k: 'mood', icon: 'emoticon-happy-outline', tint: DS.tints.purple, color: '#6A4B9A', title: t('health.moodCard'), value: mood !== undefined ? t(`baseline.moods.${MOODS[Math.round(mood)].key}`) : '—', sub: mood !== undefined ? t('ui.moodChecking') : t('ui.moodNone'), go: () => router.push('/mood') },
  ];
  const week = lastNDays(7);
  const trend = week.map((d) => {
    const s = dayScore(state, dayKey(d)).score;
    return s === null ? undefined : (s / 100) * 3;
  });
  const more = [
    { k: 'logActivity', icon: 'run-fast', tint: DS.tints.mint, color: '#2E7D4F', go: () => router.push('/log') },
    { k: 'logNutrition', icon: 'food-apple-outline', tint: DS.tints.yellow, color: '#8A6A1A', go: () => router.push('/log?focus=nutrition') },
    { k: 'syncWearable', icon: 'watch-variant', tint: DS.tints.sky, color: '#2F5C86', go: () => router.push('/devices') },
    { k: 'viewInsights', icon: 'heart-plus-outline', tint: DS.tints.purple, color: '#6A4B9A', go: () => router.push('/(tabs)/insight') },
  ];

  return (
    <Page top={<TopBar close title={t('health.title')} subtitle={t('health.subtitle')} />}>
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Seg small value={period} onChange={setPeriod} options={[{ key: 'today', label: t('health.today') }, { key: 'week', label: t('health.week') }, { key: 'month', label: t('health.month') }]} />
          </View>
          <Ionicons name="calendar-outline" size={18} color={c.title} />
          <Txt color={c.title} style={{ fontSize: 12 }}>{`${weekdayShort(today, state.language)}, ${names.monthsShort[today.getMonth()]} ${today.getDate()}`}</Txt>
        </View>
        <View style={{ backgroundColor: c.d ? '#1B2740' : '#F3F8EF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }} accessible accessibilityLabel={`${score === null ? t('health.noScore') : t('health.scoreLabel', { v: score })}. ${msg}`}>
          <Ring value={(score ?? 0) / 100} size={84} color={c.green} track={c.d ? '#22304A' : '#E3E8EC'}>
            <Txt center color={c.title} style={{ fontSize: 9.5, lineHeight: 12, maxWidth: 56 }}>{t('ui.wellScore')}</Txt>
            <Txt bold center color={c.title} style={{ fontSize: 12 }}>{score === null ? '—' : `${score}%`}</Txt>
          </Ring>
          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: c.d ? c.border : '#DCE3E8' }} />
          <View style={{ flex: 1 }}>
            <Txt bold color={c.green} style={{ fontSize: 17 }}>{msgTitle}</Txt>
            {msgBody ? <Txt color={c.title} style={{ fontSize: 12.5 }}>{msgBody}</Txt> : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tiles.map((tl) => (
            <Pressable key={tl.k} onPress={tl.go} accessibilityRole="button" accessibilityLabel={`${tl.title}: ${tl.value}. ${tl.sub}`} style={{ width: '48.5%', borderRadius: 10, borderWidth: 1, borderColor: c.d ? c.border : '#E3E8EC', backgroundColor: c.card, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.d ? '#22304A' : tl.tint, alignItems: 'center', justifyContent: 'center' }}>
                {tl.ion ? <Ionicons name={tl.icon as any} size={20} color={c.d ? '#E6ECF5' : tl.color} /> : <MaterialCommunityIcons name={tl.icon as any} size={20} color={c.d ? '#E6ECF5' : tl.color} />}
              </View>
              <View style={{ flex: 1 }}>
                <Txt color={c.title} style={{ fontSize: 12.5 }}>{tl.title}</Txt>
                <Txt bold color={c.green} style={{ fontSize: 15 }} numberOfLines={1}>{tl.value}</Txt>
                {tl.sub ? <Txt color={c.body} style={{ fontSize: 9.5, lineHeight: 12 }}>{tl.sub}</Txt> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.body} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt bold color={c.title} style={{ flex: 1, fontSize: 16 }}>{t('ui.trends')}</Txt>
          <Txt bold color={c.green} style={{ fontSize: 12 }}>{t('ui.last7')}</Txt>
        </View>
        <LineChart
          values={trend}
          labels={week.map((d) => weekdayShort(d, state.language))}
          levels={[t('ui.levelsY.low'), t('ui.levelsY.okay'), t('ui.levelsY.good'), t('ui.levelsY.great')]}
          color={c.green}
          grid={c.d ? '#2A3550' : '#EDF0F2'}
          text={c.body}
        />
        <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('ui.moreWays')}</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {more.map((m) => (
            <Pressable key={m.k} onPress={m.go} accessibilityRole="button" accessibilityLabel={t(`ui.${m.k}`)} style={{ flex: 1, minHeight: 82, borderRadius: 10, backgroundColor: c.d ? '#22304A' : m.tint, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 }}>
              <MaterialCommunityIcons name={m.icon as any} size={24} color={c.d ? '#E6ECF5' : m.color} />
              <Txt bold center color={c.title} style={{ fontSize: 10.5, lineHeight: 13 }}>{t(`ui.${m.k}`)}</Txt>
            </Pressable>
          ))}
        </View>
      </Card>
      <Txt variant="small" color={c.body}>{t('health.howBody')}</Txt>
      <Txt variant="small" color={c.body}>{t('health.contextual')}</Txt>
    </Page>
  );
}
