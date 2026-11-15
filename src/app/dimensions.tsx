// Eight Dimensions of Existence (Section 5.2G). Dimensions 6 to 8 are suggested
// completions and must be confirmed with the clinical lead.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { Button, Card, Field, Screen, Txt, announce } from '../components/ui';

import { DIMENSIONS } from '../lib/constants';

export default function Dimensions() {
  const { t, state, update, theme } = useApp();
  const last = (d: string) => [...state.dimensions].reverse().find((x) => x.dimension === d);
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(DIMENSIONS.map((d) => [d, last(d)?.score ?? 0])));
  const [notes, setNotes] = useState<Record<string, string>>({});

  const save = () => {
    const at = new Date().toISOString();
    update((s) => ({
      ...s,
      dimensions: [...s.dimensions, ...DIMENSIONS.filter((d) => scores[d] > 0).map((d) => ({ dimension: d, score: scores[d], note: notes[d], at }))],
    }));
    announce(t('common.saved'));
    router.back();
  };

  return (
    <Screen title={t('dimensions.title')} footer={<Button title={t('common.save')} onPress={save} />}>
      <Txt>{t('dimensions.subtitle')}</Txt>
      {DIMENSIONS.map((d) => (
        <Card key={d}>
          <Txt variant="h3">{t(`dimensions.${d}`)}</Txt>
          <Txt variant="small">{t(`dimensions.${d}Q`)}</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t(`dimensions.${d}`)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const sel = scores[d] === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setScores({ ...scores, [d]: n })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={t('common.of5', { n })}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: sel ? theme.colors.success : theme.colors.border,
                    backgroundColor: sel ? theme.colors.selected : theme.colors.card,
                  }}
                >
                  <Txt bold={sel} color={sel ? '#00662F' : theme.colors.heading}>
                    {n}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          <Field label={t('dimensions.note')} value={notes[d] ?? ''} onChangeText={(v) => setNotes({ ...notes, [d]: v })} />
        </Card>
      ))}
    </Screen>
  );
}
