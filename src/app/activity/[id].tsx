// One guided activity, one step at a time, then "How do you feel now?".
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { ACTIVITIES } from '../../content/activities';
import { Txt, ListenButton, announce } from '../../components/ui';
import { Card, Page, Pill, TopBar, useDS } from '../../components/ds';
import { BreathingCircle, FadeIn } from '../../components/Motion';
import { ProgressBar } from '../../components/ui';

export default function ActivityScreen() {
  const { t, state, update } = useApp();
  const c = useDS();
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = ACTIVITIES.find((x) => x.id === id) ?? ACTIVITIES[0];
  const L = state.language === 'tn' ? a.tn : a.en;
  const [i, setI] = useState(-1); // -1 = intro
  const [result, setResult] = useState<'better' | 'same' | 'worse' | null>(null);
  const total = L.steps.length;
  const finished = i >= total;

  const goLink = () => {
    if (!a.link) return;
    if (a.link.startsWith('/mood?prompt=')) router.push({ pathname: '/mood', params: { prompt: L.title } });
    else router.push(a.link as any);
  };

  const rate = (r: 'better' | 'same' | 'worse') => {
    setResult(r);
    update((s) => ({ ...s, activitiesDone: [...s.activitiesDone, { id: a.id, feeling: r, at: new Date().toISOString() }] }));
    announce(t(r === 'better' ? 'act.savedBetter' : r === 'same' ? 'act.savedSame' : 'act.savedWorse'));
  };

  return (
    <Page top={<TopBar close title={L.title} subtitle={t('act.mins', { n: a.mins })} />}>
      {i === -1 ? (
        <FadeIn>
          <Card cream>
            <Txt bold color={c.green} style={{ fontSize: 16 }}>{t('act.why')}</Txt>
            <Txt color={c.title} style={{ fontSize: 15.5 }}>{L.why}</Txt>
          </Card>
          <View style={{ height: 14 }} />
          {a.link && total <= 1 ? (
            <Pill title={t('act.open')} icon={{ name: 'open-outline' }} onPress={goLink} />
          ) : (
            <Pill title={t('act.begin')} onPress={() => setI(0)} />
          )}
        </FadeIn>
      ) : null}

      {i >= 0 && !finished ? (
        <FadeIn key={i}>
          <Txt bold color={c.body}>{t('act.stepOf', { n: i + 1, total })}</Txt>
          <ProgressBar value={(i + 1) / total} color={c.navy} />
          <View style={{ height: 12 }} />
          <Card>
            <Txt color={c.title} style={{ fontSize: 20, lineHeight: 28 }} accessibilityLiveRegion="polite">{L.steps[i]}</Txt>
            <ListenButton text={L.steps[i]} />
          </Card>
          {a.breathe ? (
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <BreathingCircle pattern={a.breathe} />
            </View>
          ) : null}
          <View style={{ height: 12 }} />
          <Pill title={i === total - 1 ? t('act.finish') : t('act.next')} onPress={() => setI(i + 1)} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Pressable onPress={() => setI(i - 1)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt bold color={c.body}>{t('act.back')}</Txt>
            </Pressable>
            <Pressable onPress={() => setI(total)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt bold color={c.body}>{t('companion.skip')}</Txt>
            </Pressable>
          </View>
          {a.link ? <Pill title={t('act.open')} variant="outline" icon={{ name: 'open-outline' }} onPress={goLink} /> : null}
        </FadeIn>
      ) : null}

      {finished ? (
        <FadeIn>
          {!result ? (
            <Card>
              <Txt bold color={c.title} style={{ fontSize: 18 }}>{t('act.howFeel')}</Txt>
              {(['better', 'same', 'worse'] as const).map((r) => (
                <Pressable key={r} onPress={() => rate(r)} accessibilityRole="button" style={{ minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: c.d ? c.border : '#D5DCE2', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginTop: 8 }}>
                  <Txt style={{ fontSize: 24 }}>{r === 'better' ? '🙂' : r === 'same' ? '😐' : '😟'}</Txt>
                  <Txt bold color={c.title}>{t(`act.${r}`)}</Txt>
                </Pressable>
              ))}
              <Pressable onPress={() => rate('same')} accessibilityRole="button" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
                <Txt bold color={c.body}>{t('companion.skip')}</Txt>
              </Pressable>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              <Card cream>
                <Ionicons name={result === 'worse' ? 'heart-outline' : 'checkmark-circle'} size={30} color={c.green} />
                <Txt bold color={c.title} style={{ fontSize: 17 }}>{t(result === 'better' ? 'act.savedBetter' : result === 'same' ? 'act.savedSame' : 'act.savedWorse')}</Txt>
              </Card>
              {result === 'worse' ? <Pill title={t('act.talk')} onPress={() => router.replace('/companion')} /> : null}
              {result === 'worse' ? <Pill title={t('ui.helpTitle')} variant="red" onPress={() => router.replace('/help')} /> : null}
              <Pill title={t('act.another')} variant="outline" onPress={() => router.back()} />
              <Pill title={t('common.done')} onPress={() => router.replace('/(tabs)')} />
            </View>
          )}
        </FadeIn>
      ) : null}
    </Page>
  );
}
