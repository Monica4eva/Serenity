// 12-Step / Five Pillars (Section 5.9). Original reflection prompts only.
// No copyrighted recovery literature is embedded. Licensed readings link out.
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { dayKey } from '../lib/dates';
import { Button, Card, Chip, ListenButton, Screen, Txt, announce } from '../components/ui';

export default function Program() {
  const { t, state, update, theme } = useApp();
  const today = dayKey();
  const reflections = t('program.reflections') as string[];
  const pillarNames = t('program.pillars') as string[];
  const reflection = reflections[new Date().getDate() % reflections.length];
  const done = state.focus[today] ?? [];
  const [pillars, setPillars] = useState<string[]>(done.filter((d) => pillarNames.includes(d)));
  const showSteps = state.approach !== 'pillars';
  const showPillars = state.approach !== '12step';

  const mark = (items: string[]) => {
    update((s) => ({ ...s, focus: { ...s.focus, [today]: Array.from(new Set([...(s.focus[today] ?? []), ...items])) } }));
    announce(t('common.saved'));
  };

  return (
    <Screen title={showSteps ? t('program.title12') : t('program.titlePillars')}>
      {showSteps ? (
        <Card>
          <Txt variant="h3">{t('program.todays')}</Txt>
          <Txt>{reflection}</Txt>
          <ListenButton text={reflection} />
          <Button title={t('program.reflectBtn')} onPress={() => { mark(['reading']); router.push('/journal'); }} />
          <Button variant="secondary" title={t('program.external')} icon="open-outline" onPress={() => Linking.openURL('https://www.recoveryreadings.com')} />
          <Txt variant="small">{t('program.licence')}</Txt>
        </Card>
      ) : null}
      {showPillars ? (
        <Card>
          <Txt variant="h3">{t('program.pillarsTitle')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {pillarNames.map((p) => (
              <Chip key={p} label={p} selected={pillars.includes(p)} onPress={() => setPillars(pillars.includes(p) ? pillars.filter((x) => x !== p) : [...pillars, p])} />
            ))}
          </View>
          <Button variant="success" title={t('common.save')} onPress={() => mark([...pillars, 'pillar'])} disabled={!pillars.length} />
        </Card>
      ) : null}
      <Txt variant="small" color={theme.colors.body}>
        {t('program.later')}
      </Txt>
    </Screen>
  );
}
