import React, { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { Txt } from '../../components/ui';
import Logo, { Wordmark } from '../../components/Logo';
import { Page, Pill, useDS } from '../../components/ds';

export default function Welcome() {
  const { t, theme } = useApp();
  const c = useDS();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const slides = [t('welcome.tagline'), t('welcome.slide2'), t('welcome.slide3')];
  const w = width;
  return (
    <Page
      scroll={false}
      footer={
        <>
          <Pill title={t('welcome.getStarted')} chevron onPress={() => router.push('/onboarding/language')} />
          <Pressable onPress={() => router.push('/onboarding/login')} accessibilityRole="link" style={{ minHeight: 40, justifyContent: 'center' }}>
            <Txt center color={c.title}>
              {t('ui.haveAccount')}{' '}
              <Txt color={c.title} style={{ textDecorationLine: 'underline' }}>
                {t('welcome.login')}
              </Txt>
            </Txt>
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }} accessibilityLabel={`${page + 1} / 3`}>
            {slides.map((_, i) => (
              <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i === page ? c.navy : '#B4DDEF' }} />
            ))}
          </View>
          {/* Crisis help is reachable before login (build spec 8.1). */}
          <Pressable onPress={() => router.push('/help')} accessibilityRole="button" style={{ minHeight: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <Ionicons name="heart" size={14} color={theme.colors.red} />
            <Txt variant="small" color={theme.colors.red}>
              {t('welcome.needHelpNow')}
            </Txt>
          </Pressable>
        </>
      }
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <Logo size={150} />
        <Wordmark width={300} />
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))}
          style={{ width: w, flexGrow: 0, marginTop: 18 }}
        >
          {slides.map((s, i) => (
            <View key={i} style={{ width: w, paddingHorizontal: 60 }} accessible accessibilityLabel={s}>
              <Txt center color={c.body} style={{ fontSize: 18, lineHeight: 26 }}>
                {s}
              </Txt>
            </View>
          ))}
        </ScrollView>
      </View>
    </Page>
  );
}
