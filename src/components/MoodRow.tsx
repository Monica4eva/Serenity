import React from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '../lib/useApp';
import { Txt } from './ui';

export const MOODS = [
  { key: 'stressed', emoji: '😣' },
  { key: 'anxious', emoji: '😟' },
  { key: 'okay', emoji: '😐' },
  { key: 'calm', emoji: '🙂' },
  { key: 'great', emoji: '😄' },
];

/** Line-icon faces used by the designer on the journal screens. */
export const MOOD_ICONS = ['emoticon-cry-outline', 'emoticon-frown-outline', 'emoticon-neutral-outline', 'emoticon-happy-outline', 'emoticon-excited-outline'];
export const moodIcon = (i?: number) => (i === undefined ? 'emoticon-outline' : MOOD_ICONS[i] ?? 'emoticon-outline');

export const moodEmoji = (i?: number) => (i === undefined ? '＋' : MOODS[i]?.emoji ?? '＋');

export function MoodRow({ value, onChange }: { value?: number; onChange: (i: number) => void }) {
  const { t, theme } = useApp();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }} accessibilityRole="radiogroup">
      {MOODS.map((m, i) => {
        const sel = value === i;
        const label = t(`baseline.moods.${m.key}`);
        return (
          <Pressable
            key={m.key}
            onPress={() => onChange(i)}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected: sel }}
            style={{
              flex: 1,
              minHeight: 76,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: sel ? theme.colors.success : 'transparent',
              backgroundColor: sel ? theme.colors.selected : 'transparent',
            }}
          >
            <Txt style={{ fontSize: 30, lineHeight: 38 }}>{m.emoji}</Txt>
            <Txt variant="small" bold={sel} center color={theme.colors.heading} numberOfLines={1} adjustsFontSizeToFit>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ label, value, onChange, min = 0, max = 14, unit = '' }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; unit?: string }) {
  const { theme, t } = useApp();
  const btn = (d: number, sym: string, lbl: string) => (
    <Pressable
      onPress={() => onChange(Math.max(min, Math.min(max, value + d)))}
      accessibilityRole="button"
      accessibilityLabel={`${lbl} ${label}`}
      style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.selected, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt variant="h2" color={theme.colors.success}>
        {sym}
      </Txt>
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }}>
      <Txt bold color={theme.colors.heading}>
        {label}
      </Txt>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value} ${unit}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onChange(Math.max(min, Math.min(max, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      >
        {btn(-1, '−', t('common.decrease'))}
        <Txt variant="h2" style={{ minWidth: 60, textAlign: 'center' }}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Txt>
        {btn(1, '+', t('common.increase'))}
      </View>
    </View>
  );
}
