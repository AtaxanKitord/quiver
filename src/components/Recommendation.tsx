import { AlertTriangle, Check, ChevronDown, Clock, Copy, ExternalLink, Lightbulb, Plus } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_BY_ID } from '../lib/categories';
import { accountName, accountUrl, getOffering, getPlan, getProvider, monogram, planName } from '../lib/catalog';
import { primaryCategory } from '../lib/analyzer';
import { buildTips } from '../lib/prompt';
import { suggestNew } from '../lib/recommender';
import { untilText } from '../lib/time';
import type { Account, Analysis, Recommendation, ScoredOption } from '../lib/types';
import { go } from '../router';
import { useStore } from '../store';
import { Button, Card, MatchMeter, Monogram, cx } from './ui';

export function useOption(option: ScoredOption | undefined) {
  const accounts = useStore((s) => s.accounts);
  if (!option) return undefined;
  const account = accounts.find((a) => a.id === option.accountId);
  if (!account) return undefined;
  const offering = getOffering(account, option.offeringId);
  return { account, offering };
}

export function OptionTitle({ account, small }: { account: Account; small?: boolean }) {
  return (
    <span className={cx('text-ink-soft', small ? 'text-xs' : 'text-sm')}>
      {accountName(account)} · {planName(account)}
      {account.label && <span className="text-ink-faint"> · {account.label}</span>}
    </span>
  );
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function RecommendationView({
  rec,
  analysis,
  prompt,
  onPromptChange,
  chosenKey,
  onChoose,
  onSend,
  onSave,
  aiTips,
}: {
  rec: Recommendation;
  analysis: Analysis;
  prompt: string;
  onPromptChange: (p: string) => void;
  chosenKey?: string;
  onChoose: (key: string) => void;
  onSend: (option: ScoredOption) => void;
  onSave: () => void;
  aiTips?: string[];
}) {
  const accounts = useStore((s) => s.accounts);
  const updateAccount = useStore((s) => s.updateAccount);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const chosen = rec.ranked.find((o) => o.key === chosenKey) ?? rec.top;
  const resolved = useOption(chosen);
  const category = CATEGORY_BY_ID[primaryCategory(analysis)];

  const unavailable = rec.unavailable.length > 0 && (
    <div className="mt-4 space-y-2">
      {rec.unavailable.map((u) => {
        const account = accounts.find((a) => a.id === u.accountId);
        if (!account) return null;
        return (
          <div key={u.accountId} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm">
            <Clock size={15} className="text-ink-faint" />
            <span className="text-ink-soft">
              Skipped <span className="font-medium text-ink">{accountName(account)} · {planName(account)}</span>
              {account.label && ` (${account.label})`}: limit resets {untilText(u.until)}.
            </span>
            <button
              type="button"
              className="ml-auto text-xs font-medium text-ink underline decoration-gold underline-offset-4"
              onClick={() => updateAccount(account.id, { limitedUntil: undefined })}
            >
              It’s available again
            </button>
          </div>
        );
      })}
    </div>
  );

  if (!chosen || !resolved) {
    const suggestions = suggestNew(analysis, accounts);
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-ink-faint" size={20} />
          <div>
            <h3 className="font-display text-xl font-semibold">None of your AIs can do this right now</h3>
            <p className="mt-1 text-ink-soft">
              {rec.unavailable.length
                ? 'The ones that could are waiting for their limits to reset.'
                : `None of your plans includes a tool for ${category.skill}.`}
            </p>
          </div>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium">Good options to add:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map((s) => {
                const provider = getProvider(s.providerId)!;
                const plan = getPlan(s.providerId, s.planId)!;
                const offering = provider.offerings.find((o) => o.id === s.offeringId)!;
                return (
                  <div key={s.providerId} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <Monogram text={provider.monogram} size="sm" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{offering.name}</p>
                      <p className="text-ink-faint">
                        {provider.name} {plan.name} · {plan.price}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => go('ais')}>
              <Plus size={14} /> Add an AI
            </Button>
          </div>
        )}
        {unavailable}
      </Card>
    );
  }

  const { account, offering } = resolved;
  const tips = [...new Set([...(aiTips ?? []), ...buildTips(analysis, offering)])].slice(0, 6);
  const url = accountUrl(account);
  const alternatives = rec.alternatives.filter((a) => a.key !== chosen.key);
  if (chosen.key !== rec.top?.key && rec.top) alternatives.unshift(rec.top);

  const send = () => {
    // Start the copy before opening the tab: the page must still have focus for the clipboard,
    // and some browsers block pop-ups that open after an await.
    void copy(prompt);
    if (url) window.open(url, '_blank', 'noopener');
    onSend(chosen);
  };

  return (
    <div>
      <Card className="overflow-hidden">
        <div className="border-b border-line bg-gold-soft px-5 py-2 text-xs font-semibold tracking-wider text-ink uppercase">
          {chosen.key === rec.top?.key ? 'Best match' : 'Your choice'}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Monogram text={monogram(account)} size="lg" />
              <div>
                <OptionTitle account={account} />
                <h3 className="font-display text-2xl leading-tight font-semibold sm:text-3xl">{offering?.name}</h3>
                {offering && <p className="mt-1 text-sm text-ink-soft">{offering.summary}</p>}
              </div>
            </div>
            <MatchMeter value={chosen.match} />
          </div>

          <ul className="mt-5 space-y-1.5">
            {chosen.reasons.map((r) => (
              <li key={r} className="flex gap-2 text-sm">
                <Check size={16} className="mt-0.5 shrink-0 text-brand dark:text-gold" /> {r}
              </li>
            ))}
            {chosen.warnings.map((w) => (
              <li key={w} className="flex gap-2 text-sm text-ink-soft">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold" /> {w}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-line bg-surface-2/60 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Lightbulb size={16} className="text-gold" /> How to get the best result
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft marker:text-gold">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="prompt" className="text-sm font-semibold">
                Your prompt
              </label>
              {prompt.includes('[') && <span className="text-xs text-ink-faint">Fill in or delete the [brackets] first.</span>}
            </div>
            <textarea
              id="prompt"
              dir="auto"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={Math.min(14, prompt.split('\n').length + 2)}
              className="w-full resize-y rounded-xl border border-line-strong bg-surface px-3 py-2.5 font-mono text-[13px] leading-relaxed text-ink focus:border-gold focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="gold" size="lg" onClick={send}>
              {url ? (
                <>
                  Copy prompt & open {accountName(account)} <ExternalLink size={16} />
                </>
              ) : (
                <>
                  Copy prompt & mark as sent <Copy size={16} />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={async () => {
                setCopied(await copy(prompt));
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy only'}
            </Button>
            <Button variant="quiet" size="lg" onClick={onSave}>
              Save for later
            </Button>
          </div>
        </div>
      </Card>

      {alternatives.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-ink-soft uppercase">Also good</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {alternatives.slice(0, 2).map((o) => (
              <AlternativeCard key={o.key} option={o} onChoose={() => onChoose(o.key)} />
            ))}
          </div>
        </div>
      )}

      {rec.ranked.length > 3 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
            aria-expanded={showAll}
          >
            <ChevronDown size={16} className={cx('transition-transform', showAll && 'rotate-180')} />
            {showAll ? 'Hide' : 'Show'} all {rec.ranked.length} options
          </button>
          {showAll && (
            <Card className="mt-3 divide-y divide-line">
              {rec.ranked.map((o) => (
                <OptionRow key={o.key} option={o} active={o.key === chosen.key} onChoose={() => onChoose(o.key)} />
              ))}
            </Card>
          )}
        </div>
      )}

      {unavailable}
    </div>
  );
}

function AlternativeCard({ option, onChoose }: { option: ScoredOption; onChoose: () => void }) {
  const r = useOption(option);
  if (!r) return null;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <Monogram text={monogram(r.account)} size="sm" />
        <div className="min-w-0 flex-1">
          <OptionTitle account={r.account} small />
          <p className="font-semibold">{r.offering?.name}</p>
        </div>
        <MatchMeter value={option.match} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">{option.reasons[0]}</p>
      <Button variant="ghost" size="sm" className="mt-3 self-start" onClick={onChoose}>
        Use this instead
      </Button>
    </Card>
  );
}

function OptionRow({ option, active, onChoose }: { option: ScoredOption; active: boolean; onChoose: () => void }) {
  const r = useOption(option);
  if (!r) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Monogram text={monogram(r.account)} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{r.offering?.name}</p>
        <OptionTitle account={r.account} small />
      </div>
      <MatchMeter value={option.match} />
      <Button variant={active ? 'quiet' : 'ghost'} size="sm" onClick={onChoose} disabled={active}>
        {active ? 'Chosen' : 'Use'}
      </Button>
    </div>
  );
}
