// Recovery Activities: guided, step-by-step activities with suggestions based on today's check-ins.
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { dayKey } from '../lib/dates';
import type { ActivityCat, GuidedActivity } from '../content/activities';
import { useContent } from '../lib/content';
import { Txt } from '../components/ui';
import { Card, Page, SectionLabel, TopBar, useDS, DS } from '../components/ds';

const CAT_TINT: Record<ActivityCat, keyof typeof DS.tints> = { calm: 'blue', move: 'mint', connect: 'peach', spirit: 'lavender', nourish: 'yellow', create: 'sky' };

export default function Activities() {
  const { activities: ACTIVITIES } = useContent();
  const { t, state } = useApp();
  const c = useDS();
  const tn = state.language === 'tn';
  const [cat, setCat] = useState<'all' | ActivityCat>('all');
  const today = dayKey();
  const doneToday = new Set(state.activitiesDone.filter((x) => dayKey(new Date(x.at)) === today).map((x) => x.id));

  // Suggestions from today's HALT, mood and craving check-ins.
  const lastHalt = [...state.checkins].reverse().find((x) => x.type === 'halt' && dayKey(new Date(x.at)) === today)?.answers ?? {};
  const craving = state.checkins.some((x) => dayKey(new Date(x.at)) === today && (x.answers?.craving ?? 0) >= 1);
  const hour = new Date().getHours();
  const picks: string[] = [];
  if (craving) picks.push('urge', 'grounding');
  if (lastHalt.hunger) picks.push('cook');
  if (lastHalt.anger) picks.push('box', 'pmr');
  if (lastHalt.loneliness) picks.push('call', 'service');
  if (lastHalt.tiredness) picks.push('bodyscan', 'safeplace');
  if (!picks.length) picks.push(hour < 12 ? 'walk' : hour < 18 ? 'gratitude' : 'bodyscan', 'box', 'plan');
  const suggested = Array.from(new Set(picks)).slice(0, 3).map((id) => ACTIVITIES.find((a) => a.id === id)!).filter(Boolean);
  const list = ACTIVITIES.filter((a) => cat === 'all' || a.cat === cat);

  const Row = ({ a }: { a: GuidedActivity }) => {
    const L = tn ? a.tn : a.en;
    const done = doneToday.has(a.id);
    return (
      <Card onPress={() => router.push(`/activity/${a.id}`)} label={`${L.title}. ${t('act.mins', { n: a.mins })}${done ? `. ${t('act.doneToday')}` : ''}`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.tint(CAT_TINT[a.cat]), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={a.icon as any} size={22} color={c.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt bold color={c.title} style={{ fontSize: 16 }}>{L.title}</Txt>
            <Txt variant="small" color={c.body} numberOfLines={2}>{L.why}</Txt>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Txt variant="small" color={c.body}>{t('act.mins', { n: a.mins })}</Txt>
            {done ? <Ionicons name="checkmark-circle" size={20} color={c.green} /> : <Ionicons name="chevron-forward" size={18} color={c.body} />}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Page top={<TopBar close title={t('act.title')} subtitle={t('act.sub')} />}>
      <SectionLabel>{t('act.recommended')}</SectionLabel>
      {suggested.map((a) => <Row key={`s-${a.id}`} a={a} />)}
      <SectionLabel>{t('act.all')}</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(['all', 'calm', 'move', 'connect', 'spirit', 'nourish', 'create'] as const).map((k) => (
          <Pressable key={k} onPress={() => setCat(k)} accessibilityRole="tab" accessibilityState={{ selected: cat === k }} style={{ minHeight: 38, paddingHorizontal: 14, borderRadius: 19, justifyContent: 'center', backgroundColor: cat === k ? c.navy : c.card, borderWidth: 1, borderColor: cat === k ? c.navy : c.d ? c.border : '#D5DCE2' }}>
            <Txt bold color={cat === k ? c.onNavy : c.title} style={{ fontSize: 13 }}>{t(`act.cats.${k}`)}</Txt>
          </Pressable>
        ))}
      </ScrollView>
      {list.map((a) => <Row key={a.id} a={a} />)}
      <Card onPress={() => router.push('/recipes')} label={t('recipes.entry')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt style={{ fontSize: 30 }}>🍲</Txt>
          <View style={{ flex: 1 }}>
            <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('recipes.title')}</Txt>
            <Txt variant="small" color={c.body}>{t('recipes.sub')}</Txt>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.body} />
        </View>
      </Card>
    </Page>
  );
}
