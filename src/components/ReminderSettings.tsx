// Settings for adaptive reminders: shows the time Serenity has learned, the current tone,
// and lets the person set quiet hours. Only shown when reminders are on.
import React from 'react';
import { Platform, View } from 'react-native';
import { useApp } from '../lib/useApp';
import { useLogoState } from '../lib/useLogoState';
import { reminderPlan } from '../lib/reminders';
import { Txt } from './ui';
import { Select, useDS } from './ds';

const pad = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: `${pad(h)}:00` }));

export function ReminderSettings() {
  const { t, state, update } = useApp();
  const c = useDS();
  const logo = useLogoState();
  const s = state.settings;
  if (!s.reminders) return null;
  const p = reminderPlan(state, logo.state);
  const set = (patch: Partial<typeof s>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  return (
    <View style={{ gap: 8, paddingLeft: 4, borderLeftWidth: 3, borderLeftColor: c.green, paddingVertical: 4 }}>
      <Txt color={c.title}>
        {t(p.learned ? 'remind.timeLearned' : 'remind.timeDefault', { time: `${pad(p.hour)}:${pad(p.minute)}` })}
      </Txt>
      <Txt variant="small" color={c.body}>{t(`remind.kindNote.${p.kind}`)}</Txt>
      {p.adjusted ? <Txt variant="small" color={c.body}>{t(`remind.adjusted.${p.adjusted}`)}</Txt> : p.everyOtherDay ? <Txt variant="small" color={c.body}>{t('remind.everyOther')}</Txt> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Select label={t('remind.quietFrom')} value={String(s.quietFrom ?? 22)} options={HOURS} onChange={(k) => set({ quietFrom: Number(k) })} compact />
        </View>
        <View style={{ flex: 1 }}>
          <Select label={t('remind.quietTo')} value={String(s.quietTo ?? 7)} options={HOURS} onChange={(k) => set({ quietTo: Number(k) })} compact />
        </View>
      </View>
      <Txt variant="small" color={c.body}>{t(Platform.OS === 'web' ? 'remind.webNote' : 'remind.phoneNote')}</Txt>
    </View>
  );
}
