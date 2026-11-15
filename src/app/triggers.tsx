// Personal trigger map: People, Places, Things + internal triggers (Section 6).
// Calm, neutral visuals. No substance imagery.
import React, { useState } from 'react';
import { View } from 'react-native';
import { useApp } from '../lib/useApp';
import { Trigger, uid } from '../lib/store';
import { Button, Card, Chip, Field, IconButton, Screen, Txt } from '../components/ui';

const CATS = [
  { key: 'person', title: 'triggers.people', q: 'triggers.pq' },
  { key: 'place', title: 'triggers.places', q: 'triggers.plq' },
  { key: 'thing', title: 'triggers.things', q: 'triggers.tq' },
] as const;
const FEELINGS = ['anger', 'shame', 'loneliness', 'anxiety', 'boredom', 'grief', 'frustration', 'overconfidence'];

export default function Triggers() {
  const { t, state, update } = useApp();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const add = (category: Trigger['category'], label: string) => {
    if (!label.trim()) return;
    update((s) => ({ ...s, triggers: [...s.triggers, { id: uid(), category, label: label.trim() }] }));
    setDraft({ ...draft, [category]: '' });
  };
  const remove = (id: string) => update((s) => ({ ...s, triggers: s.triggers.filter((x) => x.id !== id) }));
  const internal = state.triggers.filter((x) => x.category === 'internal').map((x) => x.label);

  return (
    <Screen title={t('triggers.title')}>
      <Txt>{t('triggers.subtitle')}</Txt>
      {CATS.map((c) => (
        <Card key={c.key}>
          <Txt variant="h3">{t(c.title)}</Txt>
          <Txt variant="small">{t(c.q)}</Txt>
          {state.triggers
            .filter((x) => x.category === c.key)
            .map((x) => (
              <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Txt style={{ flex: 1 }}>• {x.label}</Txt>
                <IconButton icon="trash-outline" label={`${t('common.delete')} ${x.label}`} onPress={() => remove(x.id)} />
              </View>
            ))}
          <Field label={t('triggers.placeholder')} value={draft[c.key] ?? ''} onChangeText={(v) => setDraft({ ...draft, [c.key]: v })} />
          <Button variant="secondary" title={t('triggers.add')} onPress={() => add(c.key, draft[c.key] ?? '')} />
        </Card>
      ))}
      <Card>
        <Txt variant="h3">{t('triggers.internal')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FEELINGS.map((f) => {
            const sel = internal.includes(f);
            return (
              <Chip
                key={f}
                label={t(`triggers.feelings.${f}`)}
                selected={sel}
                onPress={() =>
                  sel
                    ? update((s) => ({ ...s, triggers: s.triggers.filter((x) => !(x.category === 'internal' && x.label === f)) }))
                    : update((s) => ({ ...s, triggers: [...s.triggers, { id: uid(), category: 'internal', label: f }] }))
                }
              />
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
