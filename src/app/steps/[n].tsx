// One step: our own wording, three reflection questions, journal, sponsor, mark complete.
import React from 'react';
import { useContent } from '../../lib/content';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { dayKey } from '../../lib/dates';
import { Txt, ListenButton, announce } from '../../components/ui';
import { Card, Page, Pill, TopBar, useDS } from '../../components/ds';

export default function Step() {
  const { t, state, update } = useApp();
  const c = useDS();
  const q = useLocalSearchParams<{ n: string; share?: string }>();
  const n = Math.min(12, Math.max(1, Number(q.n) || 1));
  const { steps } = useContent();
  const step = steps.find((x) => x.n === n);
  const text = (state.language === 'tn' ? step?.tn.text : step?.en.text) ?? (t('ui.stepTexts') as unknown as string[])[n - 1];
  const qs = (state.language === 'tn' ? step?.tn.qs : step?.en.qs)?.length ? (state.language === 'tn' ? step!.tn.qs : step!.en.qs) : (t('ui.stepQs') as unknown as string[]);
  const done = state.stepsDone.includes(n);
  const sponsor = state.contacts.find((x) => x.role === 'sponsor');
  const name = state.profile.preferredName || '';
  const today = dayKey();
  const markReading = () => update((s) => ({ ...s, focus: { ...s.focus, [today]: Array.from(new Set([...(s.focus[today] ?? []), 'reading'])) } }));

  const toggle = () => {
    update((s) => ({ ...s, stepsDone: done ? s.stepsDone.filter((x) => x !== n) : [...s.stepsDone, n].sort((a, b) => a - b) }));
    markReading();
    announce(t('common.saved'));
  };
  const toSponsor = () => {
    if (!sponsor) return router.push({ pathname: '/onboarding/contact', params: { role: 'sponsor' } });
    Linking.openURL(`sms:${sponsor.phone}?body=${encodeURIComponent(t('ui.shareMsg', { contact: sponsor.name, name, n }))}`);
  };

  return (
    <Page top={<TopBar close title={t('ui.stepN', { n })} />}>
      {q.share ? (
        <Card cream>
          <Txt bold color={c.title} style={{ fontSize: 17 }}>{t('ui.shareTitle')}</Txt>
          <Txt color={c.title}>{t('ui.shareBody')}</Txt>
          <Pill title={t('ui.shareSponsor')} variant="outline" onPress={toSponsor} />
        </Card>
      ) : null}
      <Card>
        <Txt bold color={c.green} style={{ fontSize: 20 }}>{text}</Txt>
        <ListenButton text={text} />
      </Card>
      <Card cream>
        {qs.map((x, i) => (
          <Txt key={x} color={c.title} style={{ fontSize: 15 }}>{`${i + 1}. ${x}`}</Txt>
        ))}
      </Card>
      <View style={{ gap: 12 }}>
        <Pill title={t('ui.stepReflect')} onPress={() => { markReading(); router.push({ pathname: '/mood', params: { prompt: t('ui.stepN', { n }), qs: qs.join('\n') } }); }} />
        <Pill title={t('ui.stepTalk')} variant="outline" onPress={toSponsor} />
        <Pill title={done ? t('ui.stepUndo') : t('ui.stepComplete')} variant={done ? 'outline' : 'green'} onPress={toggle} />
      </View>
      <Txt variant="small" color={c.body}>{t('ui.stepWording')}</Txt>
    </Page>
  );
}
