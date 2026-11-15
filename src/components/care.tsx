// Building blocks shared by the care-team screens (person in recovery, counsellor, supporter).
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import type { CareMessage } from '../lib/store';
import { sendMessage, markRead } from '../lib/care';
import { allowedPermissions, type CareRole, type LogoColour, type Permissions, type TrendDay } from '../lib/summary';
import { formatDateTime } from '../lib/dates';
import { Txt, announce } from './ui';
import { Card, DS, ToggleRow, useDS } from './ds';

export const LOGO_COLOURS: Record<LogoColour, string> = { normal: '#4E649D', orange: '#F28C28', pink: '#E8508B', red: '#F20F0F' };
export const STATUS_COLOURS = { okay: '#0C6434', support: '#F28C28', help: '#F20F0F' } as const;

/** Small round dot in the button's colour. */
export function ColourDot({ colour, size = 14 }: { colour: LogoColour; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: LOGO_COLOURS[colour] }} />;
}

/** Initials avatar, tinted by the person's status. */
export function Avatar({ name, colour = '#4E649D', size = 46 }: { name: string; colour?: string; size?: number }) {
  const initials = (name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colour, alignItems: 'center', justifyContent: 'center' }}>
      <Txt bold color="#FFFFFF" style={{ fontSize: size * 0.38 }}>{initials}</Txt>
    </View>
  );
}

export function SampleTag() {
  const { t } = useApp();
  return (
    <View style={{ backgroundColor: '#FFF0CF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Txt bold color="#8A5A00" style={{ fontSize: 11 }}>{t('care.home.sample')}</Txt>
    </View>
  );
}

/** The permission switches. Supporters only see the four that make sense for them. */
export function PermissionToggles({ role, value, onChange }: { role: CareRole; value: Permissions; onChange: (p: Permissions) => void }) {
  const { t } = useApp();
  return (
    <Card style={{ gap: 4 }}>
      {allowedPermissions(role).map((k) => (
        <ToggleRow key={k} label={t(`care.perm.${role}.${k}.t`)} desc={t(`care.perm.${role}.${k}.d`)} value={!!value[k]} onChange={(v) => onChange({ ...value, [k]: v })} />
      ))}
    </Card>
  );
}

/** Tiny bar chart for 14 days. Missing days are shown as a faint stub. */
export function MiniBars({ label, days, pick, max, colour, fmt }: { label: string; days: TrendDay[]; pick: (d: TrendDay) => number | undefined | null; max: number; colour: string; fmt?: (v: number) => string }) {
  const c = useDS();
  const vals = days.map(pick);
  const known = vals.filter((v): v is number => typeof v === 'number');
  const avg = known.length ? known.reduce((a, b) => a + b, 0) / known.length : null;
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${label}: ${known.map((v) => (fmt ? fmt(v) : String(v))).join(', ')}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt bold color={c.title} style={{ fontSize: 14 }}>{label}</Txt>
        {avg !== null ? <Txt color={c.body} style={{ fontSize: 13 }}>{fmt ? fmt(avg) : avg.toFixed(1)}</Txt> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 3 }}>
        {vals.map((v, i) => (
          <View key={i} style={{ flex: 1, height: typeof v === 'number' ? Math.max(4, (Math.min(v, max) / max) * 44) : 3, borderRadius: 3, backgroundColor: typeof v === 'number' ? colour : c.border }} />
        ))}
      </View>
    </View>
  );
}

