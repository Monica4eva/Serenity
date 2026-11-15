// Emergency numbers and helplines shown in the app (English and Setswana).
// Changes appear in the app the next time it is opened. Every change is logged.
import React, { useEffect, useState } from 'react';
import { deleteNumber, listNumbers, markChecked, saveNumber, type AdminRole, type EmergencyNumber } from '../api';
import { Badge, Button, Card, Empty, ErrorNote, daysSince, fmtDate } from '../ui';

const blank = (order: number): EmergencyNumber => ({ id: '', label: '', label_tn: '', number: '', verified: false, sort_order: order, active: true, checked_at: null });

export default function Helplines({ role }: { role: AdminRole }) {
  const [list, setList] = useState<EmergencyNumber[] | null>(null);
  const [edit, setEdit] = useState<{ n: EmergencyNumber; isNew: boolean } | null>(null);
  const [err, setErr] = useState('');
  const canEdit = role === 'admin' || role === 'clinician';
  const load = () => listNumbers().then(setList).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);
  if (!list) return err ? <ErrorNote error={err} /> : <p className="loading">Loading…</p>;

  const run = async (fn: () => Promise<void>) => {
    setErr('');
    try {
      await fn();
      setEdit(null);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const stale = (n: EmergencyNumber) => {
    const d = daysSince(n.checked_at);
    return d === null || d > 90;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Emergency numbers and helplines</h1>
          <p className="sub">These show on the help and crisis screens in the app. Check each number by calling it at least every 3 months.</p>
        </div>
        {canEdit ? <Button onClick={() => setEdit({ n: blank((list.at(-1)?.sort_order ?? 0) + 1), isNew: true })}>Add a number</Button> : null}
      </div>
      <ErrorNote error={err} />
      {!canEdit ? <Empty>You can view these. Only admins and clinicians can change them.</Empty> : null}

      {edit ? (
        <Card title={edit.isNew ? 'New number' : `Edit: ${edit.n.label}`}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              const n = { ...edit.n, id: edit.isNew ? edit.n.id || edit.n.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) : edit.n.id };
              run(() => saveNumber(n, edit.isNew));
            }}
          >
            <label>Name in English<input required value={edit.n.label} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, label: e.target.value } })} /></label>
            <label>Name in Setswana<input value={edit.n.label_tn ?? ''} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, label_tn: e.target.value } })} placeholder="Needed so the Setswana app shows no English" /></label>
            <label>Number<input required value={edit.n.number} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, number: e.target.value } })} inputMode="tel" /></label>
            <label>Order on screen<input type="number" value={edit.n.sort_order} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, sort_order: Number(e.target.value) } })} /></label>
            <label className="check"><input type="checkbox" checked={edit.n.active} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, active: e.target.checked } })} /> Show in the app</label>
            <div className="row">
              <Button type="submit" kind="green">Save</Button>
              <Button kind="ghost" onClick={() => setEdit(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="stack">
        {list.map((n) => (
          <Card key={n.id}>
            <div className="numrow">
              <div className="num-big">{n.number}</div>
              <div className="num-main">
                <strong>{n.label}</strong>
                <div className="sub">{n.label_tn || <span className="warn">No Setswana name yet</span>}</div>
                <div className="badges">
                  {!n.active ? <Badge tone="grey">Hidden in app</Badge> : null}
                  {n.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="orange">Not verified</Badge>}
                  {stale(n) ? <Badge tone="red">{n.checked_at ? `Last checked ${fmtDate(n.checked_at)}, due again` : 'Never checked'}</Badge> : <Badge tone="navy">Checked {fmtDate(n.checked_at)}</Badge>}
                </div>
              </div>
              {canEdit ? (
                <div className="pro-actions">
                  <Button kind="green" small onClick={() => run(() => markChecked(n))}>I called it, it works</Button>
                  <Button kind="outline" small onClick={() => setEdit({ n: { ...n }, isNew: false })}>Edit</Button>
                  {role === 'admin' ? (
                    <Button kind="ghost" small onClick={() => window.confirm(`Delete ${n.label}? Consider hiding it instead.`) && run(() => deleteNumber(n.id))}>Delete</Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
