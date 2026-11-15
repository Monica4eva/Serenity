import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { Txt, announce } from '../components/ui';
import { Card, FieldBox, OptionCard, Page, Pill, TopBar, useDS } from '../components/ds';

const TYPES = ['aa', 'na', 'faith', 'group', 'counselling', 'other'];

export default function Meetings() {
  const { t, state, update } = useApp();
  const c = useDS();
  const [type, setType] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const now = new Date();
  const month = state.checkins.filter((x) => x.type === 'meeting' && new Date(x.at).getMonth() === now.getMonth() && new Date(x.at).getFullYear() === now.getFullYear()).length;
  const save = () => {
    update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'meeting', answers: { meeting: type ?? 'other', note }, at: new Date().toISOString() }] }));
    announce(t('ui.meetLogged'));
    router.back();
  };
  return (
    <Page top={<TopBar close title={t('ui.meetTitle')} subtitle={t('ui.meetSub')} />} footer={<Pill title={t('ui.meetAttended')} variant="green" onPress={save} />}>
      <Card cream>
        <Txt bold color={c.green} style={{ fontSize: 17 }}>{t('ui.meetMonth', { n: month })}</Txt>
      </Card>
      <Pill title={t('res.find')} variant="outline" icon={{ name: 'search-outline' }} onPress={() => router.push('/resources')} />
      <Txt bold color={c.title} style={{ fontSize: 17 }}>{t('ui.meetType')}</Txt>
      {TYPES.map((k) => (
        <OptionCard key={k} title={t(`ui.meetTypes.${k}`)} selected={type === k} onPress={() => setType(k)} />
      ))}
      <FieldBox label={t('ui.meetNote')} value={note} onChangeText={setNote} multiline />
    </Page>
  );
}
