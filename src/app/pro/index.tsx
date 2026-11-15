// Counsellor and therapist home: clients who invited them, most urgent first.
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { sortBySeverity } from '../../lib/summary';
import { formatDateTime } from '../../lib/dates';
import { Txt } from '../../components/ui';
import { Card, Page, TopBar, useDS } from '../../components/ds';
import { Avatar, ColourDot, LOGO_COLOURS, SampleTag } from '../../components/care';
import { ViewerTools, useSampleSeed } from '../../components/ViewerHome';

export default function ProHome() {
  const { t, state } = useApp();
  const c = useDS();
  const sample = useSampleSeed('professional');
  const clients = sortBySeverity(state.care.people.filter((p) => p.role === 'professional'));
  const unread = (id: string) => state.care.messages.filter((m) => m.linkId === id && !m.mine && !m.read).length;
  return (
    <Page top={<TopBar back={false} title={t('care.pro.title')} subtitle={t('care.pro.sub')} />}>
      {sample ? (
        <Card cream>
          <Txt variant="small" color={c.body}>{t('care.pro.sampleNote')}</Txt>
        </Card>
      ) : null}
      {!clients.length ? (
        <Card>
          <Txt color={c.title}>{t('care.pro.empty')}</Txt>
        </Card>
      ) : null}
      {clients.map((p) => {
        const s = p.summary;
        const colour = s?.logo ?? 'normal';
        const n = unread(p.linkId);
        return (
          <Card key={p.linkId} onPress={() => router.push(`/pro/client/${p.linkId}`)} label={`${p.memberName}. ${s?.logo ? t(`care.colour.${s.logo}`) : t('care.pro.waiting')}`} style={{ borderLeftWidth: 6, borderLeftColor: s?.logo ? LOGO_COLOURS[colour] : c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar name={p.memberName} colour={s?.logo ? LOGO_COLOURS[colour] : '#9AA6BC'} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Txt bold color={c.title} style={{ fontSize: 18 }}>{p.memberName}</Txt>
                  {p.demo ? <SampleTag /> : null}
                </View>
                {s?.logo ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ColourDot colour={colour} size={10} />
                    <Txt color={c.title} style={{ fontSize: 14 }}>{t(`care.colour.${colour}`)}</Txt>
                  </View>
                ) : null}
                <Txt variant="small" color={c.body} style={{ fontSize: 13 }}>
                  {s ? [s.days !== undefined ? t('care.pro.days', { n: s.days }) : null, t('care.pro.updated', { when: formatDateTime(new Date(s.updatedAt), state.language) })].filter(Boolean).join(' · ') : t('care.pro.waiting')}
                </Txt>
              </View>
              {n ? (
                <View style={{ backgroundColor: c.navy, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Txt bold color={c.onNavy} style={{ fontSize: 12 }}>{t('care.pro.unread', { n })}</Txt>
                </View>
              ) : null}
            </View>
          </Card>
        );
      })}
      <View style={{ height: 6 }} />
      <ViewerTools role="professional" />
      <Txt variant="small" color={c.body}>{t('care.pro.responsibility')}</Txt>
    </Page>
  );
}
