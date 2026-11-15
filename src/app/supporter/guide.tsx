// Practical guidance for family and friends (English and Setswana), plus family support links.
import React, { useState } from 'react';
import { useContent } from '../../lib/content';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { Txt } from '../../components/ui';
import { Card, Page, RowCard, TopBar, useDS } from '../../components/ds';

type Article = { id: string; t: string; body: string[] };
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = { enabling: 'hand-left-outline', slip: 'chatbubbles-outline', signs: 'eye-outline', crisis: 'alert-circle-outline', boundaries: 'shield-outline', selfcare: 'leaf-outline' };

export default function Guide() {
  const { t } = useApp();
  const c = useDS();
  const params = useLocalSearchParams<{ open?: string }>();
  const [open, setOpen] = useState<string | undefined>(params.open);
  const { guide } = useContent();
  const { state } = useApp();
  const articles: Article[] = guide.map((g) => ({ id: g.id, ...(state.language === 'tn' ? g.tn : g.en) }));
  return (
    <Page top={<TopBar title={t('care.sup.guide')} subtitle={t('care.sup.guideSub')} />}>
      {articles.map((a) => {
        const on = open === a.id;
        return (
          <Card key={a.id} style={{ gap: 10 }}>
            <Pressable onPress={() => setOpen(on ? undefined : a.id)} accessibilityRole="button" accessibilityState={{ expanded: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 }}>
              <Ionicons name={ICONS[a.id] ?? 'book-outline'} size={24} color={a.id === 'crisis' ? '#F20F0F' : c.navy} />
              <Txt bold color={c.title} style={{ flex: 1, fontSize: 17 }}>{a.t}</Txt>
              <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={20} color={c.body} />
            </Pressable>
            {on ? (
              <View style={{ gap: 8 }}>
                {a.body.map((p, i) => (
                  <Txt key={i} color={c.title} style={{ lineHeight: 22 }}>{p}</Txt>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
      <RowCard title={t('care.sup.resources')} subtitle="Al-Anon, Lifeline Botswana, BOSASNet" icon={{ name: 'globe-outline' }} tint="sky" onPress={() => router.push('/resources')} />
    </Page>
  );
}
