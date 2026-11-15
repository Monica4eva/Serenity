// HELP NOW (designer's layout). Red call button, other ways to get help, plus the guided support modes.
import React from 'react';
import { Linking, Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { Txt } from '../components/ui';
import { Brand, Card, Page, RowCard, SectionLabel, TopBar, useDS, DS, Icon } from '../components/ds';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Help() {
  const { t, state, update } = useApp();
  const c = useDS();
  const pro = state.contacts.find((x) => x.role === 'counsellor') ?? state.contacts.find((x) => x.role === 'healthcare');
  const supporter = state.contacts.find((x) => x.role === 'sponsor') ?? state.contacts.find((x) => x.role === 'family') ?? state.contacts[0];
  const name = state.profile.preferredName || '';

  const callPro = () => {
    update((s) => ({ ...s, safetyEvents: [...s.safetyEvents, { at: new Date().toISOString(), kind: 'help_call_counsellor' }] }));
    if (pro) Linking.openURL(`tel:${pro.phone.replace(/\s/g, '')}`);
    else router.push({ pathname: '/onboarding/contact', params: { role: 'counsellor' } });
  };
  const message = () => {
    if (!supporter) return Alert.alert(t('ui.msgSupporter'), t('ui.noSupporter'), [{ text: t('common.close') }]);
    const body = t('contact.previewText', { contact: supporter.name, name });
    Linking.openURL(`sms:${supporter.phone}?body=${encodeURIComponent(body)}`);
  };

  const rows = [
    { key: 'em', icon: { name: 'notifications-outline' }, tint: 'red' as const, color: '#E0533D', title: t('ui.emergencySvc'), sub: t('ui.emergencySvcSub'), go: () => router.push('/crisis?mode=emergency') },
    { key: 'msg', icon: { name: 'chatbox-ellipses-outline' }, tint: 'blue' as const, color: c.navy, title: t('ui.msgSupporter'), sub: supporter ? `${t('ui.msgSupporterSub')} · ${supporter.name}` : t('ui.msgSupporterSub'), go: message },
    { key: 'sp', icon: { name: 'shield-checkmark-outline' }, tint: 'mint' as const, color: c.green, title: t('ui.safetyPlan'), sub: t('ui.safetyPlanSub'), go: () => router.push('/safety-plan') },
  ];
  const more = [
    { key: 'guide', title: t('companion.entry'), go: () => router.push('/companion') },
    { key: 'cr', title: t('crisis.craving'), go: () => router.push('/crisis?mode=craving') },
    { key: 'urge', title: t('urge.title'), go: () => router.push('/urge') },
    { key: 'emo', title: t('crisis.struggling'), go: () => router.push('/crisis?mode=emotional') },
    { key: 'rel', title: t('crisis.relapsed'), go: () => router.push('/relapse') },
    { key: 'res', title: t('res.entry'), go: () => router.push('/resources') },
  ];

  return (
    <Page plain top={<TopBar />} footer={<Txt variant="small" center color={c.body}>{t('ui.helpFooter')}</Txt>}>
      <Brand wordmark={false} size={96} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Txt bold center color={c.title} style={{ fontSize: 28 }} accessibilityRole="header">
          {t('ui.helpTitle')}
        </Txt>
        <Txt center color={c.body} style={{ fontSize: 15, maxWidth: 300 }}>
          {t('ui.helpSub')}
        </Txt>
      </View>
      <Pressable
        onPress={callPro}
        accessibilityRole="button"
        accessibilityLabel={pro ? `${t('ui.callCounsellor')}, ${pro.name}` : `${t('ui.callCounsellor')}. ${t('ui.addCounsellorSub')}`}
        style={({ pressed }) => ({ backgroundColor: DS.helpRed, borderRadius: 10, minHeight: 78, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50, opacity: pressed ? 0.88 : 1 })}
      >
        <Txt bold center color="#FFFFFF" style={{ fontSize: 22 }}>
          {pro ? t('ui.callName', { name: pro.name }) : t('ui.callCounsellor')}
        </Txt>
        <Txt center color="#FFFFFF" style={{ fontSize: 14 }}>
          {pro ? t('ui.counsellorSub') : t('ui.addCounsellorSub')}
        </Txt>
        <Ionicons name="chevron-forward" size={30} color="#FFFFFF" style={{ position: 'absolute', right: 16 }} />
      </Pressable>
      <SectionLabel>{t('ui.otherWays')}</SectionLabel>
      <View style={{ gap: 14 }}>
        {rows.map((r) => (
          <RowCard key={r.key} icon={r.icon} tint={r.tint} iconColor={r.color} title={r.title} subtitle={r.sub} onPress={r.go} />
        ))}
      </View>
      <SectionLabel>{t('ui.moreSupport')}</SectionLabel>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {more.map((m, i) => (
          <Pressable key={m.key} onPress={m.go} accessibilityRole="button" accessibilityLabel={m.title} style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', borderTopWidth: i ? 1 : 0, borderTopColor: c.d ? c.border : '#EEF1F3' }}>
            <Txt color={c.title} style={{ flex: 1, fontSize: 16 }}>{m.title}</Txt>
            <Ionicons name="chevron-forward" size={20} color={c.body} />
          </Pressable>
        ))}
      </Card>
    </Page>
  );
}
