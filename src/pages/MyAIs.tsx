import { Clock, Hourglass, Layers, Pencil, Plus, ThumbsUp, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, Chip, Empty, Field, Modal, Monogram, PageHeader, cx, inputClass } from '../components/ui';
import { CATEGORIES } from '../lib/categories';
import { CUSTOM_PROVIDER_ID, PROVIDERS, accountName, getProvider, monogram, offeringsFor, planName } from '../lib/catalog';
import { uid } from '../lib/id';
import { DAYS, HOURS, untilText } from '../lib/time';
import type { Account, CategoryId } from '../lib/types';
import { useNow } from '../components/useNow';
import { useStore } from '../store';

export function MyAIs() {
  const accounts = useStore((s) => s.accounts);
  const [editing, setEditing] = useState<Account | 'new' | null>(null);

  return (
    <div>
      <PageHeader
        title="My AIs"
        subtitle="Your subscriptions and accounts. Tell Quiver when one hits its limit and it will route around it until it resets."
        action={
          <Button variant="gold" onClick={() => setEditing('new')}>
            <Plus size={16} /> Add AI
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <Empty icon={<Layers size={32} />} title="No AIs yet">
          Add the AI subscriptions you have, free plans included.
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} onEdit={() => setEditing(a)} />
          ))}
        </div>
      )}

      <AccountEditor account={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

const LIMIT_PRESETS: { label: string; ms: number }[] = [
  { label: '1 hour', ms: 1 * HOURS },
  { label: '3 hours', ms: 3 * HOURS },
  { label: '5 hours', ms: 5 * HOURS },
  { label: '1 day', ms: 1 * DAYS },
  { label: '1 week', ms: 7 * DAYS },
];

function AccountCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const updateAccount = useStore((s) => s.updateAccount);
  const removeAccount = useStore((s) => s.removeAccount);
  const [limitOpen, setLimitOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const now = useNow();
  const limited = !!account.limitedUntil && account.limitedUntil > now;

  const usage = useMemo(() => {
    const mine = tasks.filter((t) => t.pick?.accountId === account.id && t.sentAt);
    const rated = mine.filter((t) => t.rating);
    return {
      recent: mine.filter((t) => now - (t.sentAt ?? 0) < 5 * HOURS).length,
      week: mine.filter((t) => now - (t.sentAt ?? 0) < 7 * DAYS).length,
      good: rated.length ? Math.round((rated.filter((t) => t.rating === 'good').length / rated.length) * 100) : undefined,
      rated: rated.length,
    };
  }, [tasks, account.id, now]);

  const offerings = offeringsFor(account);

  return (
    <Card className={cx('flex flex-col p-5', limited && 'opacity-90')}>
      <div className="flex items-start gap-3">
        <Monogram text={monogram(account)} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {accountName(account)} <span className="font-normal text-ink-soft">· {planName(account)}</span>
          </p>
          {account.label && <p className="text-sm text-ink-faint">{account.label}</p>}
        </div>
        <span
          className={cx(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
            limited ? 'bg-gold text-on-gold' : 'border border-line text-ink-soft',
          )}
        >
          {limited ? `Resets ${untilText(account.limitedUntil!, now)}` : 'Ready'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {offerings.map((o) => (
          <Chip key={o.id} title={o.summary}>
            {o.name}
          </Chip>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} /> {usage.recent} in the last 5 h
        </span>
        <span>{usage.week} this week</span>
        {usage.good !== undefined && (
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp size={14} /> {usage.good}% good ({usage.rated})
          </span>
        )}
      </div>

      {limitOpen && !limited && (
        <div className="mt-4 rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="mb-2 text-sm font-medium">When does the limit reset?</p>
          <div className="flex flex-wrap gap-1.5">
            {LIMIT_PRESETS.map((p) => (
              <Chip
                key={p.label}
                onClick={() => {
                  updateAccount(account.id, { limitedUntil: Date.now() + p.ms });
                  setLimitOpen(false);
                }}
              >
                in {p.label}
              </Chip>
            ))}
          </div>
          <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            or at
            <input
              type="datetime-local"
              className={cx(inputClass, 'w-auto py-1')}
              onChange={(e) => {
                const t = new Date(e.target.value).getTime();
                if (t > Date.now()) {
                  updateAccount(account.id, { limitedUntil: t });
                  setLimitOpen(false);
                }
              }}
            />
          </label>
        </div>
      )}

      <div className="flex-1" />
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {limited ? (
          <Button variant="ghost" size="sm" onClick={() => updateAccount(account.id, { limitedUntil: undefined })}>
            It’s available again
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setLimitOpen((v) => !v)} aria-expanded={limitOpen}>
            <Hourglass size={14} /> Hit a limit
          </Button>
        )}
        <Button variant="quiet" size="sm" onClick={onEdit}>
          <Pencil size={14} /> Edit
        </Button>
        <div className="ml-auto">
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <span className="text-xs text-ink-soft">Remove?</span>
              <Button variant="danger" size="sm" onClick={() => removeAccount(account.id)}>
                Yes
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(false)}>
                No
              </Button>
            </span>
          ) : (
            <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(true)} aria-label="Remove this AI">
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function AccountEditor({ account, onClose }: { account: Account | 'new' | null; onClose: () => void }) {
  const open = account !== null;
  const existing = account && account !== 'new' ? account : undefined;
  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit AI' : 'Add an AI'} wide>
      {open && <EditorForm key={existing?.id ?? 'new'} existing={existing} onDone={onClose} />}
    </Modal>
  );
}

function EditorForm({ existing, onDone }: { existing?: Account; onDone: () => void }) {
  const addAccounts = useStore((s) => s.addAccounts);
  const updateAccount = useStore((s) => s.updateAccount);
  const [providerId, setProviderId] = useState(existing?.providerId ?? '');
  const [planId, setPlanId] = useState(existing?.planId ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [customName, setCustomName] = useState(existing?.custom?.name ?? '');
  const [customUrl, setCustomUrl] = useState(existing?.custom?.url ?? '');
  const [customCats, setCustomCats] = useState<CategoryId[]>(existing?.custom?.categories ?? []);

  const provider = getProvider(providerId);
  const isCustom = providerId === CUSTOM_PROVIDER_ID;
  const valid = isCustom ? customName.trim().length > 0 && customCats.length > 0 : !!provider && !!planId;

  const save = () => {
    if (!valid) return;
    const data: Partial<Account> = isCustom
      ? {
          providerId,
          planId: 'custom',
          label: label.trim(),
          custom: { name: customName.trim(), url: customUrl.trim() || undefined, categories: customCats },
        }
      : { providerId, planId, label: label.trim(), custom: undefined };
    if (existing) updateAccount(existing.id, data);
    else addAccounts([{ id: uid(), createdAt: Date.now(), ...(data as Omit<Account, 'id' | 'createdAt'>) }]);
    onDone();
  };

  return (
    <div className="space-y-5">
      {!existing && (
        <div>
          <p className="mb-2 text-sm font-medium">Which AI?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProviderId(p.id);
                  setPlanId(p.plans[0].id);
                }}
                className={cx(
                  'flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition-colors',
                  providerId === p.id ? 'border-gold bg-gold-soft' : 'border-line hover:border-line-strong',
                )}
              >
                <Monogram text={p.monogram} size="sm" />
                <span className="font-medium">{p.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setProviderId(CUSTOM_PROVIDER_ID)}
              className={cx(
                'flex items-center gap-2 rounded-xl border border-dashed p-2.5 text-left text-sm transition-colors',
                isCustom ? 'border-gold bg-gold-soft' : 'border-line-strong hover:border-ink-faint',
              )}
            >
              <Plus size={16} className="mx-1.5" />
              <span className="font-medium">Something else</span>
            </button>
          </div>
        </div>
      )}

      {provider && (
        <div>
          <p className="mb-2 text-sm font-medium">Plan</p>
          <div className="flex flex-wrap gap-1.5">
            {provider.plans.map((p) => (
              <Chip key={p.id} active={planId === p.id} onClick={() => setPlanId(p.id)}>
                {p.name} <span className="text-ink-faint">{p.price}</span>
              </Chip>
            ))}
          </div>
          {provider.plans.find((p) => p.id === planId)?.note && (
            <p className="mt-2 text-xs text-ink-faint">{provider.plans.find((p) => p.id === planId)?.note}</p>
          )}
        </div>
      )}

      {isCustom && (
        <div className="space-y-4">
          <Field label="Name">
            <input className={inputClass} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Kimi, Manus, Runway" />
          </Field>
          <Field label="Link (optional)" hint="Opened when you send a task to it.">
            <input className={inputClass} value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://" inputMode="url" />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">What is it good at?</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  active={customCats.includes(c.id)}
                  onClick={() => setCustomCats((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))}
                >
                  {c.short}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {(provider || isCustom) && (
        <Field label="Label (optional)" hint="Helps when you have more than one account, e.g. Work or Personal.">
          <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Work" maxLength={30} />
        </Field>
      )}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="quiet" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="gold" onClick={save} disabled={!valid}>
          {existing ? 'Save' : 'Add'}
        </Button>
      </div>
    </div>
  );
}
