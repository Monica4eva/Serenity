// Quick-exit destination: a plain, neutral "Notes" screen with no recovery content.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';

export default function Neutral() {
  const { t } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 24, paddingTop: 80 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#111' }}>{t('exit.title')}</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>{t('exit.body')}</Text>
      {/* Long-press the title area to return */}
      <Pressable onLongPress={() => router.replace('/')} style={{ flex: 1 }} accessibilityLabel={t('exit.title')} />
    </View>
  );
}
