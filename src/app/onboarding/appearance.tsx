// Accessibility & Appearance (designer's screen): read-aloud, voice language, display mode, reminders.
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useApp } from '../../lib/useApp';
import type { Settings } from '../../lib/store';
import { Txt } from '../../components/ui';
import { Brand, Card, Divider, Heading, Page, Pill, Select, TextLink, ToggleRow, useDS } from '../../components/ds';

function Preview({ dark, selected, label, onPress }: { dark: boolean; selected: boolean; label: string; onPress: () => void }) {
  const c = useDS();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{ flex: 1, borderRadius: 16, padding: 14, backgroundColor: selected ? (c.d ? '#22355A' : '#D7E5F1') : c.d ? '#1B2740' : '#F1F4F6', alignItems: 'center', gap: 10, borderWidth: selected ? 1.5 : 1, borderColor: selected ? c.navy : c.border }}
    >
      <View style={{ width: '82%', aspectRatio: 1.15, borderRadius: 10, backgroundColor: dark ? '#13342A' : '#FFFFFF', padding: 10, gap: 7, justifyContent: 'center' }}>
        <View style={{ height: 9, borderRadius: 5, backgroundColor: dark ? '#2BB673' : '#4E649D' }} />
        <View style={{ height: 6, width: '80%', borderRadius: 3, backgroundColor: dark ? '#5D6B66' : '#C9D6D2' }} />
        <View style={{ height: 6, width: '70%', borderRadius: 3, backgroundColor: dark ? '#5D6B66' : '#C9D6D2' }} />
        <View style={{ height: 14, borderRadius: 7, backgroundColor: dark ? '#2BB673' : '#4E649D', marginTop: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: c.navy, backgroundColor: selected ? c.navy : 'transparent' }} />
        <Txt variant="small" bold color={c.title}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

export default function Appearance() {
  const { t, state, update } = useApp();
  const c = useDS();
  const s = state.settings;
  const set = (patch: Partial<Settings>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const next = () => router.push(state.onboarded ? '/(tabs)' : '/onboarding/profile');
  const preview = () => {
    Speech.stop();
    Speech.speak(t('ui.previewText'), { language: s.voiceLang === 'tn' ? 'tn-ZA' : 'en-GB', rate: 0.95 });
  };
  return (
    <Page
      footer={
        <>
          <Pill title={t('common.continue')} onPress={next} />
          <TextLink title={t('ui.skipNow')} onPress={next} />
        </>
      }
    >
      <View style={{ height: 8 }} />
      <Brand size={70} />
      <Heading title={t('ui.a11yTitle')} subtitle={t('ui.a11ySub')} />
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.audioTitle')}
        </Txt>
        <Txt variant="small" color={c.body}>
          {t('ui.audioDesc')}
        </Txt>
        <ToggleRow label={t('ui.readAloud')} value={s.voiceFirst} onChange={(v) => set({ voiceFirst: v })} />
        <Divider />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt color={c.title} style={{ flex: 1 }}>
            {t('ui.voiceLang')}
          </Txt>
          <View style={{ width: 140 }}>
            <Select compact value={s.voiceLang} onChange={(k) => set({ voiceLang: k as 'en' | 'tn' })} options={[{ key: 'en', label: 'English' }, { key: 'tn', label: 'Setswana' }]} />
          </View>
        </View>
        <Pressable onPress={preview} accessibilityRole="button" style={{ minHeight: 44, borderRadius: 999, backgroundColor: c.selected, alignItems: 'center', justifyContent: 'center' }}>
          <Txt bold color={c.navy}>
            ▶ {t('ui.previewAudio')}
          </Txt>
        </Pressable>
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.displayTitle')}
        </Txt>
        <Txt variant="small" color={c.body}>
          {t('ui.displayDesc')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }} accessibilityRole="radiogroup">
          <Preview dark={false} label={t('ui.lightMode')} selected={s.themeMode !== 'dark'} onPress={() => set({ themeMode: 'light', dark: false })} />
          <Preview dark label={t('ui.darkMode')} selected={s.themeMode === 'dark'} onPress={() => set({ themeMode: 'dark', dark: true })} />
        </View>
        <Txt variant="small" color={c.body}>
          {t('ui.changeLater')}
        </Txt>
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.remindersTitle')}
        </Txt>
        <Txt variant="small" color={c.body}>
          {t('ui.remindersDesc')}
        </Txt>
        <ToggleRow label={t('ui.dailyReminders')} value={s.reminders} onChange={(v) => set({ reminders: v })} />
        <Divider />
        <Txt variant="small" color={c.body}>
          {t('ui.quietLater')}
        </Txt>
      </Card>
    </Page>
  );
}
