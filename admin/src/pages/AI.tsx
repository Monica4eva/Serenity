// AI oversight: the human control over Serenity's AI agent (the Session Assistant for counsellors).
// Admins and clinicians can switch it off instantly; everyone on the team can see how it is used.
// Only counts are stored: never prompts, answers, names or who asked.
import React, { useEffect, useState } from 'react';
import { getAiOverview, setAiEnabled, type AdminRole, type AiOverview } from '../api';
import { Badge, Button, Card, ErrorNote, LineChart, Stat, fmtDateTime } from '../ui';

const OUTCOMES: Record<string, string> = {
  ok: 'Draft made',
  model_unavailable: 'AI did not answer or answer failed checks',
  rate: 'Blocked by the hourly limit',
  forbidden: 'Refused: not this client\'s counsellor, or suspended',
  not_enough_data: 'Not enough shared data yet',
  disabled: 'Refused: assistant switched off',
  signed_out: 'Refused: not signed in',
  bad_request: 'Refused: malformed request',
};

const SAFEGUARDS = [
  ['Data minimisation', 'The AI only receives numbers (mood, cravings, sleep, wellbeing score) and fixed warning-sign codes. Never names, journals, messages or any free text.'],
  ['Human in the loop', 'Every answer is labelled "AI draft: check before use". Only the counsellor sees it, and nothing reaches the client unless the counsellor edits and saves it.'],
  ['Fixed safety wording', 'If a client is on red or shows crisis signs, a fixed safety line written by the Serenity team is added. The AI never writes crisis guidance.'],
  ['Output checks', 'Answers are cut to the expected sections and lengths. Anything about doses, prescriptions or diagnosis is removed.'],
  ['Access control', 'Only an active counsellor linked to that client can ask. Suspended counsellors are refused. Limit of 20 drafts an hour per counsellor.'],
  ['People-facing chat stays rule-based', 'The Serenity Guide chat that people in recovery use is pre-written and clinically reviewed, not AI.'],
  ['This switch', 'Admins and clinicians can turn the assistant off for everyone at once. Every change is written to the activity log.'],
];

export default function AiOversight({ role }: { role: AdminRole }) {
  const [d, setD] = useState<AiOverview | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const canSwitch = role === 'admin' || role === 'clinician';

  const load = () => getAiOverview().then(setD).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  const flip = async () => {
    if (!d) return;
    const next = !d.enabled;
    const msg = next
      ? 'Switch the Session Assistant back on for all counsellors?'
      : 'Switch the Session Assistant off for all counsellors now? They will see "paused by the Serenity team". Everything else in the app keeps working.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    setErr('');
    try {
      await setAiEnabled(next);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!d) return err ? <ErrorNote error={err} /> : <p className="loading">Loading…</p>;
  const failed = Object.entries(d.outcomes_30d).filter(([k]) => k !== 'ok').reduce((n, [, v]) => n + v, 0);
  const total = d.ok_30d + failed;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>AI oversight</h1>
          <p className="sub">Serenity Session Assistant: an AI agent that drafts session preparation for counsellors. This page is the human control over it.</p>
        </div>
      </div>
      <ErrorNote error={err} />

      <Card
        title="Assistant status"
        sub={d.changed_at ? `Last changed ${fmtDateTime(d.changed_at)}.` : 'Not changed since setup.'}
        right={<div>{d.enabled ? <Badge tone="green">On</Badge> : <Badge tone="red">Off</Badge>}</div>}
      >
        <p>{d.enabled ? 'Counsellors can ask for session drafts.' : 'Switched off. Counsellors see "paused by the Serenity team". No data is sent to the AI.'}</p>
        {canSwitch ? (
          <Button kind={d.enabled ? 'danger' : 'green'} onClick={flip} disabled={busy}>
            {d.enabled ? 'Switch the assistant off' : 'Switch the assistant on'}
          </Button>
        ) : (
          <p className="sub">Only admins and clinicians can switch it on or off.</p>
        )}
      </Card>

      <div className="stats">
        <Stat label="Drafts, last 7 days" value={d.ok_7d} tone="navy" />
        <Stat label="Drafts, last 30 days" value={d.ok_30d} hint={`${d.real_30d} by counsellors, ${d.demo_30d} in the demo`} />
        <Stat label="Not completed, 30 days" value={failed} hint={total ? `${Math.round((failed / total) * 100)}% of requests` : undefined} tone={failed ? 'orange' : undefined} />
        <Stat label="Average time" value={d.avg_ms_30d ? `${(d.avg_ms_30d / 1000).toFixed(1)} s` : 'n/a'} hint={d.models_30d.length ? `Model: ${d.models_30d.join(', ')}` : undefined} />
      </div>

      <Card title="Drafts per day" sub="Last 14 days. Counts only.">
        <LineChart label="Drafts per day" points={d.daily_14d.map((x) => ({ x: x.day.slice(5), y: x.ok }))} min={0} fmt={(v) => String(Math.round(v))} />
      </Card>

      <Card title="What happened to requests" sub="Last 30 days">
        <table className="table">
          <tbody>
            {Object.keys(OUTCOMES)
              .filter((k) => d.outcomes_30d[k])
              .map((k) => (
                <tr key={k}>
                  <td>{OUTCOMES[k]}</td>
                  <td style={{ textAlign: 'right' }}>{d.outcomes_30d[k]}</td>
                </tr>
              ))}
            {!total ? (
              <tr>
                <td colSpan={2}>No requests yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <Card title="How the AI is controlled">
        <ul className="safeguards">
          {SAFEGUARDS.map(([t, body]) => (
            <li key={t}>
              <strong>{t}.</strong> {body}
            </li>
          ))}
        </ul>
      </Card>

      <p className="sub">What is stored for each request: the date, whether it came from the demo, the outcome, the AI model, the language and how long it took. Nothing that could identify a counsellor or client.</p>
    </div>
  );
}
