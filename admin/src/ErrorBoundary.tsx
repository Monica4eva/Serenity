// If any page hits an unexpected problem, show a short message instead of a blank screen.
import React from 'react';

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e?.message || 'Unknown error' };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="error" role="alert">
          <strong>Something went wrong on this page.</strong>
          <div style={{ marginTop: 6 }}>Please reload. If it keeps happening, send a screenshot of this message: {this.state.error}</div>
        </div>
        <button className="btn primary" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}
