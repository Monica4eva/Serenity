import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../lib/useApp';
import { IconButton, Txt } from '../components/ui';

// Centre-button quick-action hub.
export default function Hub() {
  const { t, theme } = useApp();
  const items = [
    { icon: 'chatbubbles-outline' as const, label: t('companion.title'), route: '/companion' },
    { icon: 'happy-outline' as const, label: t('hub.mood'), route: '/mood' },
    { icon: 'book-outline' as const, label: t('hub.journal'), route: '/journal' },
    { icon: 'clipboard-outline' as const, label: t('hub.daily'), route: '/daily' },
    { icon: 'fast-food-outline' as const, label: t('hub.halt'), route: '/halt' },
    { icon: 'water-outline' as const, label: t('urge.title'), route: '/urge' },
    { icon: 'heart' as const, label: t('hub.support'), route: '/help', danger: true },
  ];
  return (
    <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,20,40,0.45)', justifyContent: 'flex-end' }} onPress={() => router.back()} accessibilityLabel={t('common.close')}>
      <Pressable onPress={() => {}} accessible={false}>
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt variant="h2" style={{ flex: 1 }}>
              {t('hub.title')}
            </Txt>
            <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {items.map((it) => (
              <Pressable
                key={it.label}
                onPress={() => {
                  router.back();
                  setTimeout(() => router.push(it.route as any), 50);
                }}
                accessibilityRole="button"
                accessibilityLabel={it.label}
                style={{
                  width: '48%',
                  minHeight: 84,
                  borderRadius: 20,
                  padding: 12,
                  gap: 6,
                  backgroundColor: it.danger ? theme.colors.dangerSoft : theme.colors.selected,
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={it.icon} size={26} color={it.danger ? theme.colors.red : theme.colors.success} />
                <Txt bold color={theme.colors.heading}>
                  {it.label}
                </Txt>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </Pressable>
    </Pressable>
  );
}
