// Today (designer's layout): greeting + bell, day card, journal card, Today's Focus (8 items),
// Need Support banner, My Progress.
import React from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../lib/useApp';
import { dayKey, daysBetween, MILESTONES, startOfWeek, timeOfDay } from '../../lib/dates';
import { focusForDay, goalProgress } from '../../lib/progress';
import { Txt } from '../../components/ui';
import { Card, Page, useDS } from '../../components/ds';
import { CelebrationArt, FadeIn, Pop } from '../../components/Motion';
import { notificationsFor } from '../../lib/notify';
import { todaysQuote, useContent } from '../../lib/content';

const FOCUS_LABEL: Record<string, string> = {
  halt: 'ui.focusHalt',
  reading: 'ui.focusReading',
  pillar: 'ui.focusPillar',
  reflection: 'ui.focusReflection',
  activity: 'ui.focusActivity',
  journal: 'ui.focusJournal',
  morning: 'ui.focusMorning',
  afternoon: 'ui.focusAfternoon',
  evening: 'ui.focusEvening',
  meetings: 'ui.focusMeetings',
};

export default function Today() {
  const { t, state, update } = useApp();
  const c = useDS();
  const name = state.profile.preferredName || state.account?.fullName?.split(' ')[0] || '';
  const days = daysBetween(state.recoveryStart) + 1; // the first day counts as Day 1
  const today = dayKey();
  const tod = timeOfDay();
  const greet = t(tod === 'morning' ? 'ui.greetMorning' : tod === 'afternoon' ? 'ui.greetAfternoon' : 'ui.greetEvening');
  const unread = notificationsFor(state, t).length;

  const wk = startOfWeek(new Date());
  const weekDays = new Set(state.journal.filter((j) => new Date(j.at) >= wk).map((j) => dayKey(new Date(j.at))));
  const words = state.journal.reduce((a, j) => a + (j.text.trim() ? j.text.trim().split(/\s+/).length : 0), 0);
  const focus = focusForDay(state, today);
  const isMilestone = MILESTONES.includes(days);
  const content = useContent();
  const quote = todaysQuote(content, state.language);
  // Messages and next sessions from the care team.
  const careNotes = state.care.links
    .filter((l) => l.status === 'active')
    .flatMap((l) => {
      const name = l.viewerName || l.label;
      const out: { key: string; icon: string; text: string; route: string }[] = [];
      const unread = state.care.messages.filter((m) => m.linkId === l.id && !m.mine && !m.read).length;
      if (unread) out.push({ key: `m${l.id}`, icon: 'chatbubble-ellipses-outline', text: t('care.today.message', { name }), route: `/care/link/${l.id}` });
      const next = state.care.plans[l.id]?.nextSession;
      if (next) out.push({ key: `s${l.id}`, icon: 'calendar-outline', text: t('care.today.session', { name, when: next }), route: `/care/link/${l.id}` });
      return out;
    })
    .slice(0, 3);

  const toggleManual = (id: string) =>
    update((s) => {
      const cur = s.focus[today] ?? [];
      return { ...s, focus: { ...s.focus, [today]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
    });

  return (
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel={`${greet} ${name}. ${t('ui.openProfile')}`} style={{ flex: 1 }}>
          <Txt bold color={c.d ? '#9FB4A9' : '#6E8E7E'} style={{ fontSize: 18 }}>
            {greet}
          </Txt>
          <Txt bold color={c.title} style={{ fontSize: 24 }}>
            {name}
          </Txt>
        </Pressable>
        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel={`${t('ui.notifications')}${unread ? ` (${unread})` : ''}`}
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#16295F', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}
        >
          <Ionicons name="notifications-outline" size={24} color={c.title} />
          {unread ? <View style={{ position: 'absolute', top: 11, right: 13, width: 9, height: 9, borderRadius: 5, backgroundColor: '#E8121F' }} /> : null}
        </Pressable>
      </View>

      <FadeIn>
        <Pressable onPress={() => router.push('/milestones')} accessibilityRole="button" accessibilityLabel={`${t('ui.dayLabel', { n: days })} ${t('ui.inRecovery')}. ${t('ui.keepGoing')}`}>
          <LinearGradient
            colors={c.d ? ['#1F3550', '#24304A'] : ['#C9E6EE', '#F3F6FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', minHeight: 96 }}
          >
            <View style={{ flex: 1 }}>
              <Txt bold color={c.green} style={{ fontSize: 30, lineHeight: 36 }}>
                {t('ui.dayLabel', { n: days })}
              </Txt>
              <Txt color={c.title} style={{ fontSize: 15 }}>
                {t('ui.inRecovery')}
              </Txt>
              <Txt bold color={c.green} style={{ fontSize: 12 }}>
                {t('ui.keepGoing')}
              </Txt>
            </View>
            <CelebrationArt />
          </LinearGradient>
        </Pressable>
      </FadeIn>

      {careNotes.length ? (
        <FadeIn delay={20}>
          <View style={{ gap: 8 }}>
            {careNotes.map((n) => (
              <Pressable key={n.key} onPress={() => router.push(n.route as any)} accessibilityRole="button" accessibilityLabel={n.text} style={{ backgroundColor: c.card, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: c.navy }}>
                <Ionicons name={n.icon as any} size={22} color={c.navy} />
                <Txt bold color={c.title} style={{ flex: 1, fontSize: 15 }}>{n.text}</Txt>
                <Ionicons name="chevron-forward" size={20} color={c.body} />
              </Pressable>
            ))}
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={40}>
        <View style={{ backgroundColor: c.card, borderRadius: 14, padding: 14, gap: 6, borderLeftWidth: 4, borderLeftColor: c.green }} accessible accessibilityLabel={`${t('act.quoteTitle')}. ${quote}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="sunny-outline" size={18} color={c.green} />
            <Txt bold color={c.green} style={{ flex: 1, fontSize: 13 }}>{t('act.quoteTitle')}</Txt>
            <Pressable onPress={() => Share.share({ message: quote })} accessibilityRole="button" accessibilityLabel={t('act.share')} hitSlop={8}>
              <Ionicons name="share-social-outline" size={18} color={c.body} />
            </Pressable>
          </View>
          <Txt color={c.title} style={{ fontSize: 16.5, lineHeight: 23, fontStyle: 'italic' }}>{`“${quote}”`}</Txt>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Pressable
          onPress={() => router.push('/journal')}
          accessibilityRole="button"
          accessibilityLabel={`${t('ui.journalCard', { entries: state.journal.length, words })}. ${t('today.journalWeek', { n: weekDays.size })}`}
          style={{ backgroundColor: c.d ? '#2B3F73' : c.navy, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ flex: 1, gap: 8 }}>
            <Txt bold color="#FFFFFF" style={{ fontSize: 19 }}>
              {t('ui.journalCard', { entries: state.journal.length, words: words.toLocaleString('en') })}
            </Txt>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)', width: '88%' }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', width: `${(weekDays.size / 7) * 100}%` }} />
            </View>
            <Txt variant="small" color="#FFFFFF">
              {t('today.journalWeek', { n: weekDays.size })}
            </Txt>
          </View>
          <MaterialCommunityIcons name="note-plus-outline" size={40} color="#FFFFFF" />
        </Pressable>
      </FadeIn>

      <FadeIn delay={160}>
        <View style={{ gap: 8 }}>
          <Txt bold color={c.title} style={{ fontSize: 19 }}>
            {t('today.focus')}
          </Txt>
          <Card style={{ paddingVertical: 4, gap: 0 }}>
            {focus.map((f, i) => {
              const label = f.id === 'halt' ? 'H A L T' : t(FOCUS_LABEL[f.id]);
              const manual = f.id === 'reading' || f.id === 'pillar' || f.id === 'reflection';
              return (
                <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, borderTopWidth: i ? 1 : 0, borderTopColor: c.d ? c.border : '#EEF1F3' }}>
                  <Pressable
                    onPress={() => (manual ? toggleManual(f.id) : router.push(f.route as any))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: f.done }}
                    accessibilityLabel={t(FOCUS_LABEL[f.id])}
                    hitSlop={6}
                    style={{ width: 40, height: 44, justifyContent: 'center' }}
                  >
                    <Pop active={f.done}>
                      <Ionicons name={f.done ? 'checkbox' : 'square-outline'} size={22} color={f.done ? c.green : c.body} />
                    </Pop>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(f.route as any)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(FOCUS_LABEL[f.id])}. ${f.done ? t('today.done') : t('today.notDone')}`}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 }}
                  >
                    <Txt color={c.title} style={{ flex: 1, fontSize: 15, textDecorationLine: f.done ? 'line-through' : 'none' }}>
                      {label}
                    </Txt>
                    <Ionicons name="chevron-forward" size={18} color={c.body} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      </FadeIn>

      <FadeIn delay={240}>
        <View style={{ backgroundColor: c.d ? '#1D3328' : '#EAF5EC', borderRadius: 14, borderWidth: 1, borderColor: c.d ? '#2E5A40' : '#CFE6D5', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MaterialCommunityIcons name="face-agent" size={36} color={c.green} />
          <View style={{ flex: 1 }}>
            <Txt bold color={c.title} style={{ fontSize: 16 }}>
              {t('today.needSupport')}
            </Txt>
            <Txt variant="small" color={c.body} style={{ fontSize: 12 }}>
              {t('ui.needSupportBody')}
            </Txt>
          </View>
          <Pressable
            onPress={() => router.push('/help')}
            accessibilityRole="button"
            accessibilityLabel={t('today.getSupport')}
            style={{ backgroundColor: c.greenBtn, borderRadius: 999, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' }}
          >
            <Txt bold color="#FFFFFF" style={{ fontSize: 13 }}>
              {t('today.getSupport')}
            </Txt>
          </Pressable>
        </View>
      </FadeIn>

      <View style={{ gap: 8 }}>
        <Txt bold color={c.title} style={{ fontSize: 19 }}>
          {t('today.progress')}
        </Txt>
        {(state.goals.length ? state.goals : [{ id: 'substanceFree', progress: 0 }]).map((g) => {
          const p = goalProgress(state, g.id);
          return (
            <Card key={g.id} label={`${t('ui.recoveryGoal')}. ${t(`goals.${g.id}`)}. ${p}%`} onPress={() => (state.goals.length ? router.push('/(tabs)/insight') : router.push('/onboarding/goals'))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="bullseye-arrow" size={36} color={c.green} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Txt bold color={c.title} style={{ flex: 1, fontSize: 16 }}>
                      {t('ui.recoveryGoal')}
                    </Txt>
                    <Txt bold color={c.green}>
                      {p}%
                    </Txt>
                  </View>
                  <Txt variant="small" color={c.body}>
                    {t(`goals.${g.id}`)}
                  </Txt>
                  <View style={{ height: 7, borderRadius: 4, backgroundColor: c.d ? '#22304A' : '#DCEFE2', marginTop: 6 }}>
                    <View style={{ height: 7, borderRadius: 4, backgroundColor: c.green, width: `${p}%` }} />
                  </View>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </Page>
  );
}
