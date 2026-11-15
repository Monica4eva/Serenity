// One person, seen by a family member or friend: simple status only, what to do if they need
// help now, milestones to celebrate, and encouragement messages.
import React from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { leaveLink, sendMessage } from '../../lib/care';
import { CARE_MILESTONES } from '../../lib/summary';
import { Txt, announce } from '../../components/ui';
import { Card, DS, Page, Pill, SectionLabel, TopBar, useDS } from '../../components/ds';
import { MessageThread, SampleTag, StatusBanner } from '../../components/care';

export default function SupportedPerson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, state, update } = useApp();
  const c = useDS();
  const p = state.care.people.find((x) => x.linkId === id);
  if (!p) return <Page top={<TopBar />}>{null}</Page>;
  const name = p.memberName;
  const s = p.summary;
  const tone = s?.status ?? 'none';
  const canMessage = !!p.permissions.messages || !!p.demo;
  const templates: string[] = t('care.sup.templates');
  const helpSteps: string[] = t('care.sup.helpSteps');

  const quick = async (body: string) => {
    try {
      const m = await sendMessage(p.linkId, body, p.demo);
      update((st) => ({ ...st, care: { ...st.care, messages: [...st.care.messages, m] } }));
      announce(t('care.sup.sent'));
    } catch {
      announce(t('care.msg.error'));
    }
  };

  const leave = () => {
    const go = async () => {
      if (!p.demo) await leaveLink(p.linkId).catch(() => {});
      update((st) => ({ ...st, care: { ...st.care, people: st.care.people.filter((x) => x.linkId !== p.linkId) } }));
      router.back();
    };
    if (Platform.OS === 'web') return go();
    Alert.alert(t('care.pro.leave'), t('care.pro.leaveBody', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: go },
    ]);
  };

  return (
    <Page top={<TopBar title={name} />}>
      {p.demo ? <SampleTag /> : null}
      <StatusBanner tone={tone} title={t(`care.sup.status.${tone}.t`, { name })} body={t(`care.sup.status.${tone}.d`, { name })} />

      {tone === 'help' ? (
        <Card style={{ gap: 10, borderWidth: 2, borderColor: DS.helpRed }}>
          <Txt bold color={c.title} style={{ fontSize: 18 }}>{t('care.sup.helpTitle')}</Txt>
          {helpSteps.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Txt bold color={DS.helpRed}>{`${i + 1}.`}</Txt>
              <Txt color={c.title} style={{ flex: 1 }}>{h}</Txt>
            </View>
          ))}
          <Pressable onPress={() => Linking.openURL('tel:997')} accessibilityRole="button" style={{ backgroundColor: DS.helpRed, borderRadius: 999, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Txt bold color="#FFFFFF" style={{ fontSize: 17 }}>{t('care.sup.emergency')}</Txt>
          </Pressable>
          <Pill title={t('care.sup.guide')} variant="outline" onPress={() => router.push('/supporter/guide?open=crisis')} />
        </Card>
      ) : null}

      {s?.days !== undefined ? (
        <Card style={{ alignItems: 'center', gap: 6 }}>
          <Txt bold color={c.green} style={{ fontSize: 44, lineHeight: 50 }}>{s.days}</Txt>
          <Txt color={c.title}>{t('care.sup.days')}</Txt>
          {s.nextMilestone ? <Txt variant="small" color={c.body}>{t('care.sup.next', { n: s.nextMilestone })}</Txt> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
            {CARE_MILESTONES.map((m) => {
              const on = (s.milestonesReached ?? []).includes(m);
              return (
                <View key={m} accessibilityLabel={`${m}${on ? ' ✓' : ''}`} style={{ minWidth: 40, paddingHorizontal: 8, height: 32, borderRadius: 16, backgroundColor: on ? c.green : c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt bold color={on ? '#FFFFFF' : c.body} style={{ fontSize: 13 }}>{m}</Txt>
                </View>
              );
            })}
          </View>
        </Card>
      ) : null}

      <SectionLabel>{t('care.sup.encourage')}</SectionLabel>
      {canMessage ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {templates.map((m) => (
              <Pressable key={m} onPress={() => quick(m)} accessibilityRole="button" accessibilityLabel={`${t('care.sup.encourage')}: ${m}`} style={{ minHeight: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: c.tint('mint'), justifyContent: 'center' }}>
                <Txt color={c.title} style={{ fontSize: 14 }}>{m}</Txt>
              </Pressable>
            ))}
          </View>
          <Txt variant="small" color={c.body}>{t('care.sup.custom')}</Txt>
          <MessageThread linkId={p.linkId} demo={p.demo} canSend otherName={name} />
        </>
      ) : (
        <Txt color={c.body}>{t('care.sup.noMessages', { name })}</Txt>
      )}

      <View style={{ height: 6 }} />
      <Pill title={t('care.sup.guide')} variant="outline" icon={{ name: 'book-outline' }} onPress={() => router.push('/supporter/guide')} />
      <Pill title={t('care.pro.leave')} variant="outline" onPress={leave} />
    </Page>
  );
}
