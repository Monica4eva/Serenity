// What a linked counsellor or supporter is allowed to see.
// Pure functions (no React, no network) so they can be tested with `npm test`.
//
// Privacy rule: the member's phone builds one summary PER LINK, containing only what that
// link has permission to see. The server never holds more than that for the viewer.

export type CareRole = 'professional' | 'supporter';
export type AppRole = 'member' | CareRole;

export type Permissions = {
  alerts?: boolean; // button colour (professional) or "needs help now" (supporter)
  trends?: boolean; // 14-day mood, craving and sleep trends, goals (professional)
  journal?: boolean; // can read journal entries the person chooses to share
  status?: boolean; // simple status: doing okay / could use support
  milestones?: boolean; // days in recovery and milestones
  messages?: boolean; // can send messages
};

export const PERMISSION_KEYS: (keyof Permissions)[] = ['alerts', 'trends', 'journal', 'status', 'milestones', 'messages'];

/** Sensible starting choices. The person can change every one of them. */
export function defaultPermissions(role: CareRole): Permissions {
  return role === 'professional'
    ? { alerts: true, trends: true, journal: true, status: true, milestones: true, messages: true }
    : { alerts: true, trends: false, journal: false, status: true, milestones: true, messages: true };
}

/** Which permissions make sense for each role (supporters never get trends or journal). */
export function allowedPermissions(role: CareRole): (keyof Permissions)[] {
  return role === 'professional' ? PERMISSION_KEYS : ['alerts', 'status', 'milestones', 'messages'];
}

export function cleanPermissions(role: CareRole, p: Permissions): Permissions {
  const out: Permissions = {};
  for (const k of allowedPermissions(role)) out[k] = !!p[k];
  return out;
}

export type LogoColour = 'normal' | 'orange' | 'pink' | 'red';
export type SimpleStatus = 'okay' | 'support' | 'help';

export type TrendDay = { day: string; mood?: number; craving?: number; sleep?: number; score?: number | null; checkedIn: boolean };

/** Everything the phone knows, already worked out. buildSummary picks what each link may see. */
export type Snapshot = {
  name: string;
  days: number;
  logo: LogoColour;
  reasons: string[];
  trends: TrendDay[];
  goals: { id: string; progress: number }[];
  relapses: { at: string }[];
  lastCheckinAt?: string;
  nextAppointment?: string;
  now?: string;
};

export type Summary = {
  v: 1;
  role: CareRole;
  name: string;
  updatedAt: string;
  status?: SimpleStatus;
  logo?: LogoColour;
  reasons?: string[];
  days?: number;
  milestonesReached?: number[];
  nextMilestone?: number;
  trends?: TrendDay[];
  goals?: { id: string; progress: number }[];
  relapses30?: number;
  lastCheckinAt?: string;
  nextAppointment?: string;
};

export const CARE_MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365];

/**
 * Simple status for supporters.
 *  - "help" (needs help now) only when the logo is red AND the alerts permission is on.
 *  - Otherwise orange, pink or red show as "could use support".
 */
export function simpleStatus(logo: LogoColour, p: Permissions): SimpleStatus | undefined {
  if (logo === 'red' && p.alerts) return 'help';
  if (!p.status && !p.alerts) return undefined;
  if (logo === 'normal') return p.status ? 'okay' : undefined;
  return 'support';
}

export function buildSummary(role: CareRole, perms: Permissions, s: Snapshot): Summary {
  const p = cleanPermissions(role, perms);
  const out: Summary = { v: 1, role, name: s.name, updatedAt: s.now ?? new Date().toISOString() };
  const st = simpleStatus(s.logo, p);
  if (st) out.status = st;
  if (p.milestones) {
    out.days = s.days;
    out.milestonesReached = CARE_MILESTONES.filter((m) => m <= s.days);
    out.nextMilestone = CARE_MILESTONES.find((m) => m > s.days);
  }
  if (role === 'professional') {
    if (p.alerts) {
      out.logo = s.logo;
      out.reasons = s.reasons.slice(0, 8);
    }
    if (p.trends) {
      out.trends = s.trends.slice(-14);
      out.goals = s.goals.map((g) => ({ id: g.id, progress: Math.round(g.progress) }));
      const now = new Date(s.now ?? Date.now()).getTime();
      out.relapses30 = s.relapses.filter((r) => now - new Date(r.at).getTime() <= 30 * 86400000).length;
      out.lastCheckinAt = s.lastCheckinAt;
      out.nextAppointment = s.nextAppointment;
    }
  }
  return out;
}

/** Who should get a phone alert when the button changes colour. */
export function alertAudience(prev: LogoColour, next: LogoColour): { professional: boolean; supporter: boolean } {
  const rank: Record<LogoColour, number> = { normal: 0, orange: 1, pink: 2, red: 3 };
  if (rank[next] <= rank[prev]) return { professional: false, supporter: false };
  return { professional: next === 'pink' || next === 'red', supporter: next === 'red' };
}

/** Order clients for a counsellor: red first, then pink, orange, normal; then most recent update. */
export function severityRank(s: Pick<Summary, 'logo' | 'status' | 'updatedAt'>): number {
  const byLogo: Record<string, number> = { red: 0, pink: 1, orange: 2, normal: 3 };
  if (s.logo) return byLogo[s.logo];
  return s.status === 'help' ? 0 : s.status === 'support' ? 2 : 3;
}

export function sortBySeverity<T extends { summary?: Summary | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = a.summary ? severityRank(a.summary) : 4;
    const rb = b.summary ? severityRank(b.summary) : 4;
    if (ra !== rb) return ra - rb;
    return (b.summary?.updatedAt ?? '').localeCompare(a.summary?.updatedAt ?? '');
  });
}

/** Invite codes: 10 characters, no look-alike letters. Spaces and dashes are ignored. */
export function normaliseCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function isCodeShaped(input: string): boolean {
  return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/.test(normaliseCode(input));
}
export function formatCode(code: string): string {
  const c = normaliseCode(code);
  return c.length === 10 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}
