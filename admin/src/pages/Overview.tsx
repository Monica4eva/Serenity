// Impact dashboard: anonymous totals only. Groups under 10 people are hidden (shown as –).
import React, { useEffect, useState } from 'react';
import { getImpact, type Impact } from '../api';
import { C, Card, ErrorNote, LineChart, PctBar, Stat, fmtDateTime, val } from '../ui';

const SAFETY_LABELS: Record<string, string> = {
  logo_orange_opened: 'Opened support while button was orange',
  logo_pink_opened: 'Opened support while button was pink',
  logo_red_opened: 'Opened support while button was red',
  logo_normal_opened: 'Opened support while button was blue',
  logo_all_clear: '"I\'m alright now" confirmed',
  emergency_opened: 'Opened the "I\'m not safe" screen',
  disclosure: 'Said they may be at risk (safety question)',
  help_call_counsellor: 'Tapped call counsellor',
  companion_risk: 'Serenity Guide detected risk words',
  companion_handoff: 'Serenity Guide handed over to a person',
  companion_lowmood: 'Serenity Guide noticed low mood',
  companion_craving: 'Serenity Guide noticed cravings',
};
const LANG: Record<string, string> = { en: 'English', tn: 'Setswana' };

export default function Overview() {
  const [d, setD] = useState<Impact | null>(null);
  const [err, setErr] = useState('');
  const load = () => getImpact().then(setD).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);
  if (err) return <ErrorNote error={err} />;
  if (!d) return <p className="loading">Loading…</p>;
  const ret = (n: number) => d.retention.find((r) => r.days === n);
  const safety = Object.entries(d.safety_30d).sort((a, b) => b[1] - a[1]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Impact overview</h1>
          <p className="sub">
            Anonymous totals for people using Serenity for their own recovery. Updated {fmtDateTime(d.generated_at)}. Groups under {d.min_group} people show as –.
          </p>
        </div>
        <button className="btn ghost" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="stats">
        <Stat label="People in recovery" value={d.members} hint={`${d.new_30d} joined in the last 30 days`} tone="navy" />
        <Stat label="Active this week" value={d.active_7d} hint="Did at least one check-in, journal or activity" tone="green" />
        <Stat label="Active this month" value={d.active_30d} hint={d.members ? `${Math.round((100 * d.active_30d) / d.members)}% of everyone` : undefined} />
        <Stat label="Back within 7 days of a slip" value={val(d.slips.back_within_7d_pct, '%')} hint={d.slips.median_days_back !== null ? `Usually back after ${d.slips.median_days_back} days` : 'Last 6 months'} tone="orange" />
      </div>

      <div className="grid2">
        <Card title="Still using Serenity" sub="Of people who joined at least this long ago, how many were still active after it.">
          <div className="stack">
            <PctBar label="After 7 days" pct={ret(7)?.pct ?? null} note={ret(7)?.cohort ? `${ret(7)?.cohort} people` : undefined} />
            <PctBar label="After 30 days" pct={ret(30)?.pct ?? null} note={ret(30)?.cohort ? `${ret(30)?.cohort} people` : undefined} />
            <PctBar label="After 90 days" pct={ret(90)?.pct ?? null} note={ret(90)?.cohort ? `${ret(90)?.cohort} people` : undefined} />
          </div>
        </Card>
        <Card title="Recovery after a slip" sub="Slips logged in the last 6 months (excluding the last 7 days).">
          <div className="stack">
            <div className="kv"><span>Slips logged</span><strong>{val(d.slips.count)}</strong></div>
            <PctBar label="Came back to the app within 7 days" pct={d.slips.back_within_7d_pct} />
            <div className="kv"><span>Typical time to come back</span><strong>{d.slips.median_days_back === null ? val(null) : `${d.slips.median_days_back} days`}</strong></div>
            <p className="note">Serenity never resets progress to zero after a slip. Coming back quickly is the outcome that matters.</p>
          </div>
        </Card>
      </div>

      <div className="grid2">
        <Card title="Active people per week" sub="Last 12 weeks">
          <LineChart label="Active people per week" points={d.weekly.map((w) => ({ x: w.week, y: w.active }))} color={C.navy} min={0} />
        </Card>
        <Card title="Average mood" sub="From journal entries, 1 (stressed) to 5 (great)">
          <LineChart label="Average mood" points={d.weekly.map((w) => ({ x: w.week, y: w.mood === null ? null : w.mood + 1 }))} color={C.green} min={1} max={5} fmt={(v) => v.toFixed(1)} />
        </Card>
        <Card title="Average sleep" sub="Hours per night, from the sleep log">
          <LineChart label="Average sleep" points={d.weekly.map((w) => ({ x: w.week, y: w.sleep }))} color="#8E6BC9" min={4} max={9} fmt={(v) => v.toFixed(1)} />
        </Card>
        <Card title="Check-ins per week" sub="HALT, daily, balance, rhythm and meeting check-ins">
          <LineChart label="Check-ins per week" points={d.weekly.map((w) => ({ x: w.week, y: w.checkins }))} color={C.orange} min={0} />
        </Card>
      </div>

      <div className="grid2">
        <Card title="Fair benefit by language" sub="Does Serenity work as well in Setswana as in English?">
          <table className="table">
            <thead>
              <tr><th>Language</th><th>People</th><th>Still active after 30 days</th></tr>
            </thead>
            <tbody>
              {d.by_language.map((l) => (
                <tr key={l.language}>
                  <td>{LANG[l.language] ?? l.language}</td>
                  <td>{val(l.members)}</td>
                  <td>{val(l.retention30, '%')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Care team" sub="Connections between people in recovery and their supporters">
          <div className="stack">
            <div className="kv"><span>People connected to a counsellor</span><strong>{d.care.professional_links}</strong></div>
            <div className="kv"><span>Family and friend connections</span><strong>{d.care.supporter_links}</strong></div>
            <div className="kv"><span>Verified counsellors</span><strong>{d.care.verified_professionals}</strong></div>
            <div className="kv"><span>Counsellors waiting to be checked</span><strong className={d.care.pending_professionals ? 'warn' : ''}>{d.care.pending_professionals}</strong></div>
          </div>
        </Card>
      </div>

      <Card title="Safety signals, last 30 days" sub="How often the escalation button and safety tools were used. Totals only: no names, no messages.">
        {safety.length === 0 ? (
          <p className="empty">No safety events in the last 30 days.</p>
        ) : (
          <>
            <table className="table">
              <tbody>
                {safety.map(([k, n]) => (
                  <tr key={k}>
                    <td>{SAFETY_LABELS[k] ?? k}</td>
                    <td className="num">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">Counts are events, not people. The same person can appear more than once.</p>
          </>
        )}
      </Card>
    </div>
  );
}
