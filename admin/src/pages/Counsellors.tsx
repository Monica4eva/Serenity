// Check counsellors and therapists. Verified ones show a tick to clients; suspended ones lose
// access to every client straight away (enforced by the database).
import React, { useEffect, useState } from 'react';
import { listProfessionals, reviewProfessional, type AdminRole, type Professional, type ReviewStatus } from '../api';
import { Badge, Button, Card, Empty, ErrorNote, fmtDate } from '../ui';

const TABS: { key: ReviewStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Waiting' },
  { key: 'verified', label: 'Verified' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];
const TONE: Record<ReviewStatus, 'orange' | 'green' | 'red' | 'grey'> = { pending: 'orange', verified: 'green', suspended: 'red', rejected: 'grey' };
const NAME: Record<ReviewStatus, string> = { pending: 'Waiting', verified: 'Verified', suspended: 'Suspended', rejected: 'Rejected' };

export default function Counsellors({ role }: { role: AdminRole }) {
  const [list, setList] = useState<Professional[] | null>(null);
  const [tab, setTab] = useState<ReviewStatus | 'all'>('pending');
  const [err, setErr] = useState('');
  const [acting, setActing] = useState<{ id: string; status: ReviewStatus } | null>(null);
  const [note, setNote] = useState('');
  const load = () => listProfessionals().then(setList).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  if (role === 'editor') return <div className="page"><h1>Counsellors</h1><Empty>Only admins and clinicians can check counsellors.</Empty></div>;
  if (err) return <ErrorNote error={err} />;
  if (!list) return <p className="loading">Loading…</p>;

  const shown = list.filter((p) => tab === 'all' || p.review_status === tab);
  const count = (k: ReviewStatus) => list.filter((p) => p.review_status === k).length;

  const confirm = async () => {
    if (!acting) return;
    try {
      await reviewProfessional(acting.id, acting.status, note.trim());
      setActing(null);
      setNote('');
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Counsellors and therapists</h1>
          <p className="sub">Check each person's registration (for example with the Botswana Health Professions Council) before verifying. Clients see verified counsellors with a tick.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key !== 'all' && count(t.key) ? <span className="count">{count(t.key)}</span> : null}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <Empty>Nobody here.</Empty> : null}
      <div className="stack">
        {shown.map((p) => (
          <Card key={p.user_id}>
            <div className="pro">
              <div className="pro-main">
                <div className="pro-name">
                  <strong>{p.display_name || '(no name)'}</strong>
                  <Badge tone={TONE[p.review_status]}>{NAME[p.review_status]}</Badge>
                </div>
                <dl className="facts">
                  <dt>Profession</dt><dd>{p.profession || '–'}</dd>
                  <dt>Registration</dt><dd>{p.registration || <span className="warn">Not given</span>}</dd>
                  <dt>Organisation</dt><dd>{p.organisation || '–'}</dd>
                  <dt>Email</dt><dd>{p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : '–'}</dd>
                  <dt>Signed up</dt><dd>{fmtDate(p.created_at)}</dd>
                  <dt>Active clients</dt><dd>{p.active_clients}</dd>
                </dl>
                {p.review_note ? <p className="note">Note: {p.review_note} {p.reviewed_at ? `(${fmtDate(p.reviewed_at)})` : ''}</p> : null}
              </div>
              <div className="pro-actions">
                {p.review_status !== 'verified' ? <Button kind="green" small onClick={() => setActing({ id: p.user_id, status: 'verified' })}>Verify</Button> : null}
                {p.review_status === 'pending' ? <Button kind="outline" small onClick={() => setActing({ id: p.user_id, status: 'rejected' })}>Reject</Button> : null}
                {p.review_status === 'verified' ? <Button kind="danger" small onClick={() => setActing({ id: p.user_id, status: 'suspended' })}>Suspend</Button> : null}
              </div>
            </div>
            {acting?.id === p.user_id ? (
              <div className="confirm">
                <label>
                  {acting.status === 'verified' ? 'How did you check them? (kept in the log)' : acting.status === 'suspended' ? 'Reason for suspending (kept in the log). They lose access to all clients straight away.' : 'Reason (kept in the log)'}
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder={acting.status === 'verified' ? 'For example: BHPC register checked on 15 Nov' : ''} />
                </label>
                <div className="row">
                  <Button kind={acting.status === 'verified' ? 'green' : acting.status === 'suspended' ? 'danger' : 'primary'} onClick={confirm} disabled={acting.status !== 'verified' && !note.trim()}>
                    Confirm: {NAME[acting.status]}
                  </Button>
                  <Button kind="ghost" onClick={() => setActing(null)}>Cancel</Button>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