/** Message thread between the person and one linked counsellor or supporter. */
export function MessageThread({ linkId, demo, canSend, otherName }: { linkId: string; demo?: boolean; canSend: boolean; otherName: string }) {
  const { t, state, update: upd } = useApp();
  const c = useDS();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const msgs: CareMessage[] = state.care.messages.filter((m) => m.linkId === linkId);

  React.useEffect(() => {
    const unread = msgs.filter((m) => !m.mine && !m.read);
    if (!unread.length) return;
    if (!demo) markRead(unread.map((m) => m.id)).catch(() => {});
    upd((s) => ({ ...s, care: { ...s.care, messages: s.care.messages.map((m) => (m.linkId === linkId && !m.mine ? { ...m, read: true } : m)) } }));
  }, [msgs.length]);

  const send = async (body = text) => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const m = await sendMessage(linkId, body, demo);
      upd((s) => ({ ...s, care: { ...s.care, messages: [...s.care.messages, m] } }));
      setText('');
      announce(t('care.sup.sent'));
    } catch {
      announce(t('care.msg.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {msgs.length === 0 ? <Txt color={c.body}>{t('care.msg.empty')}</Txt> : null}
      {msgs.slice(-30).map((m) => (
        <View key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
          <View style={{ backgroundColor: m.mine ? c.navy : c.card, borderRadius: 16, borderBottomRightRadius: m.mine ? 4 : 16, borderBottomLeftRadius: m.mine ? 16 : 4, paddingHorizontal: 14, paddingVertical: 10 }}>
            <Txt color={m.mine ? c.onNavy : c.title}>{m.body}</Txt>
          </View>
          <Txt color={c.body} style={{ fontSize: 11, textAlign: m.mine ? 'right' : 'left', marginTop: 2 }}>
            {m.mine ? '' : `${otherName} · `}{formatDateTime(new Date(m.at), state.language)}
          </Txt>
        </View>
      ))}
      {canSend ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 24, paddingLeft: 16, paddingRight: 6, minHeight: 52, borderWidth: c.d ? 1 : 0, borderColor: c.border }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('care.msg.ph')}
            placeholderTextColor={c.d ? '#9AA6BC' : '#6B7280'}
            accessibilityLabel={t('care.msg.ph')}
            maxLength={1000}
            multiline
            style={{ flex: 1, color: c.title, fontSize: 16, paddingVertical: 10 }}
          />
          <Pressable onPress={() => send()} disabled={!text.trim() || busy} accessibilityRole="button" accessibilityLabel={t('care.msg.send')} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: text.trim() ? c.navy : c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={18} color={c.onNavy} />
          </Pressable>
        </View>
      ) : null}
      <Txt variant="small" color={c.body} style={{ fontSize: 12 }}>{t('care.msg.note')}</Txt>
    </View>
  );
}

/** Big, easy-to-read invite code. */
export function CodeBox({ code }: { code: string }) {
  const c = useDS();
  const shown = code.length === 10 ? `${code.slice(0, 5)}-${code.slice(5)}` : code;
  return (
    <View accessible accessibilityLabel={code.split('').join(' ')} style={{ backgroundColor: c.card, borderRadius: 18, paddingVertical: 20, alignItems: 'center', borderWidth: 2, borderColor: c.navy, borderStyle: 'dashed' }}>
      <Txt bold color={c.navy} style={{ fontSize: 30, letterSpacing: 4, fontFamily: undefined }}>{shown}</Txt>
    </View>
  );
}

/** Coloured banner for a person's simple status. */
export function StatusBanner({ tone, title, body, icon }: { tone: 'okay' | 'support' | 'help' | 'none'; title: string; body: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const bg = tone === 'help' ? DS.helpRed : tone === 'support' ? '#FFEEDB' : tone === 'okay' ? '#E9F6EA' : '#EEF1F5';
  const fg = tone === 'help' ? '#FFFFFF' : tone === 'support' ? '#8A4B00' : tone === 'okay' ? '#0C6434' : '#4F5B57';
  return (
    <View accessibilityRole={tone === 'help' ? 'alert' : undefined} style={{ backgroundColor: bg, borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Ionicons name={icon ?? (tone === 'help' ? 'alert-circle' : tone === 'support' ? 'heart-half' : tone === 'okay' ? 'checkmark-circle' : 'remove-circle-outline')} size={28} color={fg} />
      <View style={{ flex: 1, gap: 4 }}>
        <Txt bold color={fg} style={{ fontSize: 18 }}>{title}</Txt>
        <Txt color={fg}>{body}</Txt>
      </View>
    </View>
  );
}

/** Small tab strip used on the client screen. */
export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: string; badge?: number }[]; value: K; onChange: (k: K) => void }) {
  const c = useDS();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {tabs.map((tb) => {
        const on = tb.key === value;
        return (
          <Pressable key={tb.key} onPress={() => onChange(tb.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: on ? c.navy : c.card, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: c.d ? 1 : 0, borderColor: c.border }}>
            <Txt bold color={on ? c.onNavy : c.title} style={{ fontSize: 14 }}>{tb.label}</Txt>
            {tb.badge ? (
              <View style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: DS.helpRed, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <Txt bold color="#FFFFFF" style={{ fontSize: 11 }}>{tb.badge}</Txt>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
