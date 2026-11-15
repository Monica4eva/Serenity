// Sleep & Activity Tracking (designer's layout). Sleep stages need a wearable, so we show a note.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { dayKey, weekdayShort } from '../lib/dates';
import { lastNDays } from '../lib/metrics';
import { Txt } from '../components/ui';
import { Page, Pill, Seg, TopBar, useDS } from '../components/ds';
import { Ring } from '../components/Ring';

const avg = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
};

export default function Sleep() {
  const { t, state } = useApp();
  const c = useDS();
  const q = useLocalSearchParams<{ tab?: string }>();
  const [period, setPeriod] = useState('today');
  const [tab, setTab] = useState(q.tab === 'activity' ? 'activity' : 'sleep');
  const n = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const keys = lastNDays(n).map((d) => dayKey(d));
  const today = state.dayLogs[dayKey()] ?? {};
  const sleep = avg(keys.map((k) => state.dayLogs[k]?.sleepHours));
  const act = avg(keys.map((k) => state.dayLogs[k]?.activityMins));
  const steps = avg(keys.map((k) => state.dayLogs[k]?.steps));
  const hm = (h: number) => t('ui.hm', { h: Math.floor(h), m: Math.round((h % 1) * 60) });
  const week = lastNDays(7);
  const series = week.map((d) => state.dayLogs[dayKey(d)]?.[tab === 'sleep' ? 'sleepHours' : 'activityMins']);
  const max = tab === 'sleep' ? 10 : 60;
  const insight =
    sleep === undefined && act === undefined
      ? t('ui.insNoData')
      : sleep !== undefined
        ? sleep >= 7 && sleep <= 9
          ? t('ui.insGood', { t: hm(sleep) })
          : sleep >= 6
            ? t('ui.insClose', { t: hm(sleep) })
            : t('ui.insLow', { t: hm(sleep) })
        : t('ui.insActive', { n: Math.round(act!) });

  return (
    <Page plain top={<TopBar close title={t('ui.sleepTitle')} subtitle={t('ui.sleepSub')} />} footer={<Pill title={t('ui.logTitle')} variant="green" onPress={() => router.push('/log')} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Seg small value={period} onChange={setPeriod} options={[{ key: 'today', label: t('health.today') }, { key: 'week', label: t('health.week') }, { key: 'month', label: t('health.month') }]} />
        </View>
        <Pressable onPress={() => router.push('/devices')} accessibilityRole="button" accessibilityLabel={t('ui.syncWearable')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
          <Ionicons name="square-outline" size={18} color={c.body} />
          <Txt color={c.title} style={{ fontSize: 12 }}>{t('ui.syncWearable')}</Txt>
        </Pressable>
      </View>

      <View style={{ backgroundColor: c.d ? '#1B2740' : '#FFFBF8', borderRadius: 16, borderWidth: 1, borderColor: c.d ? c.border : '#E4DDF0', padding: 14, flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.d ? '#22304A' : '#DCEBF7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="moon-outline" size={20} color={c.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('health.sleep')}</Txt>
              <Txt color={c.body} style={{ fontSize: 10.5 }}>{t('ui.sleepCardSub')}</Txt>
            </View>
          </View>
          <Txt bold color={c.green} style={{ fontSize: 26 }}>{sleep !== undefined ? hm(sleep) : '—'}</Txt>
          <Txt color={c.body} style={{ fontSize: 11 }}>{t('ui.ofSleepGoal')}</Txt>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
          {today.bedtime && today.wake ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt color={c.title} style={{ fontSize: 12 }}>{today.bedtime}</Txt>
              <Txt color={c.title} style={{ fontSize: 12 }}>{today.wake}</Txt>
            </View>
          ) : null}
          <Txt color={c.body} style={{ fontSize: 11 }}>{t('ui.stagesNote')}</Txt>
        </View>
      </View>

      <View style={{ backgroundColor: c.d ? '#1D3328' : '#F1F9F2', borderRadius: 16, borderWidth: 1, borderColor: c.d ? '#2E5A40' : '#D3EAD8', padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1.2, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.d ? '#22304A' : '#DDF0DF', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="run-fast" size={20} color={c.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('ui.activityTitle')}</Txt>
              <Txt color={c.body} style={{ fontSize: 10.5 }}>{t('ui.activitySub')}</Txt>
            </View>
          </View>
          <Txt bold color={c.green} style={{ fontSize: 26 }}>{act !== undefined ? t('ui.minN', { n: Math.round(act) }) : '—'}</Txt>
          <Txt color={c.body} style={{ fontSize: 11 }}>{t('ui.ofActGoal')}</Txt>
        </View>
        <Ring value={(act ?? 0) / 30} size={84} stroke={9} color={c.green} track={c.d ? '#22304A' : '#DCEFE2'}>
          <Txt bold color={c.green} style={{ fontSize: 17 }}>{`${Math.min(100, Math.round(((act ?? 0) / 30) * 100))}%`}</Txt>
        </Ring>
        <View style={{ gap: 8 }}>
          <View>
            <Txt bold color={c.title} style={{ fontSize: 13 }}>{steps !== undefined ? Math.round(steps).toLocaleString('en') : '—'}</Txt>
            <Txt color={c.body} style={{ fontSize: 10 }}>{t('ui.steps')}</Txt>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt bold color={c.title} style={{ flex: 1, fontSize: 17 }}>{t('ui.yourTrends')}</Txt>
        <View style={{ width: 160 }}>
          <Seg small value={tab} onChange={setTab} options={[{ key: 'sleep', label: t('ui.sleepTab') }, { key: 'activity', label: t('ui.activityTab') }]} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', height: 170, gap: 6 }} accessible accessibilityLabel={week.map((d, i) => `${weekdayShort(d, state.language)} ${series[i] === undefined ? t('common.noData') : tab === 'sleep' ? hm(series[i]!) : t('ui.minN', { n: series[i]! })}`).join(', ')}>
        <View style={{ justifyContent: 'space-between', paddingBottom: 18 }}>
          {[5, 4, 3, 2, 1, 0].map((i) => (
            <Txt key={i} color={c.body} style={{ fontSize: 9.5 }}>{tab === 'sleep' ? `${i * 2}h` : `${i * 12}`}</Txt>
          ))}
        </View>
        {week.map((d, i) => {
          const v = series[i];
          const last = i === week.length - 1;
          return (
            <View key={i} style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              {v !== undefined ? <Txt color={c.title} style={{ fontSize: 8.5 }}>{tab === 'sleep' ? hm(v) : `${v}m`}</Txt> : null}
              <View style={{ width: '100%', height: v !== undefined ? Math.max(4, (Math.min(v, max) / max) * 130) : 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: v === undefined ? (c.d ? '#22304A' : '#E3E8EC') : last ? '#0C6434' : v >= (tab === 'sleep' ? 7 : 30) ? '#4B9A62' : '#8CCB97' }} />
              <Txt color={c.body} style={{ fontSize: 9.5, marginTop: 4 }}>{weekdayShort(d, state.language)}</Txt>
            </View>
          );
        })}
      </View>

      <View style={{ backgroundColor: c.d ? '#1D3328' : '#F1F9F2', borderRadius: 14, borderWidth: 1, borderColor: c.d ? '#2E5A40' : '#D3EAD8', padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.d ? '#22304A' : '#DDF0DF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles-outline" size={22} color={c.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.title} style={{ fontSize: 15 }}>{t('ui.todaysInsight')}</Txt>
          <Txt color={c.title} style={{ fontSize: 12 }} accessibilityLiveRegion="polite">{insight}</Txt>
        </View>
      </View>
    </Page>
  );
}
