import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { Txt } from '../../components/ui';
import { Brand, Heading, Page, Pill, RadioMark, TopBar, useDS } from '../../components/ds';

export default function Language() {
  const { t, state, update } = useApp();
  const c = useDS();
  const set = (language: 'en' | 'tn') => update((s) => ({ ...s, language, settings: { ...s.settings, voiceLang: language } }));
  const Row = ({ lang, flag, name, desc }: { lang: 'en' | 'tn'; flag: string; name: string; desc: string }) => {
    const sel = state.language === lang;
    return (
      <Pressable
        onPress={() => set(lang)}
        accessibilityRole="radio"
        accessibilityState={{ selected: sel }}
        accessibilityLabel={`${name}. ${desc}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: c.card, borderRadius: 22, paddingVertical: 20, paddingHorizontal: 26, shadowColor: '#16295F', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 }}
      >
        <Txt style={{ fontSize: 30, lineHeight: 36 }} importantForAccessibility="no">
          {flag}
        </Txt>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.title} style={{ fontSize: 18 }}>
            {name}
          </Txt>
          <Txt variant="small" color={c.body}>
            {desc}
          </Txt>
        </View>
        <RadioMark selected={sel} tick />
      </Pressable>
    );
  };
  return (
    <Page
      top={<TopBar step={1} />}
      footer={<Pill title={t('common.continue')} onPress={() => { update((s) => ({ ...s, languageChosen: true })); router.push('/onboarding/role'); }} />}
    >
      <View style={{ height: 24 }} />
      <Brand size={110} />
      <View style={{ height: 12 }} />
      <Heading title={t('language.title')} subtitle={t('ui.langSub')} />
      <View style={{ gap: 18, marginTop: 12, paddingHorizontal: 14 }}>
        <Row lang="en" flag="🇬🇧" name="English" desc={t('ui.enDesc')} />
        <Row lang="tn" flag="🇧🇼" name="Setswana" desc={t('ui.tnDesc')} />
      </View>
    </Page>
  );
}
