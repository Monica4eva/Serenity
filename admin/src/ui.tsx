// Small shared pieces: cards, stat tiles, charts, buttons, labels.
import React from 'react';

export const C = {
  navy: '#4E649D',
  navyDark: '#33467A',
  green: '#0C6434',
  red: '#C62828',
  orange: '#E07B16',
  pink: '#D9457F',
  ink: '#0A2A1F',
  body: '#4F5B57',
  muted: '#8A94A6',
  line: '#E3E8EC',
  bg: '#F4F7FA',
};

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
export const daysSince = (iso?: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);

/** A value that was hidden because the group was too small. */
export const Hidden = () => (
  <span className="hidden-val" title="Hidden: fewer than 10 people in this group">
    –
  </span>
);
export const val = (v: number | null | undefined, suffix = '') => (v === null || v === undefined ? <Hidden /> : `${v}${suffix}`);

export function Card({ title, sub, children, right }: { title?: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="card">
      {title ? (
        <header className="card-head">
          <div>
            <h3>{title}</h3>
            {sub ? <p className="sub">{sub}</p> : null}
          </div>
          {right}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: 'green' | 'navy' | 'orange' | 'red' }) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

export function Button({ children, onClick, kind = 'primary', disabled, type = 'button', small }: { children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'green' | 'danger' | 'ghost' | 'outline'; disabled?: boolean; type?: 'button' | 'submit'; small?: boolean }) {
  return (
    <button type={type} className={`btn ${kind} ${small ? 'small' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: 'green' | 'orange' | 'red' | 'grey' | 'navy' | 'pink' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

/** Horizontal bar with a percentage. */
export function PctBar({ label, pct, note }: { label: string; pct: number | null; note?: string }) {
  return (
    <div className="pctbar">
      <div className="pctbar-top">
        <span>{label}</span>
        <strong>{pct === null ? <Hidden /> : `${pct}%`}</strong>
      </div>
      <div className="pctbar-track">
        <div className="pctbar-fill" style={{ width: `${pct ?? 0}%` }} />
      </div>
      {note ? <div className="stat-hint">{note}</div> : null}
    </div>
  );
}

/** Simple line chart (SVG). Gaps where a value is hidden. */
export function LineChart({ points, color = C.navy, min, max, fmt, label }: { points: { x: string; y: number | null }[]; color?: string; min?: number; max?: number; fmt?: (v: number) => string; label: string }) {
  const W = 560, H = 170, P = { l: 36, r: 24, t: 12, b: 26 };
  const ys = points.map((p) => p.y).filter((v): v is number => v !== null);
  const lo = min ?? (ys.length ? Math.min(...ys) * 0.9 : 0);
  const hi = max ?? (ys.length ? Math.max(...ys) * 1.1 : 1);
  const sx = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, points.length - 1);
  const sy = (v: number) => P.t + (1 - (v - lo) / (hi - lo || 1)) * (H - P.t - P.b);
  const segs: string[] = [];
  let cur = '';
  points.forEach((p, i) => {
    if (p.y === null) {
      if (cur) segs.push(cur);
      cur = '';
      return;
    }
    cur += `${cur ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`;
  });
  if (cur) segs.push(cur);
  const ticks = [lo, (lo + hi) / 2, hi];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`${label}: ${points.map((p) => `${p.x} ${p.y ?? 'hidden'}`).join(', ')}`}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke={C.line} />
          <text x={P.l - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill={C.muted}>
            {fmt ? fmt(t) : Math.round(t)}
          </text>
        </g>
      ))}
      {segs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {points.map((p, i) =>
        p.y === null ? null : (
          <circle key={i} cx={sx(i)} cy={sy(p.y)} r={3.5} fill="#fff" stroke={color} strokeWidth={2}>
            <title>{`${p.x}: ${fmt ? fmt(p.y) : p.y}`}</title>
          </circle>
        ),
      )}
      {points.map((p, i) =>
        i % 2 === points.length % 2 ? null : (
          <text key={`x${i}`} x={sx(i)} y={H - 6} textAnchor="middle" fontSize="10.5" fill={C.muted}>
            {new Date(p.x).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </text>
        ),
      )}
    </svg>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function ErrorNote({ error }: { error: string }) {
  return error ? <div className="error" role="alert">{error}</div> : null;
}
