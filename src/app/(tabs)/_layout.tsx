import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { Txt } from '../../components/ui';
import Logo from '../../components/Logo';
import { useLogoState } from '../../lib/useLogoState';

export const BRIGHT_RED = '#E8121F';
export const ESCALATION_ORANGE = '#F28C1B';
export const ESCALATION_PINK = '#E5407F';

// Designer's tab icons: home, heart with pulse, people, bar chart.
const META: Record<string, { icon: string; on: string; label: string }> = {
  index: { icon: 'home-outline', on: 'home', label: 'tabs.today' },
  health: { icon: 'fitness-outline', on: 'fitness', label: 'tabs.health' },
  support: { icon: 'people-outline', on: 'people', label: 'tabs.support' },
  insight: { icon: 'stats-chart-outline', on: 'stats-chart', label: 'tabs.insight' },
};

function TabBar({ state, navigateToTab, insets }: any) {
  const { t, theme } = useApp();
  const item = (route: any, i: number) => {
    const m = META[route.name];
    if (!m) return null;
    const focused = state.index === i;
    const color = focused ? (theme.dark ? '#8EA6E0' : '#4E649D') : theme.colors.heading;
    return (
      <Pressable
        key={route.key}
        onPress={() => navigateToTab(route.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t(m.label)}
        style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 }}
      >
        <Ionicons name={(focused ? m.on : m.icon) as any} size={25} color={color} />
        <Txt variant="small" bold={focused} color={color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: 12 }}>
          {t(m.label)}
        </Txt>
      </Pressable>
    );
  };
  const routes = state.routes as any[];
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
        shadowColor: '#16295F',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      {routes.slice(0, 2).map((r, i) => item(r, i))}
      {/* Raised centre quick-action button. Changes colour with the person's alert state. */}
      <View style={{ width: 84, alignItems: 'center' }}>
        <CentreLogo />
      </View>
      {routes.slice(2).map((r, i) => item(r, i + 2))}
    </View>
  );
}

function CentreLogo() {
  const { t, theme } = useApp();
  const { state: ls } = useLogoState();
  const pulse = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Gentle pulse when red, unless the person has "reduce motion" switched on.
  useEffect(() => {
    if ((ls !== 'red' && ls !== 'pink') || reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: ls === 'red' ? 1.12 : 1.06, duration: ls === 'red' ? 700 : 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: ls === 'red' ? 700 : 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ls, reduceMotion]);

  // orange: attention. red: intervention.
  // normal: the designer's navy circle with a white logo.
  const fill = ls === 'red' ? BRIGHT_RED : ls === 'pink' ? ESCALATION_PINK : ls === 'orange' ? ESCALATION_ORANGE : theme.dark ? '#6F86C4' : '#4E649D';
  const glow = ls === 'red' ? BRIGHT_RED : ls === 'pink' ? ESCALATION_PINK : ls === 'orange' ? ESCALATION_ORANGE : '#16295F';
  return (
    <Animated.View style={{ transform: [{ scale: pulse }], marginTop: -36 }}>
      <Pressable
        onPress={() => router.push(ls === 'normal' ? '/hub' : '/crisis?mode=attention')}
        accessibilityRole="button"
        accessibilityLabel={t(`logo.${ls}`)}
        style={{
          width: 74,
          height: 74,
          borderRadius: 37,
          backgroundColor: fill,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: '#FFFFFF',
          shadowColor: glow,
          shadowOpacity: ls === 'normal' ? 0.2 : 0.6,
          shadowRadius: ls === 'normal' ? 10 : 16,
          elevation: 10,
        }}
      >
        <Logo size={44} mono="#FFFFFF" />
      </Pressable>
      {/* Badge so the state is never shown by colour alone */}
      {ls !== 'normal' ? (
        <View
          importantForAccessibility="no"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: '#FFFFFF',
            borderWidth: 2,
            borderColor: fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={ls === 'red' ? 'call' : ls === 'pink' ? 'heart' : 'alert'} size={14} color={fill} />
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p: any) => <TabBar {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="health" />
      <Tabs.Screen name="support" />
      <Tabs.Screen name="insight" />
    </Tabs>
  );
}
