// My plan: a personalised habit plan. Pick up to four habits and how many days a week; progress
// fills in by itself from what is already logged, and once a week the plan suggests a gentle
// change (one more day after a good week, one fewer after a hard one). The person decides.
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { Txt } from '../components/ui';
import { Card, Heading, OptionCard, Page, Pill, SectionLabel, TextLink, ToggleRow, TopBar, useDS } from '../components/ds';
import { addDays, dayKey, startOfWeek } from '../lib/dates';
import { AMOUNTS, applyAdjustments, doneOn, HABIT_ICON, HABIT_ROUTE, HABITS, HabitId, MAX_HABITS, PlanItem, suggestGentle, suggestedPlan, supportPerson, weekCount, weeklyAdjustments } from '../lib/habits';

function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const c = useDS();
  const btn = (d: number, icon: any, a11y: string) => (
    <Pressable
      onPress={() => onChange(Math.min(7, Math.max(1, value + d)))}
      disabled={(d < 0 && value <= 1) || (d > 0 && value >= 7)}
      accessibilityRole="button"
      accessibilityLabel={`${a11y}. ${label}`}
      hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={18} color={c.navy} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {btn(-1, 'remove', '−')}
      <Txt bold color={c.title} style={{ minWidth: 18, textAlign: 'center' }}>{value}</Txt>
      {btn(1, 'add', '+')}
    </View>
  );
}

export default function MyPlan() {
  const { t, state, update } = useApp();
  const c = useDS();
  const plan = state.habits;
  const [editing, setEditing] = useState(!plan?.items.length);
  const [draft, setDraft] = useState<PlanItem[]>(plan?.items.length ? plan.items : suggestedPlan(state));
  const now = new Date();
  const week = startOfWeek(now);
  const adjust = useMemo(() => weeklyAdjustments(state), [state]);
  const [gentle, setGentle] = useState(plan?.gentle ?? suggestGentle(state));
  const person = supportPerson(state);
  const tk = (id: HabitId) => (id === 'connect' && person ? t('habits.connectWith', { name: person }) : t(`habits.${id}.name`));
  const how = (id: HabitId, g = !!plan?.gentle) => t(`habits.${id}.how`, { n: (AMOUNTS[g ? 'gentle' : 'normal'] as any)[id] ?? '' });

  // ---------- Choose habits ----------
  if (editing) {
    const has = (id: HabitId) => draft.some((d) => d.id === id);
    const toggle = (id: HabitId) =>
      setDraft((d) => (has(id) ? d.filter((x) => x.id !== id) : d.length >= MAX_HABITS ? d : [...d, { id, target: 3 }]));
    return (
      <Page
        top={<TopBar back close title={t('habits.title')} />}
        footer={
          <Pill
            title={t('habits.save')}
            variant="green"
            disabled={!draft.length}
            onPress={() => {
              update((s) => ({ ...s, habits: { items: draft, gentle, createdAt: s.habits?.createdAt ?? new Date().toISOString(), reviewedWeek: s.habits?.reviewedWeek } }));
              setEditing(false);
            }}
          />
        }
      >
        <Heading small title={t('habits.pickTitle')} subtitle={t('habits.pickSub', { n: MAX_HABITS })} />
        <Card>
          <ToggleRow label={t('habits.gentle')} desc={t('habits.gentleDesc')} value={gentle} onChange={setGentle} />
        </Card>
        {HABITS.map((id) => {
          const item = draft.find((d) => d.id === id);
          return (
            <View key={id} style={{ gap: 6 }}>
              <OptionCard kind="check" title={tk(id)} desc={how(id, gentle)} selected={!!item} onPress={() => toggle(id)} />
              {item ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                  <Txt variant="small" color={c.body}>{t('habits.daysPerWeek')}</Txt>
                  <Stepper value={item.target} label={tk(id)} onChange={(n) => setDraft((d) => d.map((x) => (x.id === id ? { ...x, target: n } : x)))} />
                </View>
              ) : null}
            </View>
          );
        })}
        <Txt variant="small" color={c.body}>{t('habits.autoNote')}</Txt>
      </Page>
    );
  }

  // ---------- This week ----------
  const items = plan!.items;
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const todayKey = dayKey(now);
  return (
    <Page top={<TopBar back close title={t('habits.title')} />}>
      <Heading small title={t('habits.weekTitle')} subtitle={t('habits.weekSub')} />

      {adjust.length ? (
        <Card cream>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name="sparkles-outline" size={22} color={c.green} />
            <Txt bold color={c.title} style={{ flex: 1, fontSize: 16 }}>{t('habits.adaptTitle')}</Txt>
          </View>
          {adjust.map((a) => (
            <Txt key={a.id} color={c.title}>
              {t(a.kind === 'up' ? 'habits.adaptUp' : 'habits.adaptDown', { habit: tk(a.id), done: a.done, from: a.from, to: a.to })}
            </Txt>
          ))}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Pill title={t('habits.adaptYes')} variant="green" onPress={() => update((s) => applyAdjustments(s, adjust, true))} /></View>
            <View style={{ flex: 1 }}><Pill title={t('habits.adaptNo')} variant="outline" onPress={() => update((s) => applyAdjustments(s, adjust, false))} /></View>
          </View>
        </Card>
      ) : null}

      {items.map((it) => {
        const n = weekCount(state, it.id, week, now);
        const hit = n >= it.target;
        return (
          <Card key={it.id} onPress={() => router.push(HABIT_ROUTE[it.id] as any)} label={`${tk(it.id)}. ${t('habits.countA11y', { n, target: it.target })}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={HABIT_ICON[it.id] as any} size={26} color={hit ? c.green : c.navy} />
              <View style={{ flex: 1 }}>
                <Txt bold color={c.title} style={{ fontSize: 16 }}>{tk(it.id)}</Txt>
                <Txt variant="small" color={c.body}>{how(it.id)}</Txt>
              </View>
              <Txt bold color={hit ? c.green : c.title}>{n}/{it.target}</Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {days.map((d) => {
                const k = dayKey(d);
                const done = doneOn(state, it.id, k);
                return (
                  <View key={k} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                    <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: done ? c.green : c.d ? '#22304A' : '#E3E8EC', borderWidth: k === todayKey ? 1.5 : 0, borderColor: c.navy }} />
                  </View>
                );
              })}
            </View>
            {hit ? <Txt variant="small" color={c.green}>{t('habits.hit')}</Txt> : null}
          </Card>
        );
      })}

      {plan!.gentle ? <Txt variant="small" color={c.body}>{t('habits.gentleOn')}</Txt> : null}
      <SectionLabel>{t('habits.howTitle')}</SectionLabel>
      <Txt variant="small" color={c.body}>{t('habits.howBody')}</Txt>
      <Pill title={t('habits.edit')} variant="outline" onPress={() => { setDraft(items); setEditing(true); }} />
      <TextLink title={t('habits.comebackLink')} onPress={() => router.push('/comeback')} />
    </Page>
  );
}
