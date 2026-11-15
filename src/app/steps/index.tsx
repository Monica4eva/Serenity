// 12-Step Programme (designer's layout). Steps are written in our own words.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { Txt } from '../../components/ui';
import { Card, Page, TopBar, useDS, DS } from '../../components/ds';
import { Ring } from '../../components/Ring';

export default function Steps() {
  const { t, state } = useApp();
  const c = useDS();
  const [all, setAll] = useState(false);
  const texts = t('ui.stepTexts') as unknown as string[];
  const done = state.stepsDone;
  const current = Array.from({ length: 12 }, (_, i) => i + 1).find((n) => !done.includes(n));
  const shown = all ? 12 : 6;
  const tiles = [
    { k: 'learn', icon: 'format-list-text', tint: DS.tints.green, color: '#2E7D4F', go: () => router.push(`/steps/${current ?? 1}`) },
    { k: 'reflect', icon: 'pencil-outline', tint: DS.tints.yellow, color: '#8A6A1A', go: () => router.push({ pathname: '/mood', params: { prompt: `${t('ui.stepN', { n: current ?? 12 })}: ${(t('ui.stepQs') as unknown as string[])[0]}` } }) },
    { k: 'share', icon: 'account-heart-outline', tint: DS.tints.purple, color: '#7A4FA0', go: () => router.push(`/steps/${current ?? 1}?share=1`) },
  ];
  return (
    <Page top={<TopBar close title={t('ui.stepTitle')} subtitle={t('ui.stepSub')} />}>
      <View style={{ backgroundColor: c.d ? '#1B2740' : '#F4F8F1', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#16295F', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 }} accessible accessibilityLabel={`${current ? t('ui.stepNof12', { n: current }) : ''}. ${current ? t('ui.stepMsg') : t('ui.stepDone')}`}>
        <Ring value={done.length / 12} color={c.green} track={c.d ? '#22304A' : '#E3E8EC'}>
          <Txt bold center color={c.title} style={{ fontSize: 12, lineHeight: 15, maxWidth: 60 }}>{current ? t('ui.stepNof12', { n: current }) : '12/12'}</Txt>
        </Ring>
        <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: c.d ? c.border : '#DCE3E8' }} />
        <View style={{ flex: 1 }}>
          <Txt bold color={c.green} style={{ fontSize: 17 }}>{t('ui.keepGoing')}</Txt>
          <Txt color={c.title} style={{ fontSize: 12.5 }}>{current ? t('ui.stepMsg') : t('ui.stepDone')}</Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {tiles.map((tl) => (
          <Pressable key={tl.k} onPress={tl.go} accessibilityRole="button" accessibilityLabel={`${t(`ui.${tl.k}`)}. ${t(`ui.${tl.k}Sub`)}`} style={{ flex: 1, backgroundColor: c.card, borderRadius: 12, padding: 10, gap: 6, shadowColor: '#16295F', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.d ? '#22304A' : tl.tint, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={tl.icon as any} size={16} color={c.d ? '#E6ECF5' : tl.color} />
              </View>
              <Txt bold color={c.title} style={{ fontSize: 15 }}>{t(`ui.${tl.k}`)}</Txt>
            </View>
            <Txt color={c.body} style={{ fontSize: 10.5 }} numberOfLines={1}>{t(`ui.${tl.k}Sub`)}</Txt>
          </Pressable>
        ))}
      </View>
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {texts.slice(0, shown).map((txt, i) => {
          const n = i + 1;
          const isDone = done.includes(n);
          return (
            <Pressable key={n} onPress={() => router.push(`/steps/${n}`)} accessibilityRole="button" accessibilityLabel={`${t('ui.stepN', { n })}. ${txt}. ${isDone ? t('today.done') : t('today.notDone')}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
              <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: isDone ? '#1F7A3E' : '#9AA3AB' }} />
              <Txt bold color={c.title} style={{ fontSize: 12.5, width: 50 }}>{t('ui.stepN', { n })}</Txt>
              <Txt color={c.title} style={{ flex: 1, fontSize: 11.5 }} numberOfLines={2}>{txt}</Txt>
              <Ionicons name="chevron-forward" size={16} color={c.body} />
            </Pressable>
          );
        })}
        <Pressable onPress={() => setAll(!all)} accessibilityRole="button" style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
          <Txt bold color={c.green} style={{ fontSize: 13, textDecorationLine: 'underline' }}>{all ? t('ui.showFewer') : t('ui.showAll')}</Txt>
        </Pressable>
      </Card>
      {current ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.d ? '#1D3328' : '#DDF0DF', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="target" size={28} color={c.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt bold color={c.title} style={{ fontSize: 15 }}>{t('ui.stepActivity')}</Txt>
            <Txt color={c.title} style={{ fontSize: 12 }}>{t('ui.stepActivityBody', { n: current })}</Txt>
          </View>
          <Pressable onPress={() => router.push(`/steps/${current}`)} accessibilityRole="button" style={{ backgroundColor: c.greenBtn, borderRadius: 999, paddingHorizontal: 14, minHeight: 38, justifyContent: 'center' }}>
            <Txt bold color="#FFFFFF" style={{ fontSize: 12.5 }}>{t('ui.continueStep', { n: current })}</Txt>
          </Pressable>
        </Card>
      ) : null}
      <Txt variant="small" color={c.body}>{t('ui.stepWording')}</Txt>
    </Page>
  );
}
