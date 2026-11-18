// Puts the adaptive reminder on the phone as a local notification (works offline, no server).
// On the web there are no phone notifications, so the Today screen shows the reminder instead.
import { Platform } from 'react-native';
import type { ReminderPlan } from './reminders';

const TAG = 'serenity-reminder';

export async function scheduleReminder(plan: ReminderPlan, title: string, body: string): Promise<'scheduled' | 'off' | 'unsupported' | 'denied'> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const N = await import('expo-notifications');
    // Clear our earlier reminders (never the care-team alerts).
    const all = await N.getAllScheduledNotificationsAsync();
    await Promise.all(all.filter((n) => n.content.data?.tag === TAG).map((n) => N.cancelScheduledNotificationAsync(n.identifier)));
    if (!plan.on) return 'off';
    const perm = await N.getPermissionsAsync();
    const granted = perm.granted || (await N.requestPermissionsAsync()).granted;
    if (!granted) return 'denied';
    const content = { title, body, data: { tag: TAG, route: plan.kind === 'comeback' ? '/comeback' : '/daily' } };
    if (plan.everyOtherDay) {
      // Every other day for the next two weeks; refreshed whenever the app is opened.
      const now = new Date();
      for (let i = 1; i <= 14; i += 2) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        d.setHours(plan.hour, plan.minute, 0, 0);
        await N.scheduleNotificationAsync({ content, trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: d } });
      }
    } else {
      await N.scheduleNotificationAsync({ content, trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: plan.hour, minute: plan.minute } });
    }
    return 'scheduled';
  } catch {
    return 'unsupported';
  }
}
