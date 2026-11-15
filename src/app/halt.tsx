// HALT Daily Check-In (designer's layout): greeting, coloured icon rows with inline
// No / A little / Yes chips, insights card, green Save button.
import React, { useState } from 'react';
import { displayName } from '../lib/names';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { timeOfDay } from '../lib/dates';
import { HaltAnswers, haltFlags, joinList } from '../lib/engine';
import { Txt, announce } from '../components/ui';
import { Card, Page, Pill, useDS, DS } from '../components/ds';

const KEYS = ['hunger', 'anger', 'loneliness', 'tiredness'] as const;
const LOOK = {
  hunger: { icon: 'silverware-fork-knife', tint: DS.tints.yellow, color: '#7A5A10' },
  anger: { icon: 'emoticon-angry-outline', tint: DS.tints.red, color: '#C2412D' },
  loneliness: { icon: 'account-outline', tint: DS.tints.sky, color: '#2F5C86' },
  tiredness: { icon: 'weather-night', tint: DS.tints.purple, color: '#6A4B9A' },
};
const Q = { hunger: 'ui.hungerQ', anger: 'ui.angerQ', loneliness: 'ui.lonelyQ', tiredness: 'ui.tiredQ' };

export default function Halt() {
  const { t, update, state } = useApp();
  const c = useDS();
  const [a, setA] = useState<HaltAnswers>({});
  const answered = KEYS.filter((k) => a[k] !== undefined).length;
  const flags = haltFlags(a);
  const tipKey = { hunger: 'tipHunger', anger: 'tipAnger', loneliness: 'tipLonely', tiredness: 'tipTired' } as const;
  const insight =
    answered === 0
      ? t('halt.pick')
      : flags.length === 0
        ? t('halt.allGood')
        : t('halt.tipPrefix', {
            list: joinList(flags.map((f) => (a[f] === 1 ? t('halt.aBit', { word: t(`halt.words.${f}`) }) : t(`halt.words.${f}`))), t('common.and')),
            tips: joinList(flags.map((f) => t(`halt.${tipKey[f]}`)), t('common.and')),
          });
  const save = () => {
    update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'halt', answers: a, at: new Date().toISOString() }] }));
    announce(t('halt.savedMsg'));
    router.back();
  };
  const opts = state.settings.simplePrompts
    ? [{ v: 0, l: t('common.no') }, { v: 2, l: t('common.yes') }]
    : [{ v: 0, l: t('common.no') }, { v: 1, l: t('common.aLittle') }, { v: 2, l: t('common.yes') }];
  const name = displayName(state);
  const tod = timeOfDay();
  const greet = t(tod === 'morning' ? 'ui.greetMorning' : tod === 'afternoon' ? 'ui.greetAfternoon' : 'ui.greetEvening');

  return (
    <Page plain footer={<Pill title={t('halt.save')} variant="green" disabled={answered === 0} onPress={save} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.d ? '#9FB4A9' : '#6E8E7E'} style={{ fontSize: 18 }}>{greet}</Txt>
          <Txt bold color={c.title} style={{ fontSize: 24 }}>{name}</Txt>
        </View>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel={t('common.close')} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={24} color={c.title} />
        </Pressable>
      </View>
      <View>
        <Txt bold color={c.green} style={{ fontSize: 24 }} accessibilityRole="header">{t('halt.title')}</Txt>
        <Txt color={c.title} style={{ fontSize: 15 }}>{t('ui.haltSubtitle')}</Txt>
      </View>
      {KEYS.map((k) => (
        <Card key={k} style={{ paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', rowGap: 8 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.d ? '#22304A' : LOOK[k].tint, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={LOOK[k].icon as any} size={24} color={c.d ? '#E6ECF5' : LOOK[k].color} />
            </View>
            <View style={{ flex: 1, minWidth: 92 }}>
              <Txt bold color={c.title} style={{ fontSize: 16 }}>{t(`halt.${k}`)}</Txt>
              <Txt color={c.body} style={{ fontSize: 11.5, lineHeight: 15 }}>{t(Q[k])}</Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 5, marginLeft: 'auto' }} accessibilityRole="radiogroup" accessibilityLabel={t(Q[k])}>
              {opts.map((o) => {
                const sel = a[k] === o.v;
                return (
                  <Pressable
                    key={o.v}
                    onPress={() => setA({ ...a, [k]: o.v as 0 | 1 | 2 })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`${t(`halt.${k}`)}: ${o.l}`}
                    hitSlop={4}
                    style={{ minWidth: 44, height: 34, paddingHorizontal: 7, borderRadius: 17, borderWidth: 1, borderColor: sel ? '#3E9A5B' : '#D5DCE2', backgroundColor: sel ? (c.d ? '#1D3328' : '#E4F3E6') : c.card, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Txt color={c.title} style={{ fontSize: 12.5 }}>{o.l}</Txt>
                    {sel ? (
                      <View style={{ position: 'absolute', top: -5, right: -3, width: 13, height: 13, borderRadius: 7, backgroundColor: '#1F7A3E', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>
      ))}
      <View style={{ backgroundColor: c.d ? '#1D3328' : '#EEF7EE', borderRadius: 12, borderWidth: 1.5, borderColor: c.d ? '#2E5A40' : '#8CC79A', padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.d ? '#22304A' : '#DDF0DF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bulb-outline" size={22} color={c.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.title} style={{ fontSize: 15 }}>{t('halt.insights')}</Txt>
          <Txt color={c.title} style={{ fontSize: 12.5 }} accessibilityLiveRegion="polite">{insight}</Txt>
        </View>
      </View>
    </Page>
  );
}
