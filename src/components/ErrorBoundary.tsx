import { Component, type ReactNode } from 'react';

/** Shows a way out instead of a blank page if something breaks. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-ink-soft">Your data is still saved in this browser. Reloading usually fixes it.</p>
        <p className="mt-2 font-mono text-xs text-ink-faint">{this.state.error.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 h-10 rounded-xl bg-gold px-5 text-sm font-medium text-on-gold"
        >
          Reload
        </button>
      </div>
    );
  }
}
