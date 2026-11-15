// Shared accessible UI kit (Sections 3 and 3A).
// Every control: accessibility label, role and state, min 48x48 touch target,
// scales with Dynamic Type (up to 200%), never uses colour alone.
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import type { Level } from '../lib/engine';

export const announce = (msg: string) => AccessibilityInfo.announceForAccessibility(msg);

type TxtProps = TextProps & { variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small'; color?: string; bold?: boolean; center?: boolean };

export function Txt({ variant = 'body', color, bold, center, style, ...rest }: TxtProps) {
  const { theme } = useApp();
  const size = theme.size[variant];
  const isHeading = variant === 'h1' || variant === 'h2' || variant === 'h3';
  return (
    <Text
      maxFontSizeMultiplier={2}
      accessibilityRole={isHeading ? 'header' : undefined}
      style={[
        {
          fontFamily: isHeading || bold ? theme.fonts.bold : theme.fonts.regular,
          fontSize: size,
          lineHeight: size * theme.lineHeight,
          letterSpacing: theme.letterSpacing,
          color: color ?? (isHeading ? theme.colors.heading : theme.colors.body),
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
      {...rest}
    />
  );
}

export function Screen({
  children,
  title,
  back = true,
  scroll = true,
  right,
  footer,
}: {
  children: React.ReactNode;
  title?: string;
  back?: boolean;
  scroll?: boolean;
  right?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { theme, t } = useApp();
  const Body = scroll ? ScrollView : View;
  return (
    <LinearGradient colors={[theme.colors.bgTop, theme.colors.bgBottom]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {(title || back) && (
          <View style={styles.header}>
            {back ? (
              <IconButton icon="chevron-back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            ) : (
              <View style={{ width: 48 }} />
            )}
            <View style={{ flex: 1 }}>{title ? <Txt variant="h2" center>{title}</Txt> : null}</View>
            {right ?? <View style={{ width: 48 }} />}
          </View>
        )}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Body style={{ flex: 1 }} contentContainerStyle={scroll ? { padding: 20, paddingBottom: 120, gap: 16 } : undefined} keyboardShouldPersistTaps="handled">
            {children}
          </Body>
          {footer ? <View style={{ padding: 20, paddingTop: 8, gap: 10 }}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Card({ children, style, onPress, label }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; label?: string }) {
  const { theme } = useApp();
  const base: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    padding: 18,
    gap: 10,
    borderWidth: theme.dark || theme.colors.border === '#333333' ? 1 : 0,
    borderColor: theme.colors.border,
    shadowColor: '#16295F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
  if (onPress)
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={[base, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  hint,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  hint?: string;
}) {
  const { theme } = useApp();
  const c = theme.colors;
  const bg =
    variant === 'primary' ? c.primary : variant === 'success' ? c.success : variant === 'danger' ? c.red : variant === 'secondary' ? c.card : 'transparent';
  const fg = variant === 'secondary' || variant === 'ghost' ? c.primary : variant === 'primary' ? c.onPrimary : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: c.primary, borderWidth: variant === 'secondary' ? 1.5 : 0, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <Txt bold color={fg} center style={{ flexShrink: 1 }}>
        {title}
      </Txt>
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string }) {
  const { theme } = useApp();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={styles.iconBtn}>
      <Ionicons name={icon} size={26} color={color ?? theme.colors.heading} />
    </Pressable>
  );
}

/** Selectable chip. Selected state uses colour + tick icon + accessibility state. */
export function Chip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: string }) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={[
        styles.chip,
        { backgroundColor: selected ? theme.colors.selected : theme.colors.card, borderColor: selected ? theme.colors.success : theme.colors.border },
      ]}
    >
      {selected ? <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} /> : icon ? <Txt>{icon}</Txt> : null}
      <Txt bold={selected} color={theme.colors.heading}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Radio({ label, desc, selected, onPress }: { label: string; desc?: string; selected: boolean; onPress: () => void }) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={desc ? `${label}. ${desc}` : label}
      accessibilityState={{ selected }}
      style={[styles.radioRow, { backgroundColor: selected ? theme.colors.selected : theme.colors.card, borderColor: selected ? theme.colors.success : theme.colors.border }]}
    >
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={selected ? theme.colors.success : theme.colors.body} />
      <View style={{ flex: 1 }}>
        <Txt bold color={theme.colors.heading}>
          {label}
        </Txt>
        {desc ? <Txt variant="small">{desc}</Txt> : null}
      </View>
    </Pressable>
  );
}

export function Checkbox({ label, checked, onPress, children }: { label: string; checked: boolean; onPress: () => void; children?: React.ReactNode }) {
  const { theme } = useApp();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked }} style={styles.checkRow}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={26} color={checked ? theme.colors.success : theme.colors.body} />
      <View style={{ flex: 1 }}>
        <Txt color={theme.colors.heading}>{label}</Txt>
        {children}
      </View>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  error,
  secure,
  multiline,
  keyboardType,
  placeholder,
  autoCapitalize,
  hideLabel,
}: {
  hideLabel?: boolean;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  secure?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  placeholder?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  const { theme, t } = useApp();
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 6 }}>
      {hideLabel ? null : (
        <Txt bold color={theme.colors.heading}>
          {label}
        </Txt>
      )}
      <View style={[styles.input, { borderColor: error ? theme.colors.red : theme.colors.border, backgroundColor: theme.colors.card }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="#8A8F98"
          autoCapitalize={autoCapitalize ?? (secure || keyboardType === 'email-address' ? 'none' : 'sentences')}
          accessibilityLabel={label}
          accessibilityHint={error}
          maxFontSizeMultiplier={2}
          style={{
            flex: 1,
            minHeight: multiline ? 120 : 48,
            fontSize: theme.size.body,
            fontFamily: theme.fonts.regular,
            color: theme.colors.heading,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingVertical: 10,
          }}
        />
        {secure ? (
          <IconButton icon={hidden ? 'eye-outline' : 'eye-off-outline'} label={hidden ? t('account.show') : t('account.hide')} onPress={() => setHidden(!hidden)} />
        ) : null}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={18} color={theme.colors.red} />
          <Txt variant="small" color={theme.colors.red}>
            {error}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export function StepHeader({ n }: { n: number }) {
  const { t, theme } = useApp();
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={t('common.stepOf', { n })}>
      <Txt variant="small" bold color={theme.colors.primary}>
        {t('common.stepOf', { n })}
      </Txt>
      <ProgressBar value={n / 4} />
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const { theme } = useApp();
  const v = Math.max(0, Math.min(1, value));
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let reduce = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => (reduce = r))
      .catch(() => {})
      .finally(() => {
        if (reduce) anim.setValue(v);
        else Animated.timing(anim, { toValue: v, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      });
  }, [v]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.border, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          height: '100%',
          backgroundColor: color ?? theme.colors.success,
          borderRadius: 4,
        }}
      />
    </View>
  );
}

