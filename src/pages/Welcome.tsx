import { ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Chip, Logo, Monogram, cx } from '../components/ui';
import { PROVIDERS } from '../lib/catalog';
import { uid } from '../lib/id';
import type { Account } from '../lib/types';
import { go } from '../router';
import { useStore } from '../store';

/** providerId → one plan id per account. */
type Picks = Record<string, string[]>;

const DEMO: Picks = { chatgpt: ['plus'], claude: ['pro'], gemini: ['free'], perplexity: ['free'] };

export function Welcome() {
  const addAccounts = useStore((s) => s.addAccounts);
  const setSettings = useStore((s) => s.setSettings);
  const hasAccounts = useStore((s) => s.accounts.length > 0);
  const [picks, setPicks] = useState<Picks>({});

  const total = Object.values(picks).reduce((n, plans) => n + plans.length, 0);

  const toggle = (providerId: string, defaultPlan: string) =>
    setPicks((p) => {
      const next = { ...p };
      if (next[providerId]) delete next[providerId];
      else next[providerId] = [defaultPlan];
      return next;
    });

  const setPlan = (providerId: string, index: number, planId: string) =>
    setPicks((p) => ({ ...p, [providerId]: p[providerId].map((v, i) => (i === index ? planId : v)) }));

  const addAnother = (providerId: string) =>
    setPicks((p) => ({ ...p, [providerId]: [...p[providerId], p[providerId][p[providerId].length - 1]] }));

  const removeOne = (providerId: string, index: number) =>
    setPicks((p) => {
      const plans = p[providerId].filter((_, i) => i !== index);
      const next = { ...p, [providerId]: plans };
      if (!plans.length) delete next[providerId];
      return next;
    });

  const finish = (chosen: Picks) => {
    const now = Date.now();
    const accounts: Account[] = Object.entries(chosen).flatMap(([providerId, plans]) =>
      plans.map((planId, i) => ({
        id: uid(),
        providerId,
        planId,
        label: plans.length > 1 ? `Account ${i + 1}` : '',
        createdAt: now,
      })),
    );
    addAccounts(accounts);
    setSettings({ onboarded: true });
    go('new');
  };

  return (
    <div className="pb-24">
      <div className="mb-10 max-w-3xl">
        <Logo className="mb-6 h-14 w-14" />
        <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Pick the right AI from the ones you already pay for.
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Tell Quiver which AI subscriptions you have. For every task, it tells you which one to use, with which model, and
          how to get the best result. Nothing leaves your browser.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold">Which AIs do you use?</h2>
        <p className="text-sm text-ink-faint">Pick each one and its plan. You can change this later.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p) => {
          const plans = picks[p.id];
          const selected = !!plans;
          return (
            <Card key={p.id} className={cx('p-4 transition-colors', selected && 'border-gold ring-1 ring-gold')}>
              <button
                type="button"
                onClick={() => toggle(p.id, p.plans[0].id)}
                aria-pressed={selected}
                className="flex w-full items-start gap-3 text-left"
              >
                <Monogram text={p.monogram} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-xs text-ink-faint">{p.maker}</span>
                </span>
                <span
                  className={cx(
                    'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                    selected ? 'border-gold bg-gold text-on-gold' : 'border-line-strong',
                  )}
                >
                  {selected && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
              {!selected && <p className="mt-3 text-sm text-ink-soft">{p.blurb}</p>}
              {selected && (
                <div className="mt-3 space-y-3">
                  {plans.map((planId, i) => (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between text-xs text-ink-faint">
                        <span>{plans.length > 1 ? `Account ${i + 1} plan` : 'Your plan'}</span>
                        {plans.length > 1 && (
                          <button type="button" onClick={() => removeOne(p.id, i)} className="inline-flex items-center gap-1 hover:text-ink">
                            <Minus size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.plans.map((pl) => (
                          <Chip key={pl.id} active={pl.id === planId} onClick={() => setPlan(p.id, i, pl.id)} title={pl.price}>
                            {pl.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAnother(p.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
                  >
                    <Plus size={13} /> I have another {p.name} account
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-ink-faint">Using something else? Add it as a custom AI in My AIs after you start.</p>

      <div className="fixed inset-x-0 bottom-[64px] z-10 border-t border-line bg-bg/95 backdrop-blur md:bottom-0 md:left-[232px]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-10">
          <span className="text-sm text-ink-soft">
            {total === 0 ? 'Select the AIs you have.' : `${total} account${total > 1 ? 's' : ''} selected`}
          </span>
          <div className="flex gap-2">
            {!hasAccounts && total === 0 && (
              <Button variant="ghost" onClick={() => finish(DEMO)}>
                Try a demo setup
              </Button>
            )}
            <Button variant="gold" disabled={total === 0} onClick={() => finish(picks)}>
              {hasAccounts ? 'Add these' : 'Start using Quiver'} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
