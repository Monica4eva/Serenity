// Design-system components matching the UI designer's mock-ups (Nov 2026).
// Every control keeps the accessibility rules: labels, roles, states, 48dp targets.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, TextInput, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { Txt } from './ui';
import Logo, { Wordmark } from './Logo';

export const DS = {
  navy: '#4E649D',
  green: '#0C6434',
  greenBtn: '#145533',
  title: '#0A2A1F',
  body: '#4F5B57',
  cream: '#FFFBF8',
  selected: '#E8F0F5',
  addCard: '#C8DFEF',
  helpRed: '#F20F0F',
  bgTop: '#CDE3F0',
  bgBottom: '#FAFBFC',
  plain: '#F7F8FA',
  tints: {
    blue: '#E6F1F7',
    green: '#E9F6EA',
    teal: '#E3F4F6',
    peach: '#FFEEDB',
    lavender: '#EEEBF7',
    yellow: '#FFF0CF',
    sky: '#DAF0FC',
    purple: '#EFE2FB',
    red: '#FDE3E1',
    mint: '#E2F7EC',
  },
};

/** Colours adapted for dark mode. */
export function useDS() {
  const { theme } = useApp();
  const d = theme.dark;
  return {
    d,
    navy: d ? '#8EA6E0' : DS.navy,
    onNavy: d ? '#0D1626' : '#FFFFFF',
    green: d ? '#5FD08F' : DS.green,
    greenBtn: d ? '#2E9D5B' : DS.greenBtn,
    title: theme.colors.heading,
    body: theme.colors.body,
    card: theme.colors.card,
    cream: d ? '#1B2740' : DS.cream,
    selected: d ? '#22355A' : DS.selected,
    addCard: d ? '#22355A' : DS.addCard,
    border: theme.colors.border,
    tint: (k: keyof typeof DS.tints) => (d ? '#22304A' : DS.tints[k]),
    bgTop: d ? '#0D1626' : theme.colors.bgTop === '#FBF6E9' ? '#FBF6E9' : DS.bgTop,
    bgBottom: d ? '#0D1626' : theme.colors.bgTop === '#FBF6E9' ? '#FBF6E9' : DS.bgBottom,
    plain: d ? '#0D1626' : theme.colors.bgTop === '#FBF6E9' ? '#FBF6E9' : DS.plain,
  };
}

