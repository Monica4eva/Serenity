// Recovery Support Agreement (designer's layout). Both people sign by typing their full name.
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useApp } from '../lib/useApp';
import { addDays, formatLong } from '../lib/dates';
import { Txt, announce } from '../components/ui';
import { Page, TopBar, useDS, DS } from '../components/ds';
import { Pressable } from 'react-native';

export default function Agreement() {
  const { t, state, update } = useApp();
  const c = useDS();
  const ag = state.agreement;
  const [p, setP] = useState(ag?.participant ?? '');
  const [s, setS] = useState(ag?.sponsor ?? '');
  const [msg, setMsg] = useState('');
  const today = formatLong(new Date(), state.language);
  const sections = t('ui.agSections') as unknown as string[][];
  const list: [string, string][] = Array.isArray(sections) ? (sections as [string, string][]) : [];

  const sign = () => {
    if (p.trim().length < 3 || s.trim().length < 3) {
      setMsg(t('ui.agNeedBoth'));
      announce(t('ui.agNeedBoth'));
      return;
    }
    const at = new Date().toISOString();
    update((x) => ({ ...x, agreement: { participant: p.trim(), sponsor: s.trim(), signedAt: at } }));
    const m = t('ui.agSigned', { d: formatLong(new Date(at), state.language), r: formatLong(addDays(new Date(at), 30), state.language) });
    setMsg(m);
    announce(m);
  };

  const Sig = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <View style={{ flex: 1, borderWidth: 1, borderColor: c.d ? c.border : '#DCE3E8', borderRadius: 8, padding: 10, gap: 6, backgroundColor: c.card }}>
      <Txt bold color={c.title} style={{ fontSize: 13 }}>{label}</Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('ui.signHere')}
        placeholderTextColor="#8E959C"
        accessibilityLabel={`${label}. ${t('ui.signHere')}`}
        autoCapitalize="words"
        style={{ borderBottomWidth: 1, borderBottomColor: '#9AA3AB', fontSize: 14, paddingVertical: 4, color: c.title, fontStyle: value ? 'italic' : 'normal' }}
      />
      <Txt variant="small" color={c.body} style={{ fontSize: 11 }}>{t('ui.dateLabel', { d: value ? today : '______' })}</Txt>
    </View>
  );

  return (
    <Page top={<TopBar close />}>
      <View style={{ backgroundColor: c.card, borderRadius: 10, padding: 14, gap: 10, shadowColor: '#16295F', shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 }}>
        <Txt bold center color={c.green} style={{ fontSize: 19 }}>{t('ui.agTitle')}</Txt>
        <Txt center color={c.green} style={{ fontSize: 12 }}>{t('ui.agSub')}</Txt>
        <Txt color={c.title} style={{ fontSize: 12.5 }}>{t('ui.agIntro')}</Txt>
        {list.map(([h, b]) => (
          <View key={h} style={{ gap: 4 }}>
            <View style={{ backgroundColor: c.d ? '#1D3328' : '#E3F1E1', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Txt bold color={c.title} style={{ fontSize: 12.5 }}>{h}</Txt>
            </View>
            <Txt color={c.title} style={{ fontSize: 12 }}>{b}</Txt>
          </View>
        ))}
        <Txt variant="small" color={c.body}>{t('ui.agHandover')}</Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Sig label={t('ui.participantSig')} value={p} onChange={setP} />
          <Sig label={t('ui.sponsorSig')} value={s} onChange={setS} />
        </View>
        <Pressable onPress={sign} accessibilityRole="button" accessibilityLabel={t('ui.signAccept')} style={{ alignSelf: 'center', backgroundColor: c.greenBtn, borderRadius: 999, paddingHorizontal: 28, minHeight: 40, justifyContent: 'center' }}>
          <Txt bold color="#FFFFFF" style={{ fontSize: 14 }}>{t('ui.signAccept')}</Txt>
        </Pressable>
        {msg || ag ? (
          <Txt center color={c.title} accessibilityLiveRegion="polite" style={{ fontSize: 13 }}>
            {msg || t('ui.agSigned', { d: formatLong(new Date(ag!.signedAt), state.language), r: formatLong(addDays(new Date(ag!.signedAt), 30), state.language) })}
          </Txt>
        ) : null}
      </View>
    </Page>
  );
}
