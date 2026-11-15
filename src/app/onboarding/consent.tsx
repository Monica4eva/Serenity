import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { addConsent } from '../../lib/store';
import { Txt } from '../../components/ui';
import { Brand, Card, Heading, IconTile, Page, Pill, SquareCheck, TopBar, useDS } from '../../components/ds';

export default function Consent() {
  const { t, update } = useApp();
  const c = useDS();
  const [terms, setTerms] = useState(false); // unticked by default
  const [data, setData] = useState(false); // unticked by default, optional
  const cards = [
    { icon: { name: 'shield-checkmark-outline' }, title: t('consent.card1Title'), body: t('ui.c1Body') },
    { icon: { name: 'stats-chart' }, title: t('ui.c2Title'), body: t('ui.c2Body') },
    // The mock-up repeated "Your data is private" here; retitled per the build spec.
    { icon: { name: 'people-outline' }, title: t('consent.card3Title'), body: t('consent.card3Body') },
  ];
  const next = () => {
    update((s) => addConsent(addConsent(s, 'terms', true), 'data', data));
    router.push('/onboarding/terms');
  };
  const link = (label: string) => (
    <Txt color={c.navy} style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/onboarding/terms?review=1')} accessibilityRole="link">
      {label}
    </Txt>
  );
  return (
    <Page top={<TopBar step={3} />} footer={<Pill title={t('common.continue')} onPress={next} disabled={!terms} />}>
      <Brand size={78} />
      <Heading title={t('consent.title')} subtitle={t('ui.consentSub')} />
      <View style={{ gap: 18, marginTop: 6 }}>
        {cards.map((k) => (
          <Card key={k.title} style={{ flexDirection: 'row', gap: 18, alignItems: 'center', paddingVertical: 18 }}>
            <IconTile icon={k.icon} tint="blue" color={c.navy} size={64} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt bold color={c.title} style={{ fontSize: 18 }}>
                {k.title}
              </Txt>
              <Txt variant="small" color={c.title}>
                {k.body}
              </Txt>
            </View>
          </Card>
        ))}
      </View>
      <View style={{ gap: 6, paddingHorizontal: 14, marginTop: 8 }}>
        <SquareCheck label={`${t('ui.agreePrefix')} ${t('ui.termsLink')} ${t('ui.and')} ${t('ui.privacyLink')}`} checked={terms} onPress={() => setTerms(!terms)}>
          <Txt color={c.title}>
            {t('ui.agreePrefix')} {link(t('ui.termsLink'))} {t('ui.and')} {link(t('ui.privacyLink'))}.
          </Txt>
        </SquareCheck>
        <SquareCheck label={t('consent.agreeData')} checked={data} onPress={() => setData(!data)}>
          <Txt color={c.title}>{t('consent.agreeData')}</Txt>
          <Txt variant="small" color={c.body}>
            {t('consent.dataOptional')}
          </Txt>
        </SquareCheck>
      </View>
    </Page>
  );
}
