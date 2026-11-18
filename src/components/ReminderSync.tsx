// Keeps the phone's adaptive reminder in step with the person's data: re-planned whenever the
// time, tone or frequency would change. On the web it does nothing (Today shows the reminder).
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useApp } from '../lib/useApp';
import { useLogoState } from '../lib/useLogoState';
import { reminderPlan } from '../lib/reminders';
import { scheduleReminder } from '../lib/reminderSchedule';

export function reminderText(t: (k: string, v?: any) => string, kind: string, discreet: boolean) {
  if (discreet) return { title: t('remind.discreetTitle'), body: t('remind.discreetBody') };
  return { title: t(`remind.${kind}.title`), body: t(`remind.${kind}.body`) };
}

export default function ReminderSync() {
  const { t, state } = useApp();
  const logo = useLogoState();
  const plan = useMemo(() => reminderPlan(state, logo.state), [state, logo.state]);
  const key = `${plan.on}|${plan.hour}|${plan.minute}|${plan.kind}|${plan.everyOtherDay}|${state.language}|${state.settings.discreet}`;
  useEffect(() => {
    if (Platform.OS === 'web' || !state.onboarded) return;
    const { title, body } = reminderText(t, plan.kind, state.settings.discreet);
    scheduleReminder(plan, title, body);
  }, [key, state.onboarded]);
  return null;
}
