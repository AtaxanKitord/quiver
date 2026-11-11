import { CodeXml, Layers, Library, ListTodo, Settings, Sparkles, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { go, type Route } from '../router';
import { useStore } from '../store';
import { Logo, cx } from './ui';

export const REPO_URL = 'https://github.com/AtaxanKitord/quiver';

const NAV: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'new', label: 'New task', icon: Sparkles },
  { route: 'tasks', label: 'Tasks', icon: ListTodo },
  { route: 'ais', label: 'My AIs', icon: Layers },
  { route: 'catalog', label: 'Catalog', icon: Library },
  { route: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const active = useStore((s) => s.tasks.filter((t) => t.status === 'sent').length);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-4 py-6 md:flex">
        <a href="#/" className="mb-8 flex items-center gap-2.5 px-2" aria-label="Quiver home">
          <Logo className="h-9 w-9" />
          <span className="font-display text-2xl font-semibold tracking-tight">Quiver</span>
        </a>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map(({ route: r, label, icon: Icon }) => (
            <a
              key={r}
              href={`#/${r === 'new' ? '' : r}`}
              aria-current={route === r ? 'page' : undefined}
              className={cx(
                'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                route === r ? 'bg-surface text-ink shadow-card' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              )}
            >
              {route === r && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-gold" />}
              <Icon size={18} />
              {label}
              {r === 'tasks' && active > 0 && (
                <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-on-gold">{active}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="mt-auto px-2 text-xs text-ink-faint">
          <p className="mb-2 leading-relaxed">Your data stays in this browser.</p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
            <CodeXml size={14} /> Source on GitHub
          </a>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <button type="button" onClick={() => go('new')} className="flex items-center gap-2" aria-label="Quiver home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-semibold">Quiver</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pt-10 md:pb-16">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV.map(({ route: r, label, icon: Icon }) => (
          <a
            key={r}
            href={`#/${r === 'new' ? '' : r}`}
            aria-current={route === r ? 'page' : undefined}
            className={cx(
              'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
              route === r ? 'text-ink' : 'text-ink-faint',
            )}
          >
            {route === r && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gold" />}
            <Icon size={20} />
            {label}
            {r === 'tasks' && active > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] h-2 w-2 rounded-full bg-gold" aria-label={`${active} in progress`} />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}
