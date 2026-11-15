// Journal (designer's layout): date header, week strip with circles, entry cards,
// "Write about it" pill, dashed "Add more notes", floating + and microphone buttons.
import React, { useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../lib/useApp';
import { addDays, dateNames, dayKey, dayMonthLong, startOfWeek, weekdayShort } from '../lib/dates';
import { Txt } from '../components/ui';
import { Page, TopBar, useDS } from '../components/ds';
import { moodIcon } from '../components/MoodRow';
import { VoicePlayer } from '../components/Voice';

const fmt12 = (d: Date) => {
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

export default function Journal() {
  const { t, state } = useApp();
  const c = useDS();
  const names = dateNames(state.language);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [selected, setSelected] = useState(dayKey());
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [ideas, setIdeas] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = (k: string) => state.journal.filter((j) => dayKey(new Date(j.at)) === k);
  const entries = byDay(selected).sort((a, b) => a.at.localeCompare(b.at));
  const selDate = days.find((d) => dayKey(d) === selected) ?? new Date(selected + 'T12:00:00');
  const isToday = selected === dayKey();

  const fab = (icon: string, label: string, onPress: () => void, bottom: number) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ position: 'absolute', right: 20, bottom, width: 52, height: 52, borderRadius: 26, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#16295F', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}
    >
      <Ionicons name={icon as any} size={28} color={c.title} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <Page plain top={<TopBar close />}>
        <View style={{ alignItems: 'center' }} accessible accessibilityRole="header">
          <Txt bold color={c.title} style={{ fontSize: 19 }}>{`${String(selDate.getDate()).padStart(2, '0')} ${names.months[selDate.getMonth()]}`}</Txt>
          <Txt bold color={c.title} style={{ fontSize: 15 }}>{selDate.getFullYear()}</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => setWeekStart(addDays(weekStart, -7))} accessibilityRole="button" accessibilityLabel={t('common.prevWeek')} style={{ width: 28, height: 60, justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={c.title} />
          </Pressable>
          {days.map((d) => {
            const k = dayKey(d);
            const list = byDay(k);
            const mood = [...list].reverse().find((j) => j.mood !== undefined)?.mood;
            const sel = k === selected;
            return (
              <Pressable
                key={k}
                onPress={() => setSelected(k)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={t('common.dayEntries', { date: dayMonthLong(d, state.language), n: list.length })}
                style={{ flex: 1, alignItems: 'center', gap: 4 }}
              >
                <Txt bold color={c.title} style={{ fontSize: 12 }}>{weekdayShort(d, state.language)}</Txt>
                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? c.navy : c.card, shadowColor: '#16295F', shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 }}>
                  {list.length ? (
                    <MaterialCommunityIcons name={moodIcon(mood) as any} size={22} color={sel ? '#FFFFFF' : c.navy} />
                  ) : (
                    <Ionicons name="add" size={18} color={sel ? '#FFFFFF' : c.navy} />
                  )}
                </View>
                <Txt bold color={c.title} style={{ fontSize: 12 }}>{d.getDate()}</Txt>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setWeekStart(addDays(weekStart, 7))} accessibilityRole="button" accessibilityLabel={t('common.nextWeek')} style={{ width: 28, height: 60, justifyContent: 'center', alignItems: 'flex-end' }}>
            <Ionicons name="chevron-forward" size={22} color={c.title} />
          </Pressable>
        </View>

        {state.journalLocked > 0 ? (
          <Pressable onPress={() => router.push('/settings?section=privacy')} accessibilityRole="button">
            <Txt variant="small" color={c.body}>{t('journal.locked', { n: state.journalLocked })}</Txt>
          </Pressable>
        ) : null}

        {entries.map((j) => {
          const isOpen = open[j.id];
          if (!j.text && j.audio)
            return (
              <View key={j.id} style={{ backgroundColor: c.d ? '#22355A' : '#DCEBF4', borderRadius: 12, borderWidth: 1, borderColor: c.d ? c.border : '#C7DCEA', padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name={moodIcon(j.mood) as any} size={28} color={c.title} />
                  <Txt bold color={c.title} style={{ flex: 1, fontSize: 16 }}>{fmt12(new Date(j.at))}</Txt>
                  <Ionicons name="mic" size={18} color={c.navy} />
                </View>
                <VoicePlayer uri={j.audio} secs={j.audioSecs} />
                <Pressable onPress={() => router.push({ pathname: '/mood', params: { id: j.id } })} accessibilityRole="button" style={{ alignSelf: 'flex-end', minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Txt bold color={c.title} style={{ fontSize: 13 }}>{t('journal.writeAbout')}</Txt>
                  <Ionicons name="chevron-forward" size={18} color={c.title} />
                </Pressable>
              </View>
            );
          if (!j.text)
            return (
              <Pressable key={j.id} onPress={() => router.push({ pathname: '/mood', params: { id: j.id } })} accessibilityRole="button" accessibilityLabel={`${fmt12(new Date(j.at))}. ${t('journal.writeAbout')}`}>
                <LinearGradient colors={c.d ? ['#22355A', '#1B2740'] : ['#BFDCEB', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 30, paddingHorizontal: 16, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialCommunityIcons name={moodIcon(j.mood) as any} size={30} color={c.title} />
                  <Txt bold color={c.title} style={{ flex: 1, fontSize: 16 }}>{fmt12(new Date(j.at))}</Txt>
                  <Txt color={c.title} style={{ fontSize: 13 }}>{t('journal.writeAbout')}</Txt>
                  <Ionicons name="chevron-forward" size={20} color={c.title} />
                </LinearGradient>
              </Pressable>
            );
          return (
            <View key={j.id} style={{ backgroundColor: c.d ? '#22355A' : '#DCEBF4', borderRadius: 12, borderWidth: 1, borderColor: c.d ? c.border : '#C7DCEA', padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name={moodIcon(j.mood) as any} size={30} color={c.title} />
                <Txt bold color={c.title} style={{ flex: 1, fontSize: 17 }}>{fmt12(new Date(j.at))}</Txt>
                <Pressable onPress={() => router.push({ pathname: '/care/share', params: { id: j.id } })} accessibilityRole="button" accessibilityLabel={t('care.share.button')} hitSlop={8} style={{ marginRight: 6 }}>
                  <Ionicons name={(state.care.shared[j.id] ?? []).length ? 'people' : 'people-outline'} size={21} color={(state.care.shared[j.id] ?? []).length ? c.green : c.body} />
                </Pressable>
                <Pressable onPress={() => Share.share({ message: j.text })} accessibilityRole="button" accessibilityLabel={t('journal.share')} hitSlop={8}>
                  <Ionicons name="share-outline" size={20} color={c.body} />
                </Pressable>
              </View>
              {j.prompt ? <Txt variant="small" bold color={c.body}>{j.prompt}</Txt> : null}
              {j.audio ? <VoicePlayer uri={j.audio} secs={j.audioSecs} /> : null}
              <Txt color={c.title} numberOfLines={isOpen ? undefined : 2} style={{ fontSize: 15 }}>{j.text}</Txt>
              <Pressable onPress={() => setOpen({ ...open, [j.id]: !isOpen })} accessibilityRole="button" style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}>
                <Txt bold color={c.title} style={{ fontSize: 13 }}>{isOpen ? t('journal.seeLess') : t('journal.seeMore')}</Txt>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-forward'} size={18} color={c.title} />
              </Pressable>
            </View>
          );
        })}

        {isToday || entries.length ? (
          <Pressable
            onPress={() => router.push('/mood')}
            accessibilityRole="button"
            accessibilityLabel={t('journal.addMore')}
            style={{ minHeight: 56, borderRadius: 28, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.d ? '#5A6F99' : '#B7C9D8', backgroundColor: c.d ? 'transparent' : '#EEF4F8', alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={20} color={c.navy} />
            </View>
            <Txt color={c.title} style={{ fontSize: 16 }}>{t('journal.addMore')}</Txt>
          </Pressable>
        ) : (
          <Txt center color={c.body}>{t('journal.empty')}</Txt>
        )}

        <Pressable onPress={() => setIdeas(!ideas)} accessibilityRole="button" accessibilityState={{ expanded: ideas }} style={{ marginTop: 6, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="bulb-outline" size={18} color={c.navy} />
          <Txt color={c.navy} style={{ flex: 1 }}>{ideas ? t('journal.hideIdeas') : t('journal.ideas')}</Txt>
          <Ionicons name={ideas ? 'chevron-up' : 'chevron-down'} size={18} color={c.navy} />
        </Pressable>
        {(ideas ? ['p1', 'p2', 'p3', 'p4'] : []).map((p) => (
          <Pressable key={p} onPress={() => router.push({ pathname: '/mood', params: { prompt: t(`journal.${p}`) } })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: c.d ? c.border : '#E3E8EC' }}>
            <Txt color={c.navy}>{t(`journal.${p}`)}</Txt>
          </Pressable>
        ))}
        <View style={{ height: 120 }} />
      </Page>
      {fab('add', t('ui.newEntry'), () => router.push('/mood'), 92)}
      {fab('mic-outline', t('ui.speakEntry'), () => router.push('/voice'), 28)}
    </View>
  );
}
