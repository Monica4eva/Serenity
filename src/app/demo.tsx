// "Try the demo": pick a view and explore with sample data, no sign-up.
// Reached from the welcome screen, and from the demo banner ("Switch view").
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { demoState, type DemoRole } from '../lib/demo';
import { homeRoute } from '../lib/roles';
import { Txt } from '../components/ui';
import { Card, Heading, Page, TopBar, useDS } from '../components/ds';

const VIEWS: { key: DemoRole; label: 'member' | 'pro' | 'sup'; icon: keyof typeof Ionicons.glyphMap; tint: 'green' | 'lavender' | 'peach' }[] = [
  { key: 'member', label: 'member', icon: 'leaf-outline', tint: 'green' },
  { key: 'professional', label: 'pro', icon: 'medkit-outline', tint: 'lavender' },
  { key: 'supporter', label: 'sup', icon: 'people-outline', tint: 'peach' },
];

export default function DemoScreen() {
  const { t, state, update } = useApp();
  const c = useDS();

  // Only offered when nobody real is using this device, so real data is never replaced.
  const realAccount = !!state.account && !state.demo;

  const open = (role: DemoRole) => {
    update((s) => demoState(role, s));
    router.replace(homeRoute({ appRole: role }));
  };

  return (
    <Page top={<TopBar />}>
      <Heading title={t('ui.demo.title')} subtitle={t('ui.demo.sub')} />
      {realAccount ? (
        <Card cream>
          <Txt variant="small" color={c.body}>{t('ui.demo.hasAccount')}</Txt>
        </Card>
      ) : null}
      {realAccount ? null : VIEWS.map((v) => (
        <Pressable
          key={v.key}
          onPress={() => open(v.key)}
          accessibilityRole="button"
          accessibilityLabel={`${t(`ui.demo.${v.label}`)}. ${t(`ui.demo.${v.label}Desc`)}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.card, borderRadius: 22, padding: 18, shadowColor: '#16295F', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 }}
        >
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: c.tint(v.tint), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={v.icon} size={26} color={c.navy} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt bold color={c.title} style={{ fontSize: 17 }}>{t(`ui.demo.${v.label}`)}</Txt>
            <Txt variant="small" color={c.body}>{t(`ui.demo.${v.label}Desc`)}</Txt>
          </View>
          <Ionicons name="chevron-forward" size={22} color={c.navy} />
        </Pressable>
      ))}
    </Page>
  );
}
