// "My care team": the person in recovery sees who they share with, and invites new people.
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { careOnline } from '../../lib/care';
import { formatDateTime } from '../../lib/dates';
import type { CareLinkLocal } from '../../lib/store';
import { Txt } from '../../components/ui';
import { Card, Page, Pill, RowCard, SectionLabel, TopBar, useDS } from '../../components/ds';
import { SampleTag } from '../../components/care';

export default function CareTeam() {
  const { t, state } = useApp();
  const c = useDS();
  const links = state.care.links.filter((l) => l.status !== 'revoked');
  const unread = (id: string) => state.care.messages.filter((m) => m.linkId === id && !m.mine && !m.read).length;
  const row = (l: CareLinkLocal) => {
    const name = l.viewerName || l.label;
    const sub =
      l.status === 'pending'
        ? `${t('care.team.pending')} · ${t('care.team.expires', { date: formatDateTime(new Date(l.expiresAt ?? l.createdAt), state.language) })}`
        : `${t('care.team.active')}${unread(l.id) ? ` · ${t('care.pro.unread', { n: unread(l.id) })}` : ''}`;
    return (
      <RowCard
        key={l.id}
        title={name}
        subtitle={sub}
        icon={{ name: l.role === 'professional' ? 'medkit-outline' : 'people-outline' }}
        tint={l.role === 'professional' ? 'lavender' : 'peach'}
        right={l.demo ? <SampleTag /> : undefined}
        onPress={() => router.push(`/care/link/${l.id}`)}
      />
    );
  };
  const pros = links.filter((l) => l.role === 'professional');
  const sups = links.filter((l) => l.role === 'supporter');
  return (
    <Page top={<TopBar title={t('care.team.title')} subtitle={t('care.team.sub')} />}>
      {!links.length ? (
        <Card cream>
          <Txt color={c.title}>{t('care.team.empty')}</Txt>
        </Card>
      ) : null}
      {pros.length ? <SectionLabel>{t('care.team.pros')}</SectionLabel> : null}
      {pros.map(row)}
      {sups.length ? <SectionLabel>{t('care.team.sups')}</SectionLabel> : null}
      {sups.map(row)}
      <View style={{ gap: 10, marginTop: 8 }}>
        <Pill title={t('care.team.invitePro')} icon={{ name: 'medkit-outline' }} onPress={() => router.push('/care/invite?role=professional')} />
        <Pill title={t('care.team.inviteSup')} variant="outline" icon={{ name: 'people-outline' }} onPress={() => router.push('/care/invite?role=supporter')} />
      </View>
      <Card style={{ gap: 6 }}>
        <Txt variant="small" color={c.body}>{t('care.team.never')}</Txt>
        {!careOnline ? <Txt variant="small" color={c.body}>{t('care.team.offlineNote')}</Txt> : null}
      </Card>
    </Page>
  );
}
