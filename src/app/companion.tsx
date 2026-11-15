// Serenity Guide chat screen. The conversation logic lives in src/lib/companion.ts.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { displayName } from '../lib/names';
import { AccessibilityInfo, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, TextInput, View, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { advance, begin, type Ask, type Ctx, type Effect, type Msg, type Session } from '../lib/companion';
import { daysBetween } from '../lib/dates';
import { Txt, announce } from '../components/ui';
import { useDS, DS } from '../components/ds';
import { BreathingCircle } from '../components/Motion';
import { SafeAreaView } from 'react-native-safe-area-context';

type Line = { id: string; from: 'bot' | 'me'; text: string };

export default function Companion() {
  const { t, state, update } = useApp();
  const c = useDS();
  const name = displayName(state);
  const ctx: Ctx = useMemo(
    () => ({
      name,
      contacts: state.contacts.map((x) => x.name),
      days: daysBetween(state.recoveryStart) + 1,
      checkins: state.checkins.filter((x) => x.type !== 'baseline').length,
      journal: state.journal.length,
    }),
    [state.contacts.length, state.checkins.length, state.journal.length, name],
  );
  const first = useMemo(() => begin(ctx), []);
  const [session, setSession] = useState<Session>(first.session);
  const [ask, setAsk] = useState<Ask>(first.ask);
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, setPending] = useState(0);
  const [text, setText] = useState('');
  const [paused, setPaused] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [reduce, setReduce] = useState(false);
  const scroll = useRef<any>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const say = (m: Msg) => {
    const vars: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(m.vars ?? {})) vars[k] = typeof v === 'string' && v.startsWith('@') ? t(v.slice(1)) : v;
    return t(m.key, vars) as string;
  };

  // Bot lines arrive one at a time, never as a wall of text.
  const pushBot = (msgs: Msg[]) => {
    const texts = msgs.map(say);
    texts.forEach((txt, i) => {
      const id = uid();
      const delay = reduce ? 0 : 500 + i * 700;
      setPending((p) => p + 1);
      timers.current.push(
        setTimeout(() => {
          setLines((l) => [...l, { id, from: 'bot', text: txt }]);
          setPending((p) => p - 1);
          if (i === texts.length - 1) announce(txt);
          if (state.settings.voiceFirst) Speech.speak(txt, { language: state.language === 'tn' ? 'en-ZA' : 'en-GB' });
        }, delay),
      );
    });
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    pushBot(first.bot);
    return () => {
      timers.current.forEach(clearTimeout);
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: !reduce }), 60);
  }, [lines.length, pending]);

  const apply = (effects: Effect[]) => {
    const at = new Date().toISOString();
    for (const e of effects) {
      const p = e.payload ?? {};
      switch (e.kind) {
        case 'baseline':
        case 'craving':
          update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { companion: true, feeling: p.feeling, urge: p.urge, craving: p.craving ?? (e.kind === 'craving' ? 2 : undefined) }, at }] }));
          break;
        case 'plan':
          update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { companion: true, plan: p.plan, who: p.who, easier: p.easier, know: p.know }, at }] }));
          break;
        case 'maintain':
          update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { companion: true, ...p }, at }] }));
          break;
        case 'review':
          update((s) => ({
            ...s,
            checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { companion: true, review: p }, at }],
            baseline: {
              ...s.baseline,
              extended: {
                ...s.baseline.extended,
                ...(p.warning ? { earlyWarning: [s.baseline.extended.earlyWarning, p.warning].filter(Boolean).join('; ') } : {}),
              },
            },
          }));
          break;
        case 'risk':
          // The person said they may be at risk: a Red level, so the escalation button turns red.
          update((s) => ({
            ...s,
            safetyEvents: [...s.safetyEvents, { at, kind: 'companion_risk' }],
            checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { companion: true, safety: 'risk' }, level: 'red', reasons: [], at }],
          }));
          break;
        case 'handoff':
          update((s) => ({ ...s, safetyEvents: [...s.safetyEvents, { at, kind: 'companion_handoff' }] }));
          setShowHandoff(true);
          break;
        case 'showHandoff':
          setShowHandoff(true);
          break;
        case 'lowMood':
          update((s) => ({ ...s, safetyEvents: [...s.safetyEvents, { at, kind: 'companion_lowmood' }] }));
          break;
        case 'cravingWords':
          update((s) => ({ ...s, safetyEvents: [...s.safetyEvents, { at, kind: 'companion_craving' }] }));
          break;
        case 'allClear':
          update((s) => ({ ...s, dismissals: [...s.dismissals, { at, context: 'logo:allclear' }], safetyEvents: [...s.safetyEvents, { at, kind: 'logo_all_clear' }] }));
          setShowHandoff(false);
          break;
        case 'openUrge':
          setTimeout(() => router.push('/urge'), 1200);
          break;
        case 'close':
          break;
      }
    }
  };

  const send = (input: { value?: string; text?: string }, shown: string) => {
    if (pending > 0) return;
    if (shown) setLines((l) => [...l, { id: uid(), from: 'me', text: shown }]);
    const turn = advance(session, input, ctx);
    setSession(turn.session);
    setAsk(turn.ask);
    apply(turn.effects);
    pushBot(turn.bot);
    setText('');
  };

  const replyLabel = (r: { key?: string; label?: string }) => r.label ?? (r.key ? (t(r.key) as string) : '');
  const pro = state.contacts.find((x) => x.role === 'counsellor') ?? state.contacts.find((x) => x.role === 'healthcare');
  const supporter = state.contacts.find((x) => x.role === 'sponsor') ?? state.contacts.find((x) => x.role === 'family') ?? state.contacts.find((x) => x !== pro);
  const stepName = (t('companion.steps') as unknown as string[])[ask.step - 1];
  const handoffVisible = showHandoff || session.hold;

  const Chip = ({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) => (
    <Pressable
      onPress={onPress}
      disabled={pending > 0}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: danger ? DS.helpRed : c.navy, backgroundColor: c.card, justifyContent: 'center', opacity: pending > 0 ? 0.5 : 1 }}
    >
      <Txt bold color={danger ? DS.helpRed : c.navy} style={{ fontSize: 14 }}>{label}</Txt>
    </Pressable>
  );

  const HandoffCard = (
    <View style={{ backgroundColor: c.d ? '#3A1D22' : '#FFF1F0', borderRadius: 14, borderWidth: 1.5, borderColor: DS.helpRed, padding: 14, gap: 10 }} accessibilityLiveRegion="polite">
      <Txt bold color={c.title} style={{ fontSize: 16 }}>{t('companion.handoff.title')}</Txt>
      {pro ? (
        <Pressable onPress={() => Linking.openURL(`tel:${pro.phone.replace(/\s/g, '')}`)} accessibilityRole="button" style={{ minHeight: 48, borderRadius: 10, backgroundColor: DS.helpRed, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="call" size={18} color="#FFFFFF" />
          <Txt bold color="#FFFFFF">{t('companion.handoff.call', { name: pro.name })}</Txt>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push({ pathname: '/onboarding/contact', params: { role: 'counsellor' } })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt bold color={c.navy}>{t('companion.handoff.addPro')}</Txt>
        </Pressable>
      )}
      {state.emergencyNumbers.map((e) => (
        <Pressable key={e.id} onPress={() => Linking.openURL(`tel:${e.number}`)} accessibilityRole="button" style={{ minHeight: 44, borderRadius: 10, borderWidth: 1.5, borderColor: DS.helpRed, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="call-outline" size={18} color={DS.helpRed} />
          <Txt bold color={DS.helpRed}>{t('companion.handoff.emergency', { label: state.language === 'tn' && e.labelTn ? e.labelTn : e.label, number: e.number })}</Txt>
        </Pressable>
      ))}
      {supporter ? (
        <Pressable onPress={() => Linking.openURL(`sms:${supporter.phone}?body=${encodeURIComponent(t('contact.previewText', { contact: supporter.name, name }) as string)}`)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt bold color={c.navy}>{t('companion.handoff.message', { name: supporter.name })}</Txt>
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.push('/help')} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center' }}>
        <Txt bold color={c.navy} style={{ textDecorationLine: 'underline' }}>{t('companion.handoff.helpNow')}</Txt>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.plain }} edges={['top', 'bottom']}>
      {/* Header: title, the current step, and an always-visible human exit */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 8, borderBottomWidth: 1, borderBottomColor: c.d ? c.border : '#E3E8EC' }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel={t('common.close')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={26} color={c.title} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.green} style={{ fontSize: 17 }}>{t('companion.title')}</Txt>
          <Txt color={c.body} style={{ fontSize: 11.5 }} numberOfLines={1}>{`${ask.step}. ${stepName} · ${t('companion.subtitle')}`}</Txt>
        </View>
        <Pressable onPress={() => router.push('/help')} accessibilityRole="button" accessibilityLabel={t('companion.sos')} style={{ backgroundColor: DS.helpRed, borderRadius: 999, paddingHorizontal: 14, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="call" size={15} color="#FFFFFF" />
          <Txt bold color="#FFFFFF" style={{ fontSize: 13 }}>{t('companion.sos')}</Txt>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
          <Txt variant="small" center color={c.body}>{t('companion.privacy')}</Txt>
          {lines.map((l) =>
            l.from === 'bot' ? (
              <View key={l.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', maxWidth: '88%' }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.d ? '#22304A' : '#E4EFEA', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={require('../../assets/logo-mark.png')} style={{ width: 20, height: 20 }} resizeMode="contain" accessibilityIgnoresInvertColors />
                </View>
                <View style={{ flexShrink: 1, backgroundColor: c.card, borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, shadowColor: '#16295F', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 }}>
                  <Txt color={c.title} style={{ fontSize: 15.5 }}>{l.text}</Txt>
                </View>
              </View>
            ) : (
              <View key={l.id} style={{ alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: c.d ? '#2B3F73' : c.navy, borderRadius: 16, borderBottomRightRadius: 4, padding: 12 }} accessible accessibilityLabel={`${t('companion.you')}: ${l.text}`}>
                <Txt color="#FFFFFF" style={{ fontSize: 15.5 }}>{l.text}</Txt>
              </View>
            ),
          )}
          {pending > 0 ? (
            <View style={{ flexDirection: 'row', gap: 4, paddingLeft: 40 }} accessible accessibilityLabel={t('companion.typing')}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.body, opacity: 0.5 }} />
              ))}
            </View>
          ) : null}
          {session.node === 's3_breathe' && pending === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <BreathingCircle />
            </View>
          ) : null}
          {handoffVisible && pending === 0 ? HandoffCard : null}
        </ScrollView>

        {paused ? (
          <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: c.d ? c.border : '#E3E8EC' }}>
            <Txt center color={c.title}>{t('companion.paused')}</Txt>
            <Chip label={t('companion.resume') as string} onPress={() => setPaused(false)} />
          </View>
        ) : (
          <View style={{ padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: c.d ? c.border : '#E3E8EC', backgroundColor: c.plain }}>
            {ask.replies.length && pending === 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ask.replies.map((r) => (
                  <Chip key={r.value} label={replyLabel(r)} onPress={() => send({ value: r.value }, replyLabel(r))} />
                ))}
              </View>
            ) : null}
            {ask.input === 'scale' && pending === 0 ? (
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup" accessibilityLabel={t('companion.scaleLabel')}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => send({ value: String(n) }, String(n))}
                      accessibilityRole="button"
                      accessibilityLabel={String(n)}
                      style={{ width: 31, height: 40, borderRadius: 8, backgroundColor: n >= 8 ? (c.d ? '#4A2228' : '#FDE3E1') : n >= 4 ? (c.d ? '#3A3520' : '#FFF0CF') : c.d ? '#1D3328' : '#E2F7EC', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Txt bold color={c.title}>{n}</Txt>
                    </Pressable>
                  ))}
                </View>
                <Txt variant="small" center color={c.body}>{t('companion.scaleHint')}</Txt>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('companion.placeholder') as string}
                placeholderTextColor="#8E959C"
                multiline
                accessibilityLabel={t('companion.placeholder') as string}
                style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: c.d ? c.border : '#D5DCE2', backgroundColor: c.card, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, fontSize: 15.5, color: c.title }}
              />
              <Pressable
                onPress={() => text.trim() && send({ text }, text.trim())}
                disabled={!text.trim() || pending > 0}
                accessibilityRole="button"
                accessibilityLabel={t('companion.send') as string}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || pending > 0 ? 0.45 : 1 }}
              >
                <Ionicons name="send" size={18} color={c.onNavy} />
              </Pressable>
            </View>
            {/* The person can always skip, pause, ask just to talk, or ask for a person. */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {ask.canSkip && !session.hold ? (
                <Pressable onPress={() => send({ value: 'skip' }, t('companion.skip') as string)} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}>
                  <Txt bold color={c.body} style={{ fontSize: 13 }}>{t('companion.skip')}</Txt>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setPaused(true)} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}>
                <Txt bold color={c.body} style={{ fontSize: 13 }}>{t('companion.pause')}</Txt>
              </Pressable>
              {!session.hold ? (
                <Pressable onPress={() => send({ text: t('companion.justTalk') as string, value: 'talk' }, t('companion.justTalk') as string)} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}>
                  <Txt bold color={c.body} style={{ fontSize: 13 }}>{t('companion.justTalk')}</Txt>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setShowHandoff(true)} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}>
                <Txt bold color={DS.helpRed} style={{ fontSize: 13 }}>{t('companion.person')}</Txt>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
