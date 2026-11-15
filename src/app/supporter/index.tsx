// Family and friends home: the people they support, and a check on how they are doing themselves.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { sortBySeverity } from '../../lib/summary';
import { Txt, announce } from '../../components/ui';
import { Card, Page, SectionLabel, TopBar, useDS } from '../../components/ds';
import { Avatar, SampleTag, STATUS_COLOURS } from '../../components/care';
import { ViewerTools, useSampleSeed } from '../../components/ViewerHome';

export default function SupporterHome() {
  const { t, state, update } = useApp();
  const c = useDS();
  const sample = useSampleSeed('supporter');
  const people = sortBySeverity(state.care.people.filter((p) => p.role === 'supporter'));
  const opts: string[] = t('care.sup.selfCareOpts');
  const [picked, setPicked] = useState<number | null>(null);
  const check = (i: number) => {
    setPicked(i);
    update((s) => ({ ...s, care: { ...s.care, selfCare: [...s.care.selfCare.slice(-59), { at: new Date().toISOString(), score: i }] } }));
    announce(i <= 1 ? t('care.sup.selfCareLow') : t('care.sup.selfCareOk'));
  };
  return (
    <Page top={<TopBar back={false} title={t('care.sup.title')} />}>
      {sample ? (
        <Card cream>
          <Txt variant="small" color={c.body}>{t('care.sup.sampleNote')}</Txt>
        </Card>
      ) : null}
      {!people.length ? (
        <Card>
          <Txt color={c.title}>{t('care.sup.empty')}</Txt>
        </Card>
      ) : null}
      {people.map((p) => {
        const st = p.summary?.status;
        const tone = st ?? 'none';
        const colour = st ? STATUS_COLOURS[st] : '#9AA6BC';
        return (
          <Card key={p.linkId} onPress={() => router.push(`/supporter/${p.linkId}`)} label={t(`care.sup.status.${tone}.t`, { name: p.memberName })} style={{ borderLeftWidth: 6, borderLeftColor: colour, backgroundColor: st === 'help' ? '#FDE3E1' : undefined }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar name={p.memberName} colour={colour} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Txt bold color={st === 'help' ? '#0A2A1F' : c.title} style={{ fontSize: 18 }}>{p.memberName}</Txt>
                  {p.demo ? <SampleTag /> : null}
                </View>
                <Txt color={st === 'help' ? '#B00000' : c.title} bold={st === 'help'}>{t(`care.sup.status.${tone}.t`, { name: p.memberName })}</Txt>
                {p.summary?.days !== undefined ? <Txt variant="small" color={c.body}>{`${p.summary.days} ${t('care.sup.days')}`}</Txt> : null}
              </View>
            </View>
          </Card>
        );
      })}

      <SectionLabel>{t('care.sup.selfCare')}</SectionLabel>
      <Card style={{ gap: 10 }}>
        <Txt color={c.body}>{t('care.sup.selfCareSub')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {opts.map((o, i) => (
            <Pressable key={o} onPress={() => check(i)} accessibilityRole="radio" accessibilityState={{ selected: picked === i }} style={{ minHeight: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: picked === i ? c.navy : c.selected, justifyContent: 'center' }}>
              <Txt bold color={picked === i ? c.onNavy : c.title} style={{ fontSize: 14 }}>{o}</Txt>
            </Pressable>
          ))}
        </View>
        {picked !== null ? <Txt color={c.title}>{picked <= 1 ? t('care.sup.selfCareLow') : t('care.sup.selfCareOk')}</Txt> : null}
      </Card>

      <View style={{ height: 4 }} />
      <ViewerTools role="supporter" />
    </Page>
  );
}