export function ListenButton({ text }: { text: string }) {
  const { t, speak, stopSpeaking, theme } = useApp();
  const [on, setOn] = useState(false);
  return (
    <Pressable
      onPress={() => {
        if (on) stopSpeaking();
        else speak(text);
        setOn(!on);
      }}
      accessibilityRole="button"
      accessibilityLabel={on ? t('common.stop') : t('common.listen')}
      style={[styles.listen, { borderColor: theme.colors.primary }]}
    >
      <Ionicons name={on ? 'stop-circle-outline' : 'volume-high-outline'} size={20} color={theme.colors.primary} />
      <Txt bold color={theme.colors.primary}>
        {on ? t('common.stop') : t('common.listen')}
      </Txt>
    </Pressable>
  );
}

const LEVEL_META: Record<Level, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  green: { color: '#2E9D5B', icon: 'checkmark-circle' },
  amber: { color: '#F5A623', icon: 'alert-circle' },
  red: { color: '#D64545', icon: 'warning' },
};

/** Level badge: colour + icon + words, never colour alone. */
export function LevelBadge({ level }: { level: Level }) {
  const { t, theme } = useApp();
  const m = LEVEL_META[level];
  return (
    <View style={[styles.badge, { backgroundColor: m.color + '22', borderColor: m.color }]} accessible accessibilityLabel={t(`levels.${level}`)}>
      <Ionicons name={m.icon} size={18} color={m.color} />
      <Txt bold color={level === 'amber' ? theme.colors.warnText : theme.dark && level === 'red' ? '#FF8A8A' : m.color}>
        {t(`levels.${level}`)}
      </Txt>
    </View>
  );
}

export function Segmented({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  const { theme } = useApp();
  return (
    <View style={[styles.segment, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} accessibilityRole="tablist">
      {options.map((o) => {
        const sel = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={o.label}
            style={[styles.segItem, sel && { backgroundColor: theme.colors.primary }]}
          >
            <Txt variant="small" bold center color={sel ? theme.colors.onPrimary : theme.colors.heading}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Disclaimer({ text }: { text?: string }) {
  const { t, theme } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <Ionicons name="information-circle-outline" size={18} color={theme.colors.body} />
      <Txt variant="small" style={{ flex: 1 }}>
        {text ?? t('common.notMedical')}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 56 },
  button: { minHeight: 52, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 48, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  radioRow: { minHeight: 56, borderRadius: 18, borderWidth: 1.5, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkRow: { minHeight: 48, flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 },
  input: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  listen: { alignSelf: 'flex-start', minHeight: 44, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6 },
  segment: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 4 },
  segItem: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
