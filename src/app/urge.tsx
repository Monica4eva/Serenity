// Urge surfing: a guided timer to ride out a craving like a wave.
// Rate the urge, choose 5, 10 or 20 minutes, follow a new gentle prompt each minute,
// then rate it again. Saved as a check-in so the escalation button can respond.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { Txt, announce } from '../components/ui';
import { Card, Page, Pill, TopBar, useDS } from '../components/ds';
import { useReduceMotion } from '../components/Motion';

type Phase = 'before' | 'surfing' | 'after' | 'done';

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function Urge() {
  const { t, state, update } = useApp();
  const c = useDS();
  const reduce = useReduceMotion();
  const [phase, setPhase] = useState<Phase>('before');
  const [before, setBefore] = useState<number | undefined>();
  const [after, setAfter] = useState<number | undefined>();
  const [mins, setMins] = useState(10);
  const [left, setLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wave = useRef(new Animated.Value(0)).current;
  const prompts = t('urge.prompts') as unknown as string[];
  const supporter = state.contacts.find((x) => x.role === 'sponsor') ?? state.contacts.find((x) => x.role === 'counsellor') ?? state.contacts[0];

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  useEffect(() => {
    if (phase !== 'surfing' || reduce) return;
    // The wave rises and falls slowly: in for 4 seconds, out for 6.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, reduce]);

  const start = () => {
    setLeft(mins * 60);
    setPhase('surfing');
    announce(t('urge.started'));
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(timer.current!);
          setPhase('after');
          announce(t('urge.finished'));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const finish = (n?: number) => {
    setAfter(n);
    const craving = (x?: number) => (x === undefined ? undefined : x >= 7 ? 2 : x >= 4 ? 1 : 0);
    update((s) => ({
      ...s,
      checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { urgeSurf: true, minutes: mins, before, after: n, craving: craving(n ?? before) }, at: new Date().toISOString() }],
      activitiesDone: [...s.activitiesDone, { id: 'urge', at: new Date().toISOString() }],
    }));
    setPhase('done');
  };

  const elapsed = mins * 60 - left;
  const prompt = prompts[Math.min(prompts.length - 1, Math.floor(elapsed / 60))];
  const scale = (value: number | undefined, onPick: (n: number) => void) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <Pressable
          key={n}
          onPress={() => onPick(n)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === n }}
          accessibilityLabel={String(n)}
          style={{ width: 30, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: value === n ? 2 : 0, borderColor: c.navy, backgroundColor: n >= 8 ? (c.d ? '#4A2228' : '#FDE3E1') : n >= 4 ? (c.d ? '#3A3520' : '#FFF0CF') : c.d ? '#1D3328' : '#E2F7EC' }}
        >
          <Txt bold color={c.title}>{n}</Txt>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Page top={<TopBar close title={t('urge.title')} subtitle={t('urge.sub')} />}>
      {phase === 'surfing' ? <KeepAwake /> : null}

      {phase === 'before' ? (
        <>
          <Card cream>
            <Txt color={c.title} style={{ fontSize: 15.5 }}>{t('urge.intro')}</Txt>
          </Card>
          <Card>
            <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('urge.rateNow')}</Txt>
            {scale(before, setBefore)}
            <Txt variant="small" center color={c.body}>{t('companion.scaleHint')}</Txt>
          </Card>
          <Card>
            <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('urge.howLong')}</Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[5, 10, 20].map((m) => (
                <Pressable key={m} onPress={() => setMins(m)} accessibilityRole="radio" accessibilityState={{ selected: mins === m }} style={{ flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1.5, borderColor: mins === m ? c.navy : c.d ? c.border : '#D5DCE2', backgroundColor: mins === m ? c.selected : c.card, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt bold color={c.title}>{t('urge.minutes', { n: m })}</Txt>
                </Pressable>
              ))}
            </View>
          </Card>
          <Pill title={t('urge.start')} icon={{ name: 'water-outline' }} onPress={start} />
          <Txt variant="small" center color={c.body}>{t('urge.skipNote')}</Txt>
        </>
      ) : null}

      {phase === 'surfing' ? (
        <>
          <View style={{ alignItems: 'center', gap: 12, marginTop: 6 }} accessible accessibilityLabel={`${t('urge.left', { m: Math.floor(left / 60), s: String(left % 60).padStart(2, '0') })}. ${prompt}`}>
            <View style={{ width: 240, height: 240, borderRadius: 120, overflow: 'hidden', backgroundColor: c.d ? '#16243D' : '#E6F1F7', borderWidth: 3, borderColor: c.navy }}>
              <Animated.View
                style={{
                  position: 'absolute',
                  left: -40,
                  right: -40,
                  height: 260,
                  borderTopLeftRadius: 200,
                  borderTopRightRadius: 160,
                  backgroundColor: c.d ? '#3B5C9E' : '#7FA7D6',
                  top: 120,
                  transform: [{ translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [40, -70] }) }],
                }}
              />
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Txt bold color={c.title} style={{ fontSize: 40 }}>{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</Txt>
                <Txt bold color={c.title}>{t('urge.breathe')}</Txt>
              </View>
            </View>
          </View>
          <Card cream>
            <Txt bold color={c.green} style={{ fontSize: 17 }} accessibilityLiveRegion="polite">{prompt}</Txt>
          </Card>
          {supporter ? (
            <Pill variant="outline" icon={{ name: 'call-outline' }} title={t('urge.call', { name: supporter.name })} onPress={() => Linking.openURL(`tel:${supporter.phone.replace(/\s/g, '')}`)} />
          ) : null}
          <Pressable onPress={() => { if (timer.current) clearInterval(timer.current); setPhase('after'); }} accessibilityRole="button" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Txt bold color={c.body} style={{ textDecorationLine: 'underline' }}>{t('urge.endEarly')}</Txt>
          </Pressable>
        </>
      ) : null}

      {phase === 'after' ? (
        <>
          <Card cream>
            <Txt bold color={c.green} style={{ fontSize: 18 }}>{t('urge.wellDone')}</Txt>
            <Txt color={c.title}>{t('urge.rateAgain')}</Txt>
          </Card>
          <Card>{scale(after, (n) => finish(n))}</Card>
          <Pressable onPress={() => finish(undefined)} accessibilityRole="button" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Txt bold color={c.body}>{t('companion.skip')}</Txt>
          </Pressable>
        </>
      ) : null}

      {phase === 'done' ? (
        <>
          <Card cream>
            <Txt bold color={c.green} style={{ fontSize: 18 }}>
              {before !== undefined && after !== undefined
                ? after < before
                  ? t('urge.lower', { a: before, b: after })
                  : t('urge.same')
                : t('urge.saved')}
            </Txt>
            <Txt color={c.title}>{t('urge.next')}</Txt>
          </Card>
          {after !== undefined && after >= 8 ? <Pill variant="red" icon={{ name: 'call' }} title={t('ui.helpTitle')} onPress={() => router.replace('/help')} /> : null}
          <Pill title={t('urge.again')} variant="outline" onPress={() => { setBefore(after); setAfter(undefined); setPhase('before'); }} />
          <Pill title={t('companion.entry')} variant="outline" onPress={() => router.replace('/companion')} />
          <Pill title={t('common.done')} onPress={() => router.back()} />
        </>
      ) : null}
    </Page>
  );
}
