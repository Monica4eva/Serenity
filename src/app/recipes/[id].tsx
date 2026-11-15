import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { dayKey } from '../../lib/dates';
import { findRecipe, recipesFor } from '../../content/recipes';
import { Txt, ListenButton, announce } from '../../components/ui';
import { Card, Page, Pill, TopBar, useDS } from '../../components/ds';

export default function RecipeScreen() {
  const { t, state, update } = useApp();
  const c = useDS();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = findRecipe(id) ?? recipesFor(state.language)[0];
  const L = state.language === 'tn' && r.tn ? r.tn : r.en;
  const [ticked, setTicked] = useState<number[]>([]);
  const toggle = (n: number) => setTicked(ticked.includes(n) ? ticked.filter((x) => x !== n) : [...ticked, n]);
  const made = () => {
    const at = new Date().toISOString();
    const k = dayKey();
    update((s) => ({
      ...s,
      activitiesDone: [...s.activitiesDone, { id: 'cook', at }],
      dayLogs: { ...s.dayLogs, [k]: { ...s.dayLogs[k], meals: Math.min(6, (s.dayLogs[k]?.meals ?? 0) + 1) } },
    }));
    announce(t('recipes.madeSaved'));
    router.back();
  };
  return (
    <Page top={<TopBar close />} footer={<Pill title={t('recipes.made')} variant="green" icon={{ name: 'checkmark' }} onPress={made} />}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Txt style={{ fontSize: 56, lineHeight: 72 }}>{r.emoji}</Txt>
        <Txt bold center color={c.title} style={{ fontSize: 22 }} accessibilityRole="header">{L.title}</Txt>
        <Txt color={c.body}>{`${t('recipes.mins', { n: r.mins })} · ${t('recipes.serves', { n: r.serves })}`}</Txt>
      </View>
      <Card cream>
        <Txt bold color={c.green}>{t('recipes.why')}</Txt>
        <Txt color={c.title}>{L.why}</Txt>
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>{t('recipes.ingredients')}</Txt>
        {L.ingredients.map((x, n) => (
          <Pressable key={n} onPress={() => toggle(n)} accessibilityRole="checkbox" accessibilityState={{ checked: ticked.includes(n) }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 40 }}>
            <Ionicons name={ticked.includes(n) ? 'checkbox' : 'square-outline'} size={22} color={ticked.includes(n) ? c.green : c.body} />
            <Txt color={c.title} style={{ flex: 1, textDecorationLine: ticked.includes(n) ? 'line-through' : 'none' }}>{x}</Txt>
          </Pressable>
        ))}
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>{t('recipes.method')}</Txt>
        {L.steps.map((x, n) => (
          <View key={n} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <Txt bold color={c.onNavy} style={{ fontSize: 13 }}>{n + 1}</Txt>
            </View>
            <Txt color={c.title} style={{ flex: 1, fontSize: 15.5 }}>{x}</Txt>
          </View>
        ))}
        <ListenButton text={L.steps.join(' ')} />
      </Card>
      <Txt variant="small" color={c.body}>{t('recipes.note')}</Txt>
    </Page>
  );
}
