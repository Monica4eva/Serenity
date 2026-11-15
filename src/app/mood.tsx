// Mood + journal editor (designer's layout): mood face, date and real day name, time,
// a large writing card with a toolbar (undo, redo, paste, bold, link, photo) and Submit.
import React, { useRef, useState } from 'react';
import { Alert, Image, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { scanText, TextSignal } from '../lib/engine';
import { weekdayLong } from '../lib/dates';
import { Txt, announce } from '../components/ui';
import { Page, TopBar, useDS } from '../components/ds';
import { MOODS } from '../components/MoodRow';
import SafetyPrompt from '../components/SafetyPrompt';

const pad = (n: number) => String(n).padStart(2, '0');

export default function Mood() {
  const { t, update, state } = useApp();
  const c = useDS();
  const q = useLocalSearchParams<{ id?: string; prompt?: string; mood?: string; qs?: string }>();
  // Reflection questions (for example from a 12-Step page) stay visible here, so nobody has to go back and re-read them.
  const refQs = (q.qs ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const [showQs, setShowQs] = useState(true);
  const existing = q.id ? state.journal.find((j) => j.id === q.id) : undefined;
  const [mood, setMood] = useState<number | undefined>(existing?.mood ?? (q.mood !== undefined ? Number(q.mood) : undefined));
  const [picking, setPicking] = useState(mood === undefined);
  const [text, setText] = useState(existing?.text ?? '');
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo);
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const [, force] = useState(0);
  const [signal, setSignal] = useState<TextSignal>('none');
  const when = existing ? new Date(existing.at) : new Date();
  const h = when.getHours();
  const time = `${h % 12 || 12}:${pad(when.getMinutes())} ${h < 12 ? 'am' : 'pm'}`;

  const change = (v: string) => {
    past.current.push(text);
    future.current = [];
    setText(v);
  };
  const undo = () => {
    const prev = past.current.pop();
    if (prev === undefined) return;
    future.current.push(text);
    setText(prev);
    force((n) => n + 1);
  };
  const redo = () => {
    const nxt = future.current.pop();
    if (nxt === undefined) return;
    past.current.push(text);
    setText(nxt);
    force((n) => n + 1);
  };
  const insert = (s: string) => change(text.slice(0, sel.start) + s + text.slice(sel.end));
  const paste = async () => {
    const s = await Clipboard.getStringAsync();
    if (s) insert(s);
  };
  const bold = () => {
    const mid = text.slice(sel.start, sel.end) || t('ui.bold');
    insert(`**${mid}**`);
  };
  const link = async () => {
    const s = (await Clipboard.getStringAsync()).trim();
    if (/^https?:\/\/\S+$/i.test(s)) insert(s);
    else Alert.alert(t('ui.link'), t('ui.linkTip'));
  };
  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert(t('ui.photo'), t('ui.photoDenied'));
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets?.[0]) {
      setPhoto(r.assets[0].uri);
      announce(t('ui.photoPrivate'));
    }
  };

  const submit = () => {
    const body = text.trim();
    if (mood === undefined && !body && !photo && !existing) return router.back();
    update((s) => ({
      ...s,
      journal: existing
        ? s.journal.map((j) => (j.id === existing.id ? { ...j, mood, text: body, photo } : j))
        : [...s.journal, { id: uid(), at: new Date().toISOString(), mood, text: body, prompt: q.prompt, photo }],
    }));
    announce(t('common.saved'));
    const sig = scanText(body);
    if (sig === 'none') router.back();
    else setSignal(sig);
  };

  const tools = [
    { icon: 'arrow-undo-outline', label: t('ui.undo'), on: undo, off: !past.current.length },
    { icon: 'arrow-redo-outline', label: t('ui.redo'), on: redo, off: !future.current.length },
    { icon: 'clipboard-outline', label: t('ui.paste'), on: paste },
    { icon: 'text', label: t('ui.bold'), on: bold, bold: true },
    { icon: 'link-outline', label: t('ui.link'), on: link },
    { icon: 'camera-outline', label: t('ui.photo'), on: addPhoto },
    { icon: 'mic-outline', label: t('ui.speakEntry'), on: () => router.push(existing ? { pathname: '/voice', params: { id: existing.id } } : '/voice') },
  ];
  const canSubmit = true; // nothing is mandatory: a mood alone, a few words, or nothing at all

  return (
    <Page plain top={<TopBar close />}>
      <Pressable
        onPress={() => setPicking(!picking)}
        accessibilityRole="button"
        accessibilityLabel={`${mood !== undefined ? t(`baseline.moods.${MOODS[mood].key}`) : t('baseline.feeling')}. ${pad(when.getDate())}/${pad(when.getMonth() + 1)}/${when.getFullYear()} ${weekdayLong(when, state.language)}, ${time}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <Txt style={{ fontSize: 42, lineHeight: 50 }}>{mood !== undefined ? MOODS[mood].emoji : '🙂'}</Txt>
        <View>
          <Txt bold color={c.title} style={{ fontSize: 18 }}>{`${pad(when.getDate())}/${pad(when.getMonth() + 1)}/${when.getFullYear()} - ${weekdayLong(when, state.language)}`}</Txt>
          <Txt bold color={c.title} style={{ fontSize: 14 }}>{time}</Txt>
        </View>
      </Pressable>

      {picking ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 14, padding: 8 }} accessibilityRole="radiogroup">
          {MOODS.map((m, i) => (
            <Pressable
              key={m.key}
              onPress={() => { setMood(i); setPicking(false); }}
              accessibilityRole="radio"
              accessibilityState={{ selected: mood === i }}
              accessibilityLabel={t(`baseline.moods.${m.key}`)}
              style={{ flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 4, backgroundColor: mood === i ? c.selected : 'transparent' }}
            >
              <Txt style={{ fontSize: 32, lineHeight: 40 }}>{m.emoji}</Txt>
              <Txt variant="small" color={c.body} numberOfLines={1}>{t(`baseline.moods.${m.key}`)}</Txt>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.d ? c.border : '#E3E8EC', padding: 16, minHeight: 470 }}>
        {q.prompt && !refQs.length ? <Txt bold color={c.title} style={{ marginBottom: 6 }}>{q.prompt}</Txt> : null}
        {refQs.length ? (
          <View style={{ backgroundColor: c.d ? '#22355A' : '#EEF4F8', borderRadius: 10, padding: 12, marginBottom: 10, gap: 6 }}>
            <Pressable onPress={() => setShowQs(!showQs)} accessibilityRole="button" accessibilityState={{ expanded: showQs }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 }}>
              <Ionicons name="help-circle-outline" size={20} color={c.navy} />
              <Txt bold color={c.title} style={{ flex: 1 }}>{q.prompt ? `${q.prompt}: ${t('ui.refQs')}` : t('ui.refQs')}</Txt>
              <Txt color={c.navy} style={{ fontSize: 13 }}>{showQs ? t('ui.refHide') : t('ui.refShow')}</Txt>
            </Pressable>
            {showQs ? (
              <>
                {refQs.map((x, i) => (
                  <Txt key={i} color={c.title} style={{ fontSize: 15 }}>{`${i + 1}. ${x}`}</Txt>
                ))}
                <Txt variant="small" color={c.body} style={{ fontSize: 12 }}>{t('ui.refNote')}</Txt>
              </>
            ) : null}
          </View>
        ) : null}
        <TextInput
          value={text}
          onChangeText={change}
          onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
          placeholder={refQs.length ? t('ui.freePh') : t('ui.editorPh')}
          placeholderTextColor="#8E959C"
          multiline
          accessibilityLabel={t('ui.editorPh')}
          style={{ flex: 1, minHeight: 300, fontSize: 16, color: c.title, textAlignVertical: 'top' }}
        />
        {photo ? (
          <View style={{ marginTop: 8 }}>
            <Image source={{ uri: photo }} style={{ width: '100%', height: 160, borderRadius: 8 }} resizeMode="cover" accessibilityLabel={t('ui.photo')} />
            <Pressable onPress={() => setPhoto(undefined)} accessibilityRole="button" accessibilityLabel={t('ui.removePhoto')} style={{ position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
          {tools.map((tl) => (
            <Pressable key={tl.label} onPress={tl.on} disabled={tl.off} accessibilityRole="button" accessibilityLabel={tl.label} accessibilityState={{ disabled: !!tl.off }} hitSlop={6} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: tl.off ? 0.35 : 1 }}>
              {tl.bold ? <Txt bold color={c.body} style={{ fontSize: 20 }}>B</Txt> : <Ionicons name={tl.icon as any} size={22} color={c.body} />}
            </Pressable>
          ))}
        </View>
        <Pressable onPress={submit} disabled={!canSubmit} accessibilityRole="button" accessibilityLabel={t('mood.submit')} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', opacity: canSubmit ? 1 : 0.4 }}>
          <Txt bold color={c.navy} style={{ fontSize: 18, textDecorationLine: 'underline' }}>{t('mood.submit')}</Txt>
        </Pressable>
      </View>
      <SafetyPrompt signal={signal} context="mood" onClose={() => router.back()} />
    </Page>
  );
}
