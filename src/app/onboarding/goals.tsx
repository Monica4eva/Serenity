import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { Txt, announce } from '../../components/ui';
import { Brand, Heading, OptionCard, Page, Pill, TextLink, TopBar, useDS } from '../../components/ds';

export const GOALS = ['substanceFree', 'relationships', 'wellbeing', 'lifeSkills', 'community', 'opportunities'];

export default function Goals() {
  const { t, state, update } = useApp();
  const c = useDS();
  const [sel, setSel] = useState<string[]>(state.goals.map((g) => g.id));
  const [msg, setMsg] = useState('');
  const toggle = (id: string) => {
    if (sel.includes(id)) {
      setSel(sel.filter((x) => x !== id));
      setMsg('');
    } else if (sel.length >= 3) {
      setMsg(t('goals.limit'));
      announce(t('goals.limit'));
    } else setSel([...sel, id]);
  };
  const save = () => update((s) => ({ ...s, goals: sel.map((id) => s.goals.find((g) => g.id === id) ?? { id, progress: 0 }) }));
  return (
    <Page
      top={<TopBar />}
      footer={
        <>
          <Pill title={t('common.continue')} onPress={() => { save(); router.back(); }} />
          <TextLink title={t('common.saveLater')} onPress={() => { save(); router.back(); }} />
        </>
      }
    >
      <Brand wordmark={false} size={90} />
      <Heading small title={t('goals.title')} subtitle={t('ui.goalsSub')} />
      <View style={{ gap: 10 }}>
        {GOALS.map((g) => (
          <OptionCard key={g} kind="check" title={t(`goals.${g}`)} desc={t(`ui.goalDesc.${g}`)} selected={sel.includes(g)} onPress={() => toggle(g)} />
        ))}
      </View>
      {msg ? (
        <Txt center color={c.d ? '#F5C26B' : '#8A5A00'} accessibilityLiveRegion="polite">
          {msg}
        </Txt>
      ) : null}
    </Page>
  );
}
