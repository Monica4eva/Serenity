// Comeback Coach: a warm, blame-free way back after a slip or some days away.
// Steps: welcome back -> what got in the way -> your 3-day restart plan -> daily ticks -> celebrate.
// Progress is never reset: days in recovery, history and plans all stay as they were.
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { Txt } from '../components/ui';
import { Card, Heading, OptionCard, Page, Pill, SectionLabel, TextLink, TopBar, useDS } from '../components/ds';
import { CelebrationArt, FadeIn, Pop } from '../components/Motion';
import { ACTIONS, BARRIERS, ComebackReason, comebackDay, comebackNeeded, finishComeback, markDayDone, REASONS, startComeback } from '../lib/comeback';
import { useLogoState } from '../lib/useLogoState';

export default function ComebackCoach() {
  const { t, state, update } = useApp();
  const c = useDS();
  const q = useLocalSearchParams<{ reason?: string }>();
  const cb = state.comeback;
  const active = cb && !cb.finishedAt ? cb : undefined;
  const logo = useLogoState();
  const reason: ComebackReason = (REASONS as readonly string[]).includes(q.reason ?? '') ? (q.reason as ComebackReason) : comebackNeeded(state, new Date(), logo.state) ?? 'away';
  const [picked, setPicked] = useState<string[]>([]);
  const [step, setStep] = useState<'welcome' | 'barriers'>('welcome');
  const [helped, setHelped] = useState('');
  const day = active ? comebackDay(active) : 0;
  const allDone = !!active && active.done.length >= 3;

  const toggle = (b: string) => setPicked((p) => (p.includes(b) ? p.filter((x) => x !== b) : p.length >= 3 ? p : [...p, b]));

  // ---------- Finished: celebrate and ask what helped ----------
  if (active && (allDone || day >= 4)) {
    return (
      <Page top={<TopBar back={false} close />}>
        <View style={{ alignItems: 'center' }}><CelebrationArt big /></View>
        <Heading title={t(allDone ? 'comeback.doneTitle' : 'comeback.endTitle')} subtitle={t(allDone ? 'comeback.doneBody' : 'comeback.endBody', { n: active.done.length })} />
        <Card>
          <Txt bold color={c.title}>{t('comeback.helpedQ')}</Txt>
          <TextInput
            value={helped}
            onChangeText={setHelped}
            placeholder={t('comeback.helpedPh')}
            placeholderTextColor={c.body}
            multiline
            accessibilityLabel={t('comeback.helpedQ')}
            style={{ minHeight: 70, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 10, color: c.title, fontSize: 16, textAlignVertical: 'top' }}
          />
          <Txt variant="small" color={c.body}>{t('comeback.helpedNote')}</Txt>
        </Card>
        <Pill
          title={t('comeback.finish')}
          variant="green"
          onPress={() => {
            update((s) => finishComeback(s, helped.trim() || undefined));
            router.replace('/(tabs)');
          }}
        />
        <TextLink title={t('comeback.toPlan')} onPress={() => { update((s) => finishComeback(s, helped.trim() || undefined)); router.replace('/plan'); }} />
      </Page>
    );
  }

  // ---------- Running: the 3-day plan ----------
  if (active) {
    return (
      <Page top={<TopBar back close title={t('comeback.title')} />}>
        <Heading small title={t('comeback.dayOf', { n: day })} subtitle={t('comeback.planSub')} />
        <View style={{ flexDirection: 'row', gap: 8 }} accessible accessibilityLabel={t('comeback.progressA11y', { n: active.done.length })}>
          {[1, 2, 3].map((d) => (
            <View key={d} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: active.done.includes(d) ? c.green : c.d ? '#22304A' : '#DCEFE2' }} />
          ))}
        </View>
        {active.plan.map((p) => {
          const done = active.done.includes(p.day);
          const today = p.day === day;
          const locked = p.day > day;
          const a = ACTIONS[p.action];
          return (
            <Card key={p.day} selected={today && !done} style={{ opacity: locked ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => !locked && update((s) => markDayDone(s, p.day))}
                  disabled={locked || done}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done, disabled: locked }}
                  accessibilityLabel={`${t('comeback.dayN', { n: p.day })}. ${t(`comeback.act.${p.action}`)}`}
                  hitSlop={8}
                >
                  <Pop active={done}>
                    <Ionicons name={done ? 'checkmark-circle' : locked ? 'lock-closed-outline' : 'ellipse-outline'} size={30} color={done ? c.green : c.body} />
                  </Pop>
                </Pressable>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="small" color={c.body}>{t('comeback.dayN', { n: p.day })}{today ? ` · ${t('comeback.today')}` : ''}</Txt>
                  <Txt bold color={c.title} style={{ fontSize: 16 }}>{t(`comeback.act.${p.action}`)}</Txt>
                  <Txt variant="small" color={c.body}>{t(`comeback.why.${p.action}`)}</Txt>
                </View>
                {a?.route && !locked ? (
                  <Pressable onPress={() => router.push(a.route as any)} accessibilityRole="button" accessibilityLabel={t('comeback.open')} hitSlop={6}>
                    <Ionicons name={(a.icon as any) ?? 'chevron-forward'} size={24} color={c.navy} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          );
        })}
        <Card cream>
          <Txt variant="small" color={c.title}>{t('comeback.noBlame')}</Txt>
        </Card>
        <TextLink title={t('comeback.needHelp')} onPress={() => router.push('/help')} />
      </Page>
    );
  }

  // ---------- Start: welcome, then what got in the way ----------
  if (step === 'welcome') {
    const days = state.recoveryStart ? Math.max(0, Math.floor((Date.now() - new Date(state.recoveryStart).getTime()) / 86400000)) : 0;
    return (
      <Page top={<TopBar back close />}>
        <FadeIn>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.d ? '#1D3328' : '#EAF5EC', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sunny-outline" size={52} color={c.green} />
            </View>
          </View>
          <Heading title={t(`comeback.welcome_${reason}`)} subtitle={t('comeback.welcomeBody')} />
        </FadeIn>
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={22} color={c.green} />
            <Txt color={c.title} style={{ flex: 1 }}>{t('comeback.kept', { n: days })}</Txt>
          </View>
        </Card>
        <Pill title={t('comeback.start')} variant="green" chevron onPress={() => setStep('barriers')} />
        <TextLink
          title={t('comeback.notNow')}
          onPress={() => {
            update((s) => ({ ...s, comebackDismissedAt: new Date().toISOString() }));
            router.back();
          }}
        />
      </Page>
    );
  }

  return (
    <Page
      top={<TopBar back onBack={() => setStep('welcome')} close title={t('comeback.title')} />}
      footer={
        <Pill
          title={t('comeback.makePlan')}
          variant="green"
          onPress={() => update((s) => startComeback(s, reason, picked))}
        />
      }
    >
      <Heading small title={t('comeback.barriersQ')} subtitle={t('comeback.barriersSub')} />
      <SectionLabel>{t('comeback.pickUpTo')}</SectionLabel>
      {BARRIERS.map((b) => (
        <OptionCard key={b} kind="check" title={t(`comeback.barrier.${b}`)} selected={picked.includes(b)} onPress={() => toggle(b)} />
      ))}
      <Txt variant="small" color={c.body}>{t('comeback.skipNote')}</Txt>
    </Page>
  );
}
