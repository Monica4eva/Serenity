import { useMemo } from 'react';
import { useStore } from './store';
import { LOGO_RULES, logoState } from './engine';
import { collectSignals, missedTaskDays } from './progress';

/** Live state of the escalation button (centre Serenity logo). */
export function useLogoState() {
  const { state } = useStore();
  return useMemo(() => {
    if (!state.onboarded) return { state: 'normal' as const, reasons: [], points: 0, missed: 0 };
    const levels = state.checkins.filter((c) => c.level).map((c) => ({ level: c.level!, at: c.at }));
    // "I'm alright now" (after the safety questions) clears every sign up to that moment.
    const allClear = [...state.dismissals].reverse().find((d) => d.context === 'logo:allclear' || d.context === 'logo');
    const missed = missedTaskDays(state, LOGO_RULES.minTasksPerDay, new Date(), allClear?.at);
    const res = logoState({
      levels,
      missedTaskDays: missed,
      signals: collectSignals(state),
      relapses: state.relapses,
      allClearAt: allClear?.at,
    });
    return { ...res, missed };
  }, [state]);
}
