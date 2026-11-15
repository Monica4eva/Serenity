// Profile menu (designer's layout).
import React from 'react';
import { displayName } from '../lib/names';
import { Alert, Image, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { daysBetween } from '../lib/dates';
import { signOut } from '../lib/auth';
import { Txt } from '../components/ui';
import { Card, Page, TopBar, useDS, Icon } from '../components/ds';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { t, state, update } = useApp();
  const c = useDS();
  const display = displayName(state);
  const days = daysBetween(state.recoveryStart) + 1;

  const logOut = () =>
    Alert.alert(t('ui.logOut'), t('ui.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('ui.logOut'),
        onPress: async () => {
          await signOut();
          update((x) => ({ ...x, loggedIn: false }));
          router.replace('/onboarding/login');
        },
      },
    ]);

  const rows = [
    { icon: 'person-outline', label: t('ui.myProfile'), go: () => router.push('/my-profile') },
    { icon: 'people-outline', label: t('care.team.title'), go: () => router.push('/care/team') },
    { icon: 'swap-horizontal-outline', label: t('care.role.change'), go: () => router.push('/onboarding/role?switch=1') },
    { icon: 'notifications-outline', label: t('ui.appNotif'), go: () => router.push('/settings?section=app') },
    { icon: 'lock-closed-outline', label: t('ui.privacyData'), go: () => router.push('/settings?section=privacy') },
    { icon: 'phone-portrait-outline', label: t('ui.devices'), go: () => router.push('/devices') },
    { icon: 'globe-outline', label: t('ui.languageRow'), go: () => router.push('/settings?section=language') },
    { icon: 'log-out-outline', label: t('ui.logOut'), go: logOut },
  ];

  return (
    <Page plain top={<TopBar />} footer={<Txt variant="small" center color={c.body}>{t('ui.profileFooter')}</Txt>}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22, paddingHorizontal: 8, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: c.d ? c.border : '#E3E8EC' }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: c.d ? '#22304A' : '#E4EFEA', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../assets/logo-mark.png')} style={{ width: 62, height: 62 * (512 / 498) }} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.title} style={{ fontSize: 22 }}>{display}</Txt>
          <Txt color={c.body} style={{ fontSize: 15 }}>{t('ui.inRecoveryDays', { n: days })}</Txt>
        </View>
      </View>
      <View style={{ gap: 14, marginTop: 10 }}>
        {rows.map((r) => (
          <Card key={r.label} onPress={r.go} label={r.label} style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Ionicons name={r.icon as any} size={24} color={c.title} />
              <Txt color={c.title} style={{ flex: 1, fontSize: 17 }}>{r.label}</Txt>
              <Ionicons name="chevron-forward" size={22} color={c.title} />
            </View>
          </Card>
        ))}
      </View>
    </Page>
  );
}
