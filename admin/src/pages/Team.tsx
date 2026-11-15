// Admin team (who can use this dashboard) and the activity log.
import React, { useEffect, useState } from 'react';
import { addAdmin, listActions, listAdmins, removeAdmin, type ActionRow, type AdminRole, type AdminRow } from '../api';
import { Badge, Button, Card, Empty, ErrorNote, fmtDate, fmtDateTime } from '../ui';

const ROLE_INFO: Record<AdminRole, string> = {
  admin: 'Everything, including adding admins and reading the activity log',
  clinician: 'Edit app content, check counsellors, edit emergency numbers, see totals',
  editor: 'Edit app content (recipes, activities, quotes and more) and see totals',
};

export function Admins({ role }: { role: AdminRole }) {
  const [list, setList] = useState<AdminRow[] | null>(null);
  const [f, setF] = useState({ email: '', name: '', role: 'clinician' as AdminRole });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => listAdmins().then(setList).catch((e) => setErr(e.message));
  useEffect(() => {
    if (role === 'admin') load();
  }, [role]);
  if (role !== 'admin') return <div className="page"><h1>Admin team</h1><Empty>Only full admins can manage the admin team.</Empty></div>;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await addAdmin(f.email, f.role, f.name);
      setMsg(`${f.email} can now sign in to this dashboard. They will be asked to set up an authenticator app the first time.`);
      setF({ email: '', name: '', role: 'clinician' });
      load();
    } catch (e2) {
      setErr((e2 as Error).message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Admin team</h1>
          <p className="sub">People who can sign in here. Everyone needs an authenticator app on their phone as a second step.</p>
        </div>
      </div>
      <Card title="Add someone" sub="They must first create an account in the Serenity app with the same email.">
        <form className="form inline" onSubmit={add}>
          <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>
            Role
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as AdminRole })}>
              <option value="clinician">Clinician</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button type="submit">Add</Button>
        </form>
        <p className="note">{ROLE_INFO[f.role]}</p>
        <ErrorNote error={err} />
        {msg ? <div className="ok">{msg}</div> : null}
      </Card>
      <Card title="Current admins">
        {!list ? <p className="loading">Loading…</p> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.user_id}>
                  <td>{a.display_name || '–'}</td>
                  <td>{a.email}</td>
                  <td><Badge tone={a.role === 'admin' ? 'navy' : a.role === 'clinician' ? 'green' : 'grey'}>{a.role}</Badge></td>
                  <td>{fmtDate(a.created_at)}</td>
                  <td className="num">
                    <Button kind="ghost" small onClick={() => window.confirm(`Remove ${a.email} from the admin team?`) && removeAdmin(a.user_id).then(load).catch((e) => setErr(e.message))}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

const ACTION_TEXT: Record<string, string> = {
  professional_verified: 'Verified a counsellor',
  professional_rejected: 'Rejected a counsellor',
  professional_suspended: 'Suspended a counsellor',
  professional_pending: 'Moved a counsellor back to waiting',
  content_published: 'Published app content',
  content_draft: 'Saved a content draft',
  content_hidden: 'Hid app content',
  content_restored: 'Restored original content',
  emergency_number_insert: 'Added an emergency number',
  emergency_number_update: 'Changed an emergency number',
  emergency_number_delete: 'Deleted an emergency number',
  admin_added: 'Added an admin',
  admin_removed: 'Removed an admin',
};

export function ActivityLog({ role }: { role: AdminRole }) {
  const [rows, setRows] = useState<ActionRow[] | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (role !== 'admin') return;
    listActions().then(setRows).catch((e) => setErr(e.message));
    listAdmins().then(setAdmins).catch(() => {});
  }, [role]);
  if (role !== 'admin') return <div className="page"><h1>Activity log</h1><Empty>Only full admins can read the activity log.</Empty></div>;
  const who = (id: string | null) => admins.find((a) => a.user_id === id)?.display_name || admins.find((a) => a.user_id === id)?.email || 'An admin';
  const detail = (r: ActionRow) => {
    const d = r.detail ?? {};
    if (typeof d.title === 'string') return `${r.target?.split(':')[0] ?? ''}: ${d.title}`;
    if (typeof d.label === 'string') return `${d.label}${d.number ? ` (${d.number})` : ''}`;
    if (typeof d.note === 'string' && d.note) return `Note: ${d.note}`;
    if (typeof d.role === 'string') return `Role: ${d.role}`;
    return '';
  };
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Activity log</h1>
          <p className="sub">Every admin action is recorded here and cannot be deleted.</p>
        </div>
      </div>
      <ErrorNote error={err} />
      <Card>
        {!rows ? <p className="loading">Loading…</p> : rows.length === 0 ? <Empty>No actions yet.</Empty> : (
          <table className="table">
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{fmtDateTime(r.at)}</td>
                  <td>{who(r.admin_id)}</td>
                  <td>{ACTION_TEXT[r.action] ?? r.action}</td>
                  <td>{detail(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
