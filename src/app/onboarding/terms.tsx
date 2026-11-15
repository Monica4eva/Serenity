import React, { useState } from 'react';
import { homeRoute, isViewer } from '../../lib/roles';
import { saveCareProfile } from '../../lib/care';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { TERMS_VERSION } from '../../lib/store';
import { ListenButton, Txt } from '../../components/ui';
import { Card, Heading, Page, Pill, Seg, SquareCheck, TopBar, useDS } from '../../components/ds';

export default function Terms() {
  const { t, update, state } = useApp();
  const c = useDS();
  const [tab, setTab] = useState('terms');
  const [more, setMore] = useState(false);
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const body: string = tab === 'terms' ? t('ui.termsBody') : t('ui.privacyBody');
  const lines = body.split('\n');
  const shown = more ? lines : lines.slice(0, tab === 'terms' ? 7 : 8);
  const accept = () => {
    update((s) => ({ ...s, termsVersionAccepted: TERMS_VERSION }));
    if (state.onboarded) router.back();
    else if (isViewer(state)) {
      if (state.account) saveCareProfile(state.appRole!, state.profile.preferredName || state.account.fullName).catch(() => {});
      router.replace(homeRoute(state));
    } else router.push('/onboarding/appearance');
  };
  const isHeading = (l: string) => /^\d+\.\s/.test(l) || /^[a-z]\.\s/.test(l);
  return (
    <Page
      top={<TopBar />}
      footer={<Pill title={t('terms.acceptContinue')} chevron onPress={accept} disabled={!(a1 && a2)} />}
    >
      <Heading title={t('terms.title')} subtitle={t('ui.termsSub')} />
      <Seg
        big
        color="navy"
        value={tab}
        onChange={(k) => {
          setTab(k);
          setMore(false);
        }}
        options={[{ key: 'terms', label: t('terms.termsTab') }, { key: 'privacy', label: t('terms.privacyTab') }]}
      />
      <Card style={{ gap: 10 }}>
        <View>
          <Txt variant="h2" color={c.navy}>
            {tab === 'terms' ? t('terms.termsTab') : t('terms.privacyTab')}
          </Txt>
          <Txt color={c.title} style={{ fontSize: 11 }}>
            {t('ui.effective')}
          </Txt>
        </View>
        <ListenButton text={body} />
        {shown.map((l, i) => (
          <Txt key={i} bold={isHeading(l)} color={c.title} style={{ fontSize: 14 }}>
            {l}
          </Txt>
        ))}
        <Pressable onPress={() => setMore(!more)} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center', alignItems: 'center' }}>
          <Txt bold color={c.navy} style={{ textDecorationLine: 'underline' }}>
            {more ? t('terms.showLess') : t('terms.showMore')}
          </Txt>
        </Pressable>
      </Card>
      <View style={{ paddingHorizontal: 14 }}>
        <SquareCheck label={`${t('ui.readAgree')} ${t('ui.termsLink')}`} checked={a1} onPress={() => setA1(!a1)}>
          <Txt color={c.title}>
            {t('ui.readAgree')}{' '}
            <Txt color={c.navy} style={{ textDecorationLine: 'underline' }} onPress={() => setTab('terms')}>
              {t('ui.termsLink')}.
            </Txt>
          </Txt>
        </SquareCheck>
        <SquareCheck label={`${t('ui.readAgree')} ${t('ui.privacyLink')}`} checked={a2} onPress={() => setA2(!a2)}>
          <Txt color={c.title}>
            {t('ui.readAgree')}{' '}
            <Txt color={c.navy} style={{ textDecorationLine: 'underline' }} onPress={() => setTab('privacy')}>
              {t('ui.privacyLink')}.
            </Txt>
          </Txt>
        </SquareCheck>
      </View>
      <Txt variant="small" center color={c.body}>
        {t('terms.draft')}
      </Txt>
    </Page>
  );
}
