// Milestones (designer's layout): trophy, day count, three milestone tiles, achievements list.
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { daysBetween } from '../lib/dates';
import { Txt } from '../components/ui';
import { Page, TopBar, useDS } from '../components/ds';
import { CelebrationArt } from '../components/Motion';

const LIST = [1, 7, 14, 28, 30, 60, 90, 180, 365];

export default function Milestones() {
  const { t, state } = useApp();
  const c = useDS();
  const days = daysBetween(state.recoveryStart) + 1;
  const sober = !state.details.substance || state.details.substance !== 'gambling';
  // The three tiles: the milestones around today.
  const tilesFrom = Math.max(0, LIST.findIndex((m) => m > days) - 2);
  const tiles = LIST.slice(Math.min(tilesFrom, LIST.length - 3), Math.min(tilesFrom, LIST.length - 3) + 3);
  const colors = c.d ? ['#2C4A3A', '#2E3B5C', '#5A4526'] : ['#9EC7A9', '#AFC0DE', '#F2C886'];
  const reached = LIST.filter((m) => m <= days);
  const next = LIST.find((m) => m > days);
  const shown = [...reached.slice(-3), ...(next ? [next] : [])];

  return (
    <Page top={<TopBar back={false} close />}>
      <Txt variant="small" color={c.title}>{t('ui.msTop')}</Txt>
      <View style={{ alignItems: 'center' }}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: 220, height: 150, alignItems: 'center', justifyContent: 'flex-end' }}>
          <View style={{ position: 'absolute', top: 0, width: 140, height: 140, borderRadius: 70, backgroundColor: c.d ? '#3A3520' : '#FBEFC4' }} />
          <View style={{ position: 'absolute', left: 6, bottom: 4, width: 70, height: 80, borderRadius: 35, backgroundColor: '#1E7A3E' }} />
          <View style={{ position: 'absolute', left: 30, bottom: 30, width: 50, height: 60, borderRadius: 25, backgroundColor: '#2E9A50' }} />
          <View style={{ position: 'absolute', right: 6, bottom: 4, width: 70, height: 80, borderRadius: 35, backgroundColor: '#1E7A3E' }} />
          <View style={{ position: 'absolute', right: 30, bottom: 30, width: 50, height: 60, borderRadius: 25, backgroundColor: '#2E9A50' }} />
          <View style={{ marginBottom: -10 }}><CelebrationArt big /></View>
        </View>
        <View accessible accessibilityLabel={`${days} ${t(sober ? 'ui.daysSober' : 'ui.daysRecovery')}`} style={{ marginTop: -10, backgroundColor: c.card, borderRadius: 18, paddingHorizontal: 26, paddingVertical: 8, alignItems: 'center', shadowColor: '#16295F', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
          <Txt bold color={c.title} style={{ fontSize: 32, lineHeight: 38 }}>{days}</Txt>
          <Txt bold color={c.title} style={{ fontSize: 17 }}>{t(sober ? 'ui.daysSober' : 'ui.daysRecovery')}</Txt>
        </View>
        <Txt bold color={c.green} style={{ fontSize: 18, marginTop: 18 }}>{t('ui.everyDay')}</Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {tiles.map((m, i) => (
          <View key={m} accessible accessibilityLabel={`${m} ${t('ui.daysWord')}${m > days ? `, ${t('ui.locked')}` : ''}`} style={{ flex: 1, backgroundColor: colors[i], borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
            <Txt bold color={c.d ? '#FFFFFF' : '#0A2A1F'} style={{ fontSize: 22 }}>{m}</Txt>
            <Txt color={c.d ? '#FFFFFF' : '#0A2A1F'} style={{ fontSize: 16 }}>{t('ui.daysWord')}</Txt>
            {m > days ? <Ionicons name="lock-closed" size={13} color={c.d ? '#F2C886' : '#8A5A00'} /> : null}
          </View>
        ))}
      </View>
      <Txt bold color={c.title} style={{ fontSize: 18, marginTop: 8 }}>{t('ui.achievements')}</Txt>
      {shown.map((m, i) => {
        const done = m <= days;
        const isNext = m === next;
        const key = `d${m}`;
        return (
          <Pressable key={m} onPress={() => router.push('/(tabs)/insight')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, borderBottomWidth: i < shown.length - 1 ? 1 : 0, borderBottomColor: c.d ? c.border : '#E3E8EC' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: done ? c.green : '#4A4F55' }} />
            <View style={{ flex: 1 }}>
              <Txt bold color={c.title} style={{ fontSize: 17 }}>{isNext ? t('ui.msNext', { n: m }) : t(`ui.msNames.${key}`)}</Txt>
              <Txt variant="small" color={c.body}>{isNext ? t('ui.msYourNext') : done ? t(m === 1 ? 'ui.msCompletedOne' : 'ui.msCompleted', { n: m }) : t('ui.msUpcoming', { n: m })}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.body} />
          </Pressable>
        );
      })}
    </Page>
  );
}
