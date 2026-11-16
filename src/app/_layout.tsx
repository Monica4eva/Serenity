import React, { useEffect, useRef, useState } from 'react';
import { installWebAlert } from '../lib/webAlert';
import { ContentLoader } from '../lib/content';
import { ActivityIndicator, Alert, AppState, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
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
import { homeRoute } from '../lib/roles';

/** Shown on every screen in "Try the demo" mode, pinned to the top so it never scrolls away:
 *  Home (back to this view's main screen), Switch view, and Exit demo (wipes the sample data). */
const BANNER_H = 48;
function DemoBanner() {
  const { state, update, t } = useApp();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
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
  const chip = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void, strong?: boolean) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: strong ? '#FFFFFF' : 'rgba(255,255,255,0.16)' }}
    >
      <Ionicons name={icon} size={16} color={strong ? '#2E3F6E' : '#FFFFFF'} />
      <Text style={{ color: strong ? '#2E3F6E' : '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
  const bar = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: BANNER_H, paddingHorizontal: 10, flexWrap: 'nowrap' }}>
      {width > 560 ? <Text style={{ color: '#FFFFFF', fontSize: 13, marginRight: 4 }}>{t('ui.demo.banner')}</Text> : null}
      {chip(t('ui.demo.home'), 'home-outline', () => router.replace(homeRoute(state)))}
      {chip(t('ui.demo.switchView'), 'swap-horizontal-outline', () => router.push('/demo'))}
      {chip(t('ui.demo.exit'), 'exit-outline', exit, true)}
    </View>
  );
  if (Platform.OS === 'web')
    // Fixed to the window on the web, with a spacer underneath so nothing is hidden behind it.
    return (
      <>
        <View style={{ height: BANNER_H }} />
        <View style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#2E3F6E', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6 }}>{bar}</View>
      </>
    );
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#2E3F6E' }}>
      {bar}
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
