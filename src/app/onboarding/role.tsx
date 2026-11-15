// "How will you use Serenity?": person in recovery, counsellor or therapist, or family and friends.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { saveCareProfile } from '../../lib/care';
import { homeRoute } from '../../lib/roles';
import type { AppRole } from '../../lib/summary';
import { Txt } from '../../components/ui';
import { Card, Heading, Page, Pill, RadioMark, TopBar, useDS } from '../../components/ds';

const ROLES: { key: AppRole; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'member', icon: 'leaf-outline' },
  { key: 'professional', icon: 'medkit-outline' },
  { key: 'supporter', icon: 'people-outline' },
];

export default function RoleScreen() {
  const { t, state, update } = useApp();
  const c = useDS();
  const { switch: switching } = useLocalSearchParams<{ switch?: string }>();
  const [role, setRole] = useState<AppRole>(state.appRole ?? 'member');

  const next = () => {
    update((s) => ({ ...s, appRole: role }));
    if (switching) {
      if (state.account) saveCareProfile(role, state.profile.preferredName || state.account.fullName).catch(() => {});
      const target = homeRoute({ appRole: role });
      // A person who never finished the recovery onboarding goes through it first.
      router.replace(role === 'member' && !state.onboarded ? '/onboarding/profile' : target);
      return;
    }
    router.push('/onboarding/account');
  };

  return (
    <Page top={<TopBar step={switching ? undefined : 1} />} footer={<Pill title={t('common.continue')} chevron onPress={next} />}>
      <Heading title={t('care.role.title')} subtitle={t('care.role.sub')} />
      {ROLES.map((r) => {
        const sel = role === r.key;
        return (
          <Pressable
            key={r.key}
            onPress={() => setRole(r.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={`${t(`care.role.${r.key}.t`)}. ${t(`care.role.${r.key}.d`)}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: sel ? c.selected : c.card, borderRadius: 22, padding: 18, borderWidth: sel ? 2 : 0, borderColor: c.navy, shadowColor: '#16295F', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 }}
          >
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: c.tint(r.key === 'member' ? 'green' : r.key === 'professional' ? 'lavender' : 'peach'), alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={r.icon} size={26} color={c.navy} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt bold color={c.title} style={{ fontSize: 17 }}>{t(`care.role.${r.key}.t`)}</Txt>
              <Txt variant="small" color={c.body}>{t(`care.role.${r.key}.d`)}</Txt>
            </View>
            <RadioMark selected={sel} tick />
          </Pressable>
        );
      })}
      {switching ? (
        <Card cream>
          <Txt variant="small" color={c.body}>{t('care.role.changeBody')}</Txt>
        </Card>
      ) : null}
    </Page>
  );
}
