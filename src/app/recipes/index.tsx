import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import type { Recipe } from '../../content/recipes';
import { recipesFor, useContent } from '../../lib/content';
import { Txt } from '../../components/ui';
import { Card, Page, TopBar, useDS } from '../../components/ds';

export default function Recipes() {
  const content = useContent();
  const { t, state } = useApp();
  const c = useDS();
  const tn = state.language === 'tn';
  const [tag, setTag] = useState<'all' | Recipe['tag']>('all');
  const list = recipesFor(content, state.language).filter((r) => tag === 'all' || r.tag === tag);
  return (
    <Page top={<TopBar close title={t('recipes.title')} subtitle={t('recipes.sub')} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(['all', 'breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const).map((k) => (
          <Pressable key={k} onPress={() => setTag(k)} accessibilityRole="tab" accessibilityState={{ selected: tag === k }} style={{ minHeight: 38, paddingHorizontal: 14, borderRadius: 19, justifyContent: 'center', backgroundColor: tag === k ? c.greenBtn : c.card, borderWidth: 1, borderColor: tag === k ? c.greenBtn : c.d ? c.border : '#D5DCE2' }}>
            <Txt bold color={tag === k ? '#FFFFFF' : c.title} style={{ fontSize: 13 }}>{t(`recipes.tags.${k}`)}</Txt>
          </Pressable>
        ))}
      </ScrollView>
      {list.map((r) => {
        const L = tn && r.tn ? r.tn : r.en;
        return (
          <Card key={r.id} onPress={() => router.push(`/recipes/${r.id}`)} label={`${L.title}. ${t('recipes.mins', { n: r.mins })}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: c.tint('yellow'), alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ fontSize: 28, lineHeight: 36 }}>{r.emoji}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt bold color={c.title} style={{ fontSize: 15.5 }}>{L.title}</Txt>
                <Txt variant="small" color={c.body}>{`${t(`recipes.tags.${r.tag}`)} · ${t('recipes.mins', { n: r.mins })} · ${t('recipes.serves', { n: r.serves })}`}</Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.body} />
            </View>
          </Card>
        );
      })}
      <Txt variant="small" color={c.body}>{t('recipes.note')}</Txt>
    </Page>
  );
}