const shadow: ViewStyle = {
  shadowColor: '#16295F',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

/** Page with the designer's soft blue gradient (or a plain light background). */
export function Page({
  children,
  top,
  footer,
  plain,
  scroll = true,
  pad = 20,
}: {
  children: React.ReactNode;
  top?: React.ReactNode;
  footer?: React.ReactNode;
  plain?: boolean;
  scroll?: boolean;
  pad?: number;
}) {
  const c = useDS();
  const Body = scroll ? ScrollView : View;
  return (
    <LinearGradient colors={plain ? [c.plain, c.plain] : [c.bgTop, c.bgBottom]} locations={[0, 0.55]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {top}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Body
            style={{ flex: 1 }}
            contentContainerStyle={scroll ? { paddingHorizontal: pad, paddingBottom: 130, gap: 14 } : undefined}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </Body>
          {footer ? <View style={{ paddingHorizontal: 44, paddingBottom: 18, paddingTop: 6, gap: 10, alignItems: 'stretch' }}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/** Top bar: back chevron, optional centred title, step indicator or close X on the right. */
export function TopBar({
  back = true,
  close,
  step,
  title,
  subtitle,
  onBack,
}: {
  back?: boolean;
  close?: boolean;
  step?: number;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const { t } = useApp();
  const c = useDS();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, minHeight: 56 }}>
      <View style={{ width: 64 }}>
        {back ? (
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={8} style={{ width: 48, height: 48, justifyContent: 'center', paddingLeft: 6 }}>
            <Ionicons name="chevron-back" size={28} color={c.title} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {title ? (
          <Txt variant="h2" center color={c.green}>
            {title}
          </Txt>
        ) : null}
        {subtitle ? (
          <Txt variant="small" center color={c.title}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      <View style={{ width: 64, alignItems: 'flex-end' }}>
        {step ? <StepDots n={step} /> : null}
        {close ? (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 }}>
            <Ionicons name="close" size={28} color={c.title} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function StepDots({ n, total = 4 }: { n: number; total?: number }) {
  const { t } = useApp();
  const c = useDS();
  return (
    <View accessible accessibilityLabel={t('common.stepOf', { n })} style={{ alignItems: 'flex-end', gap: 6, paddingRight: 8 }}>
      <Txt variant="small" bold color={c.title} style={{ fontSize: 13 }} numberOfLines={1}>
        {t('common.stepOf', { n })}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: i < n ? c.navy : '#FFFFFF', borderWidth: i < n ? 0 : 1, borderColor: '#D5E2EE' }} />
        ))}
      </View>
    </View>
  );
}

/** Logo (optionally with the "Project Serenity" wordmark) centred at the top of a screen. */
export function Brand({ wordmark = true, size = 70 }: { wordmark?: boolean; size?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 4, marginTop: 2 }}>
      <Logo size={size} />
      {wordmark ? <Wordmark width={size * 2.3} /> : null}
    </View>
  );
}

export function Heading({ title, subtitle, small }: { title: string; subtitle?: string; small?: boolean }) {
  const c = useDS();
  return (
    <View style={{ gap: 6, alignItems: 'center', marginVertical: 4 }}>
      <Txt variant={small ? 'h2' : 'h1'} center color={c.title}>
        {title}
      </Txt>
      {subtitle ? (
        <Txt center color={c.body}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

export function Card({ children, style, cream, onPress, label, selected }: { children: React.ReactNode; style?: ViewStyle; cream?: boolean; onPress?: () => void; label?: string; selected?: boolean }) {
  const c = useDS();
  const base: ViewStyle = {
    backgroundColor: selected ? c.selected : cream ? c.cream : c.card,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: selected ? 1.5 : c.d ? 1 : 0,
    borderColor: selected ? c.navy : c.border,
    ...shadow,
  };
  if (onPress)
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={selected !== undefined ? { selected } : undefined} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={[base, style]}>{children}</View>;
}

type IconSpec = { name: string; lib?: 'ion' | 'mci' };
export function Icon({ icon, size = 24, color }: { icon: IconSpec; size?: number; color: string }) {
  return icon.lib === 'mci' ? (
    <MaterialCommunityIcons name={icon.name as any} size={size} color={color} />
  ) : (
    <Ionicons name={icon.name as any} size={size} color={color} />
  );
}

export function IconTile({ icon, tint, color, size = 52, round }: { icon: IconSpec; tint: keyof typeof DS.tints; color: string; size?: number; round?: boolean }) {
  const c = useDS();
  return (
    <View style={{ width: size, height: size, borderRadius: round ? size / 2 : 14, backgroundColor: c.tint(tint), alignItems: 'center', justifyContent: 'center' }}>
      <Icon icon={icon} size={size * 0.5} color={color} />
    </View>
  );
}

/** A tappable row: icon tile, title, subtitle, chevron (Recovery Profile hub, Support Network, Profile menu). */
export function RowCard({
  title,
  subtitle,
  onPress,
  icon,
  tint = 'blue',
  iconColor,
  done,
  cream,
  right,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon?: IconSpec;
  tint?: keyof typeof DS.tints;
  iconColor?: string;
  done?: boolean;
  cream?: boolean;
  right?: React.ReactNode;
}) {
  const c = useDS();
  const { t } = useApp();
  return (
    <Card onPress={onPress} label={`${title}${subtitle ? `. ${subtitle}` : ''}${done ? `. ${t('today.done')}` : ''}`} cream={cream} style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {icon ? <IconTile icon={icon} tint={tint} color={iconColor ?? c.navy} size={46} /> : null}
        <View style={{ flex: 1 }}>
          <Txt bold color={c.title} style={{ fontSize: 17 }}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="small" color={c.body} style={{ fontSize: 13 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
        {done ? <Ionicons name="checkmark-circle" size={22} color={c.green} /> : null}
        <Ionicons name="chevron-forward" size={22} color={c.body} />
      </View>
    </Card>
  );
}

/** The designer's pill button. `chevron` adds the white circle with an arrow on the right. */
export function Pill({
  title,
  onPress,
  chevron,
  variant = 'navy',
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  chevron?: boolean;
  variant?: 'navy' | 'green' | 'red' | 'outline';
  disabled?: boolean;
  icon?: IconSpec;
}) {
  const c = useDS();
  const bg = variant === 'navy' ? c.navy : variant === 'green' ? c.greenBtn : variant === 'red' ? DS.helpRed : 'transparent';
  const fg = variant === 'outline' ? c.navy : variant === 'navy' ? c.onNavy : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: c.navy,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 8,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Icon icon={icon} size={20} color={fg} /> : null}
      <Txt bold color={fg} center style={{ fontSize: 18 }}>
        {title}
      </Txt>
      {chevron ? (
        <View style={{ position: 'absolute', right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0FAFF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={20} color={DS.navy} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function TextLink({ title, onPress, color, center = true }: { title: string; onPress: () => void; color?: string; center?: boolean }) {
  const c = useDS();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={{ minHeight: 40, justifyContent: 'center', alignItems: center ? 'center' : 'flex-start' }}>
      <Txt color={color ?? c.navy} style={{ textDecorationLine: 'underline' }}>
        {title}
      </Txt>
    </Pressable>
  );
}

/** White rounded input with a left icon; the placeholder doubles as the visible label (accessible label kept). */
export function IconInput({
  icon,
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
  error,
  autoCapitalize,
}: {
  icon: IconSpec;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  const { theme, t } = useApp();
  const c = useDS();
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.card,
          borderRadius: 16,
          paddingHorizontal: 16,
          minHeight: 52,
          gap: 12,
          borderWidth: error ? 1.5 : c.d ? 1 : 0,
          borderColor: error ? theme.colors.red : c.border,
          ...shadow,
        }}
      >
        <Icon icon={icon} size={22} color="#6B7280" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={c.d ? '#9AA6BC' : '#2B2F33'}
          secureTextEntry={secure && hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (secure || keyboardType === 'email-address' ? 'none' : 'sentences')}
          accessibilityLabel={label}
          accessibilityHint={error}
          maxFontSizeMultiplier={2}
          style={{ flex: 1, fontSize: theme.size.body + 1, fontFamily: theme.fonts.regular, color: c.title, paddingVertical: 12 }}
        />
        {secure ? (
          <Pressable onPress={() => setHidden(!hidden)} accessibilityRole="button" accessibilityLabel={hidden ? t('account.show') : t('account.hide')} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6B7280" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Txt variant="small" color={theme.colors.red} accessibilityLiveRegion="polite" style={{ paddingLeft: 8 }}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

/** Plain labelled field (forms inside cards: baseline, contact form). */
export function FieldBox({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  required,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  required?: boolean;
}) {
  const { theme } = useApp();
  const c = useDS();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Txt bold color={c.title}>
          {label}
          {required ? <Txt color="#B3261E"> *</Txt> : null}
        </Txt>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E959C"
        multiline={multiline}
        keyboardType={keyboardType}
        accessibilityLabel={label ?? placeholder}
        maxFontSizeMultiplier={2}
        style={{
          minHeight: multiline ? 96 : 48,
          borderRadius: 14,
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.d ? c.border : '#E5EAEE',
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: theme.size.body,
          fontFamily: theme.fonts.regular,
          color: c.title,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

/** Rounded-square checkbox: white with shadow, navy with a white tick when checked. */
export function SquareCheck({ checked, onPress, label, children }: { checked: boolean; onPress: () => void; label: string; children?: React.ReactNode }) {
  const c = useDS();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked }} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', minHeight: 44, paddingVertical: 4 }}>
      <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: checked ? c.navy : c.card, alignItems: 'center', justifyContent: 'center', marginTop: 1, borderWidth: c.d && !checked ? 1 : 0, borderColor: c.border, ...shadow }}>
        {checked ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
      </View>
      <View style={{ flex: 1 }}>{children ?? <Txt color={c.title}>{label}</Txt>}</View>
    </Pressable>
  );
}

export function RadioMark({ selected, tick }: { selected: boolean; tick?: boolean }) {
  const c = useDS();
  if (tick)
    return selected ? (
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
    ) : (
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#B4DDEF' }} />
    );
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selected ? c.navy : '#8A929B', alignItems: 'center', justifyContent: 'center' }}>
      {selected ? <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: c.navy }} /> : null}
    </View>
  );
}

/** Option card with a radio dot (approach) or a checkbox (goals). */
export function OptionCard({
  title,
  desc,
  selected,
  onPress,
  kind = 'radio',
}: {
  title: string;
  desc?: string;
  selected: boolean;
  onPress: () => void;
  kind?: 'radio' | 'check';
}) {
  const c = useDS();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={kind === 'radio' ? 'radio' : 'checkbox'}
      accessibilityLabel={desc ? `${title}. ${desc}` : title}
      accessibilityState={kind === 'radio' ? { selected } : { checked: selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 16,
        backgroundColor: selected ? c.selected : c.cream,
        borderWidth: selected ? 1 : 0,
        borderColor: c.navy,
        ...shadow,
      }}
    >
      {kind === 'radio' ? (
        <RadioMark selected={selected} />
      ) : (
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: selected ? 0 : 1.5, borderColor: '#8A929B', backgroundColor: selected ? '#A9C5DD' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {title}
        </Txt>
        {desc ? (
          <Txt variant="small" color={c.body}>
            {desc}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Dropdown: a field that opens a list of options. */
export function Select({
  label,
  value,
  options,
  onChange,
  placeholder,
  icon,
  compact,
  hideLabel,
  multi,
}: {
  /** multi: several can be chosen; the value is the chosen keys joined with commas. */
  multi?: boolean;
  label?: string;
  value?: string;
  options: { key: string; label: string }[];
  onChange: (k: string) => void;
  placeholder?: string;
  icon?: IconSpec;
  compact?: boolean;
  hideLabel?: boolean;
}) {
  const { t, theme } = useApp();
  const c = useDS();
  const [open, setOpen] = useState(false);
  const chosen = multi ? (value ?? '').split(',').filter(Boolean) : value ? [value] : [];
  const isOn = (k: string) => chosen.includes(k);
  const shown = options.filter((o) => isOn(o.key)).map((o) => o.label).join(', ');
  const current = shown ? { label: shown } : undefined;
  return (
    <View style={{ gap: 6 }}>
      {label && !hideLabel ? (
        <Txt color={c.body} style={{ fontSize: 14 }}>
          {label}
        </Txt>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={`${label ?? placeholder ?? ''}: ${current?.label ?? placeholder ?? ''}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: compact ? 40 : 48,
          borderRadius: compact ? 10 : 14,
          borderWidth: 1,
          borderColor: c.d ? c.border : '#C9DCCF',
          backgroundColor: c.d ? c.card : '#F8FBF8',
          paddingHorizontal: 12,
        }}
      >
        {icon ? <Icon icon={icon} size={18} color={c.navy} /> : null}
        <Txt style={{ flex: 1, fontSize: 14 }} color={current ? c.title : '#6E767D'}>
          {current?.label ?? placeholder ?? t('ui.select')}
        </Txt>
        <Ionicons name="chevron-down" size={18} color={c.body} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,20,40,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)} accessibilityLabel={t('common.close')}>
          <View onStartShouldSetResponder={() => true} style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 32, maxHeight: '75%' }}>
            {label ? (
              <Txt variant="h3" style={{ marginBottom: multi ? 2 : 8 }}>
                {label}
              </Txt>
            ) : null}
            {multi ? (
              <Txt variant="small" color={c.body} style={{ marginBottom: 8 }}>
                {t('ui.chooseAll')}
              </Txt>
            ) : null}
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    if (multi) {
                      const next = isOn(o.key) ? chosen.filter((k) => k !== o.key) : [...chosen, o.key];
                      onChange(options.map((x) => x.key).filter((k) => next.includes(k)).join(','));
                      return;
                    }
                    onChange(o.key);
                    setOpen(false);
                  }}
                  accessibilityRole={multi ? 'checkbox' : 'radio'}
                  accessibilityState={multi ? { checked: isOn(o.key) } : { selected: isOn(o.key) }}
                  accessibilityLabel={o.label}
                  style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: c.border }}
                >
                  <RadioMark selected={isOn(o.key)} tick={multi} />
                  <Txt color={c.title} style={{ flex: 1, fontSize: theme.size.body }}>
                    {o.label}
                  </Txt>
                </Pressable>
              ))}
            </ScrollView>
            {multi ? (
              <View style={{ marginTop: 12 }}>
                <Pill title={t('common.done')} onPress={() => setOpen(false)} />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Segmented control (green selected, as on Health screens) or navy (Terms, Log in). */
export function Seg({ options, value, onChange, color = 'green', big, small }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void; color?: 'green' | 'navy'; big?: boolean; small?: boolean }) {
  const c = useDS();
  const sel = color === 'green' ? c.greenBtn : c.navy;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderRadius: 999,
        backgroundColor: c.card,
        borderWidth: big ? 1.5 : 1,
        borderColor: color === 'navy' ? c.navy : c.border,
        padding: big ? 0 : 3,
        ...(big ? shadow : {}),
      }}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={{ flex: small ? undefined : 1, flexGrow: 1, minHeight: big ? 52 : small ? 34 : 40, borderRadius: 999, backgroundColor: on ? sel : 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: small ? 10 : 8 }}
          >
            <Txt bold={on || big} center color={on ? (c.d && color === 'navy' ? c.onNavy : '#FFFFFF') : color === 'navy' ? c.navy : c.title} numberOfLines={1} adjustsFontSizeToFit={small} style={{ fontSize: big ? 17 : small ? 12 : 14 }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({ label, value, onChange, desc }: { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string }) {
  const c = useDS();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <Txt bold color={c.title}>
          {label}
        </Txt>
        {desc ? <Txt variant="small">{desc}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: c.navy, false: '#C9CED6' }} thumbColor="#FFFFFF" />
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const c = useDS();
  return (
    <Txt bold color={c.title} style={{ fontSize: 18, marginTop: 6 }} accessibilityRole="header">
      {children}
    </Txt>
  );
}

export function Divider() {
  const c = useDS();
  return <View style={{ height: 1, backgroundColor: c.border }} />;
}
