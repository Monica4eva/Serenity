// The three adaptive cards on Today: the in-app reminder, the Comeback Coach, and My plan.
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { useLogoState } from '../lib/useLogoState';
import { Txt } from './ui';
import { useDS } from './ds';
import { comebackDay, comebackNeeded } from '../lib/comeback';
import { inAppReminderDue } from '../lib/reminders';
import { startOfWeek, dayKey } from '../lib/dates';
import { weekCount, weeklyAdjustments } from '../lib/habits';
import { reminderText } from './ReminderSync';

function Row({ icon, title, body, onPress, color, onClose, closeLabel }: { icon: any; title: string; body?: string; onPress: () => void; color: string; onClose?: () => void; closeLabel?: string }) {
  const c = useDS();
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: color, flexDirection: 'row', alignItems: 'center' }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}${body ? `. ${body}` : ''}`} style={{ flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt bold color={c.title} style={{ fontSize: 15 }}>{title}</Txt>
          {body ? <Txt variant="small" color={c.body}>{body}</Txt> : null}
        </View>
        {!onClose ? <Ionicons name="chevron-forward" size={20} color={c.body} /> : null}
      </Pressable>
      {onClose ? (
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel} hitSlop={8} style={{ padding: 14 }}>
          <Ionicons name="close" size={20} color={c.body} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TodayCoach() {
  const { t, state, update } = useApp();
  const c = useDS();
  const logo = useLogoState();
  const now = new Date();
  const cb = state.comeback && !state.comeback.finishedAt ? state.comeback : undefined;
  const need = cb ? null : comebackNeeded(state, now, logo.state);
  const remind = inAppReminderDue(state, logo.state, now);
  const plan = state.habits;
  const wk = startOfWeek(now);
  const adapt = plan ? weeklyAdjustments(state, now).length : 0;

  const cards: React.ReactNode[] = [];
  if (cb) {
    const day = comebackDay(cb, now);
    cards.push(
      <Row key="cb" icon="sunny-outline" color={c.green} title={day >= 4 || cb.done.length >= 3 ? t('comeback.cardDone') : t('comeback.cardDay', { n: day })} body={t('comeback.cardBody', { n: cb.done.length })} onPress={() => router.push('/comeback')} />,
    );
  } else if (need) {
    cards.push(<Row key="cbn" icon="sunny-outline" color={c.green} title={t(`comeback.card_${need}`)} body={t('comeback.cardStart')} onPress={() => router.push(`/comeback?reason=${need}` as any)} />);
  }
  if (remind && !need) {
    const { title, body } = reminderText(t, remind, false);
    cards.push(
      <Row
        key="rm"
        icon="notifications-outline"
        color={c.navy}
        title={title}
        body={body}
        onPress={() => router.push(remind === 'comeback' ? '/comeback' : '/daily')}
        onClose={() => update((s) => ({ ...s, reminderDismissed: dayKey(now), reminderDismissals: [...(s.reminderDismissals ?? []).slice(-13), dayKey(now)] }))}
        closeLabel={t('remind.dismiss')}
      />,
    );
  }
  if (plan?.items.length) {
    const hit = plan.items.filter((it) => weekCount(state, it.id, wk, now) >= it.target).length;
    cards.push(
      <Row key="plan" icon="list-outline" color={c.navy} title={t('habits.cardTitle')} body={adapt ? t('habits.cardAdapt') : t('habits.cardBody', { n: hit, total: plan.items.length })} onPress={() => router.push('/plan')} />,
    );
  } else {
    cards.push(<Row key="plan0" icon="list-outline" color={c.navy} title={t('habits.cardStartTitle')} body={t('habits.cardStartBody')} onPress={() => router.push('/plan')} />);
  }
  return <View style={{ gap: 8 }}>{cards}</View>;
}
