import React, { useEffect, useRef, useState } from 'react';
import { installWebAlert } from '../lib/webAlert';
import { ContentLoader } from '../lib/content';
import { ActivityIndicator, Alert, AppState, Pressable, Text, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { setupWebApp } from '../lib/pwa';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { freshForNewPerson, StoreProvider } from '../lib/store';
import { useApp } from '../lib/useApp';
import LockScreen from '../components/LockScreen';
import { SyncProvider } from '../components/SyncProvider';

/** Shown on every screen in "Try the demo" mode: switch view or leave (which wipes the sample data). */
function DemoBanner() {
  const { state, update, t } = useApp();
  const pathname = usePathname();
  if (!state.demo || pathname === '/demo') return null;
  const exit = () =>
    Alert.alert(t('ui.demo.exit'), t('ui.demo.exitConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('ui.demo.exit'),
        onPress: () => {
          update((s) => ({ ...freshForNewPerson(s), appRole: undefined }));
          router.replace('/onboarding/welcome');
        },
      },
    ]);
  const link = { color: '#FFFFFF', fontWeight: '700' as const, textDecorationLine: 'underline' as const, fontSize: 13 };
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#2E3F6E' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 7, paddingHorizontal: 12, flexWrap: 'wrap' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 13 }}>{t('ui.demo.banner')}</Text>
        <Pressable onPress={() => router.push('/demo')} accessibilityRole="button" hitSlop={8}>
          <Text style={link}>{t('ui.demo.switchView')}</Text>
        </Pressable>
        <Pressable onPress={exit} accessibilityRole="button" hitSlop={8}>
          <Text style={link}>{t('ui.demo.exit')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Gate() {
  const { ready, state, theme, t } = useApp();
  const pathname = usePathname();
  const [unlocked, setUnlocked] = useState(false);
  const bgAt = useRef<number | null>(null);

  // Auto-lock after 60 seconds in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') bgAt.current = Date.now();
      if (s === 'active' && bgAt.current && Date.now() - bgAt.current > 60000) setUnlocked(false);
    });
    return () => sub.remove();
  }, []);

  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4C639B" accessibilityLabel={t('common.loading')} />
      </View>
    );

  const locked = state.onboarded && state.settings.appLock && !!state.settings.pinHash && !unlocked && pathname !== '/crisis' && pathname !== '/help';

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <DemoBanner />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="hub" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="crisis" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="help" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="companion" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="demo" />
      </Stack>
      {locked ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <LockScreen onUnlock={() => setUnlocked(true)} />
        </View>
      ) : null}
    </>
  );
}

// Web app: manifest, home-screen icon and offline support (no effect in the phone apps).
setupWebApp();

installWebAlert();

export default function RootLayout() {
  // Icon fonts are loaded up front so tab and button icons always show on phones.
  const [loaded] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SyncProvider>
          <ContentLoader />
          <Gate />
        </SyncProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
