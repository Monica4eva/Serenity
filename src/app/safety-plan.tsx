import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { Txt, announce } from '../components/ui';
import { Card, FieldBox, Page, Pill, TopBar, useDS } from '../components/ds';

const KEYS = ['warning', 'coping', 'distract', 'people', 'pros', 'safer', 'reasons'];

export default function SafetyPlan() {
  const { t, state, update } = useApp();
  const c = useDS();
  const [v, setV] = useState<Record<string, string>>({ ...state.safetyPlan });
  const save = () => {
    update((s) => ({ ...s, safetyPlan: v }));
    announce(t('ui.spSaved'));
    router.back();
  };
  return (
    <Page top={<TopBar close title={t('ui.spTitle')} subtitle={t('ui.spSub')} />} footer={<Pill title={t('common.save')} variant="green" onPress={save} />}>
      {KEYS.map((k, i) => (
        <Card key={k} cream>
          <Txt bold color={c.title} style={{ fontSize: 16 }}>{`${i + 1}. ${t(`ui.spSections.${k}`)}`}</Txt>
          <FieldBox value={v[k] ?? ''} onChangeText={(x) => setV({ ...v, [k]: x })} placeholder={t('ui.spPh')} multiline />
        </Card>
      ))}
    </Page>
  );
}
