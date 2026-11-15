// Serenity Admin: sign in, second step (authenticator app), then the dashboard.
import React, { useEffect, useState } from 'react';
import { adminStatus, DEMO, hasSession, mfaEnroll, mfaFactor, mfaVerify, myRole, openedFromReset, sb, sendReset, setNewPassword, signIn, signOut, waitForResetSession, type AdminRole } from './api';
import { Button, ErrorNote } from './ui';
import ErrorBoundary from './ErrorBoundary';
import Overview from './pages/Overview';
import Counsellors from './pages/Counsellors';
import Content from './pages/Content';
import Helplines from './pages/Helplines';
import { ActivityLog, Admins } from './pages/Team';

type Stage = 'loading' | 'signin' | 'mfa' | 'notadmin' | 'in' | 'reset';
type Page = 'overview' | 'content' | 'counsellors' | 'helplines' | 'admins' | 'log';

const PAGES: { key: Page; label: string; roles: AdminRole[] }[] = [
  { key: 'overview', label: 'Impact overview', roles: ['admin', 'clinician', 'editor'] },
  { key: 'content', label: 'App content', roles: ['admin', 'clinician', 'editor'] },
  { key: 'counsellors', label: 'Counsellors', roles: ['admin', 'clinician'] },
  { key: 'helplines', label: 'Emergency numbers', roles: ['admin', 'clinician', 'editor'] },
  { key: 'admins', label: 'Admin team', roles: ['admin'] },
  { key: 'log', label: 'Activity log', roles: ['admin'] },
];

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const [role, setRole] = useState<AdminRole | null>(null);
  const [page, setPage] = useState<Page>(() => (location.hash.slice(1) as Page) || 'overview');

  const check = async () => {
    if (!DEMO && openedFromReset()) return setStage('reset');
    if (DEMO) {
      setRole('admin');
      return setStage('in');
    }
    if (!(await hasSession())) return setStage('signin');
    try {
      const s = await adminStatus();
      if (s === 'none') return setStage('notadmin');
      if (s === 'needs_mfa') return setStage('mfa');
      setRole(await myRole());
      setStage('in');
    } catch {
      setStage('signin');
    }
  };
  useEffect(() => {
    check();
    const sub = sb?.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') setStage('signin');
      if (e === 'PASSWORD_RECOVERY') setStage('reset');
    });
    return () => sub?.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    location.hash = page;
  }, [page]);

  if (stage === 'loading') return <div className="center"><p className="loading">Loading…</p></div>;
  if (stage === 'signin') return <SignIn onDone={check} />;
  if (stage === 'reset') return <ResetPassword onDone={check} />;
  if (stage === 'mfa') return <Mfa onDone={check} />;
  if (stage === 'notadmin')
    return (
      <Shell>
        <h2>This account is not an admin</h2>
        <p className="sub">Ask a Serenity admin to add you under "Admin team". Counsellors and app users sign in through the Serenity app, not here.</p>
        <Button onClick={() => signOut().then(check)}>Sign out</Button>
      </Shell>
    );

  const allowed = PAGES.filter((p) => role && p.roles.includes(role));
  const current = allowed.some((p) => p.key === page) ? page : 'overview';
  return (
    <div className="layout">
      <aside className="side">
        <div className="brand">
          <img src="./logo.png" alt="" />
          <div>
            <strong>Serenity</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav>
          {allowed.map((p) => (
            <button key={p.key} className={`nav ${current === p.key ? 'on' : ''}`} onClick={() => setPage(p.key)} aria-current={current === p.key ? 'page' : undefined}>
              {p.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="role">Signed in as <strong>{role}</strong></div>
          {!DEMO ? <button className="link" onClick={() => signOut().then(check)}>Sign out</button> : null}
        </div>
      </aside>
      <main className="main">
        {DEMO ? (
          <div className="demo">Sample data. This dashboard is not connected to Supabase yet: add the keys to <code>admin/.env</code> (see ADMIN_SETUP.md).</div>
        ) : null}
        <ErrorBoundary key={current}>
        {current === 'overview' ? <Overview /> : null}
        {current === 'content' && role ? <Content role={role} /> : null}
        {current === 'counsellors' && role ? <Counsellors role={role} /> : null}
        {current === 'helplines' && role ? <Helplines role={role} /> : null}
        {current === 'admins' && role ? <Admins role={role} /> : null}
        {current === 'log' && role ? <ActivityLog role={role} /> : null}
        </ErrorBoundary>
        <footer className="privacy">Admins never see journals, check-ins, messages, notes or anyone's personal details. Totals for groups under 10 people are hidden.</footer>
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="center">
      <div className="auth">
        <div className="brand big">
          <img src="./logo.png" alt="" />
          <div>
            <strong>Serenity</strong>
            <span>Admin</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <Shell>
      <h2>Sign in</h2>
      <p className="sub">Use the email and password of your Serenity account.</p>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr('');
          try {
            await signIn(email, pw);
            onDone();
          } catch (e2) {
            setErr(/invalid/i.test((e2 as Error).message) ? 'Wrong email or password.' : (e2 as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>Email<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <ErrorNote error={err} />
        {sent ? <div className="ok">If an account exists for {email}, we have sent a link to reset the password. Open it on this computer.</div> : null}
        <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <button
        className="link"
        onClick={async () => {
          setErr('');
          if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Type your email above first, then tap "Forgot your password?".');
          try {
            await sendReset(email);
            setSent(true);
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        }}
      >
        Forgot your password?
      </button>
    </Shell>
  );
}

function Mfa({ onDone }: { onDone: () => void }) {
  const [factor, setFactor] = useState<{ id: string } | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    mfaFactor()
      .then(async (f) => {
        if (f) setFactor(f);
        else setEnroll(await mfaEnroll());
      })
      .catch((e) => setErr(e.message))
      .finally(() => setReady(true));
  }, []);
  const id = factor?.id ?? enroll?.id;
  return (
    <Shell>
      <h2>Second step</h2>
      {!ready ? <p className="loading">Loading…</p> : null}
      {enroll ? (
        <>
          <p className="sub">Admins must use an authenticator app. Install Google Authenticator, Microsoft Authenticator or Authy on your phone, tap "Add", and scan this code.</p>
          <img className="qr" src={enroll.qr} alt="QR code to scan with your authenticator app" />
          <p className="note">Can't scan? Type this key into the app: <code>{enroll.secret}</code></p>
        </>
      ) : factor ? (
        <p className="sub">Open your authenticator app and type the 6-digit code for Serenity.</p>
      ) : null}
      {id ? (
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            try {
              await mfaVerify(id, code);
              onDone();
            } catch {
              setErr('That code did not work. Codes change every 30 seconds; try the newest one.');
            }
          }}
        >
          <label>6-digit code<input inputMode="numeric" autoComplete="one-time-code" maxLength={7} required value={code} onChange={(e) => setCode(e.target.value)} /></label>
          <ErrorNote error={err} />
          <Button type="submit">Continue</Button>
        </form>
      ) : (
        <ErrorNote error={err} />
      )}
      <button className="link" onClick={() => signOut().then(onDone)}>Sign out</button>
    </Shell>
  );
}

function ResetPassword({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    waitForResetSession().then(setReady);
  }, []);
  return (
    <Shell>
      <h2>Set a new password</h2>
      {ready === null ? <p className="loading">Opening your link…</p> : null}
      {ready === false ? (
        <>
          <p className="sub">This link has expired or was already used. Go back to Sign in, type your email and tap "Forgot your password?" again. Open the new link on this computer.</p>
          <Button onClick={() => { history.replaceState(null, '', location.pathname); onDone(); }}>Back to Sign in</Button>
        </>
      ) : null}
      {ready ? (
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            if (pw.length < 10 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw)) return setErr('Use at least 10 characters, with letters and at least one number.');
            if (pw !== pw2) return setErr('The two passwords do not match.');
            setBusy(true);
            try {
              await setNewPassword(pw);
              onDone();
            } catch (e2) {
              setErr((e2 as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="sub">This also changes your password in the Serenity app.</p>
          <label>New password<input type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label>Type it again<input type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          <ErrorNote error={err} />
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</Button>
        </form>
      ) : null}
    </Shell>
  );
}
