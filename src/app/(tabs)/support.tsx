import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { uid } from '../../lib/store';
import { Button, Card, Chip, Field, Screen, Txt } from '../../components/ui';
import { ContactRow } from '../../components/ContactList';

export default function Support() {
  const { t, state, update, theme } = useApp();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const name = state.profile.preferredName || '';
  const talkTo = state.contacts.find((c) => c.consentLevel !== 'none') ?? state.contacts[0];
  const appts = [...state.appointments].sort((a, b) => a.when.localeCompare(b.when));

  const addAppt = () => {
    if (!title.trim() || !when.trim()) return;
    update((s) => ({ ...s, appointments: [...s.appointments, { id: uid(), title: title.trim(), when: when.trim() }] }));
    setTitle('');
    setWhen('');
    setAdding(false);
  };
  const mark = (id: string, status: 'attended' | 'missed') => update((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, status, markedAt: new Date().toISOString() } : a)) }));

  return (
    <Screen back={false} title={t('support.title')}>
      <Button variant="danger" icon="heart" title={t('today.getSupport')} onPress={() => router.push('/help')} />
      <Button variant="secondary" icon="chatbubbles-outline" title={t('companion.entry')} onPress={() => router.push('/companion')} />
      <Button variant="secondary" icon="globe-outline" title={t('res.entry')} onPress={() => router.push('/resources')} />
      <Button variant="secondary" icon="people-circle-outline" title={t('care.team.title')} onPress={() => router.push('/care/team')} />

      <Txt variant="h2">{t('support.mySupport')}</Txt>
      {talkTo ? (
        <Button
          variant="success"
          icon="chatbubbles"
          title={`${t('support.needTalk')} (${talkTo.name})`}
          onPress={() => Linking.openURL(`sms:${talkTo.phone}?body=${encodeURIComponent(t('support.needTalkMsg', { contact: talkTo.name, name }))}`)}
        />
      ) : (
        <Txt>{t('support.noContacts')}</Txt>
      )}
      {state.contacts.map((c) => (
        <ContactRow key={c.id} c={c} actions />
      ))}
      <Button variant="secondary" icon="add" title={t('network.add')} onPress={() => router.push('/onboarding/contact')} />

      <Txt variant="h2">{t('support.appointments')}</Txt>
      {appts.length === 0 ? <Txt>{t('support.noAppts')}</Txt> : null}
      {appts.map((a) => (
        <Card key={a.id}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Txt variant="h3">{a.title}</Txt>
              <Txt variant="small">{a.when}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label={t('support.attended')} selected={a.status === 'attended'} onPress={() => mark(a.id, 'attended')} />
            <Chip label={t('support.missed')} selected={a.status === 'missed'} onPress={() => mark(a.id, 'missed')} />
          </View>
        </Card>
      ))}
      {adding ? (
        <Card>
          <Field label={t('support.apptTitle')} value={title} onChangeText={setTitle} />
          <Field label={t('support.apptWhen')} value={when} onChangeText={setWhen} />
          <Button title={t('common.save')} onPress={addAppt} disabled={!title.trim() || !when.trim()} />
          <Button variant="ghost" title={t('common.cancel')} onPress={() => setAdding(false)} />
        </Card>
      ) : (
        <Button variant="secondary" icon="add" title={t('support.addAppt')} onPress={() => setAdding(true)} />
      )}

      <Card onPress={() => router.push('/triggers')} label={t('support.triggers')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="map-outline" size={26} color={theme.colors.teal} />
          <Txt variant="h3" style={{ flex: 1 }}>
            {t('support.triggers')}
          </Txt>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.body} />
        </View>
      </Card>

      <Card>
        <Txt variant="h3">{t('support.facilities')}</Txt>
        <Txt>{t('support.facilitiesBody')}</Txt>
      </Card>
    </Screen>
  );
}
