// Log my day: sleep (bedtime and wake-up), activity, steps, meals and water.
import React, { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { dayKey } from '../lib/dates';
import { Txt, announce } from '../components/ui';
import { Card, Page, Pill, TopBar, useDS } from '../components/ds';
import { Stepper } from '../components/MoodRow';

const toHM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const fromHM = (s?: string, def = '22:30') => {
  const [h, m] = (s ?? def).split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
/** Hours between bedtime and wake-up, crossing midnight if needed. */
const sleepBetween = (bed: string, wake: string) => {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
};

export default function Log() {
  const { t, state, update } = useApp();
  const c = useDS();
  const k = dayKey();
  const cur = state.dayLogs[k] ?? {};
  const [bed, setBed] = useState(cur.bedtime ?? '22:30');
  const [wake, setWake] = useState(cur.wake ?? '06:30');
  const [pick, setPick] = useState<'bed' | 'wake' | null>(null);
  const [mins, setMins] = useState(cur.activityMins ?? 0);
  const [steps, setSteps] = useState(cur.steps ? String(cur.steps) : '');
  const [meals, setMeals] = useState(cur.meals ?? 0);
  const [water, setWater] = useState(cur.water ?? 0);
  const hours = sleepBetween(bed, wake);

  const save = () => {
    update((s) => ({
      ...s,
      dayLogs: { ...s.dayLogs, [k]: { ...s.dayLogs[k], bedtime: bed, wake, sleepHours: hours, activityMins: mins, steps: steps ? Math.min(200000, Number(steps.replace(/\D/g, '')) || 0) : undefined, meals, water } },
    }));
    announce(t('common.saved'));
    router.back();
  };

  const TimeBtn = ({ which, label, value }: { which: 'bed' | 'wake'; label: string; value: string }) => (
    <Pressable onPress={() => setPick(which)} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, minHeight: 56, borderRadius: 12, borderWidth: 1, borderColor: c.d ? c.border : '#D5DCE2', backgroundColor: c.card, padding: 10 }}>
      <Txt variant="small" color={c.body}>{label}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={which === 'bed' ? 'moon-outline' : 'sunny-outline'} size={16} color={c.navy} />
        <Txt bold color={c.title} style={{ fontSize: 18 }}>{value}</Txt>
      </View>
    </Pressable>
  );

  return (
    <Page top={<TopBar close title={t('ui.logTitle')} subtitle={t('ui.logSub')} />} footer={<Pill title={t('common.save')} variant="green" onPress={save} />}>
      <Card cream>
        <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('health.sleep')}</Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TimeBtn which="bed" label={t('ui.bedtime')} value={bed} />
          <TimeBtn which="wake" label={t('ui.wakeup')} value={wake} />
        </View>
        <Txt bold color={c.green}>{t('ui.hm', { h: Math.floor(hours), m: Math.round((hours % 1) * 60) })}</Txt>
        {pick ? (
          <DateTimePicker
            value={fromHM(pick === 'bed' ? bed : wake)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              setPick(Platform.OS === 'ios' ? pick : null);
              if (e.type !== 'dismissed' && d) (pick === 'bed' ? setBed : setWake)(toHM(d));
            }}
          />
        ) : null}
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('health.activity')}</Txt>
        <Stepper label={t('health.minutes', { n: mins })} value={mins} onChange={setMins} max={600} />
        <Txt color={c.body}>{t('ui.stepsLabel')}</Txt>
        <TextInput value={steps} onChangeText={setSteps} keyboardType="number-pad" accessibilityLabel={t('ui.stepsLabel')} placeholder="0" placeholderTextColor="#8E959C" style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: c.d ? c.border : '#D5DCE2', paddingHorizontal: 12, fontSize: 16, color: c.title, backgroundColor: c.card }} />
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('health.nutrition')}</Txt>
        <Stepper label={t('health.meals', { n: meals })} value={meals} onChange={setMeals} max={6} />
        <Stepper label={t('health.glasses', { n: water })} value={water} onChange={setWater} max={15} />
      </Card>
    </Page>
  );
}
