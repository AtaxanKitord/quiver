import { ChevronDown, ExternalLink, Globe, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { REPO_URL } from '../components/Layout';
import { Card, Chip, Monogram, PageHeader, cx } from '../components/ui';
import { CATEGORY_BY_ID } from '../lib/categories';
import { CATALOG_CHECKED, PROVIDERS } from '../lib/catalog';
import type { CategoryId, Offering, Provider } from '../lib/types';
import { useStore } from '../store';

const checked = new Date(`${CATALOG_CHECKED}T12:00:00`).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function Catalog() {
  const accounts = useStore((s) => s.accounts);
  const owned = useMemo(() => new Set(accounts.map((a) => a.providerId)), [accounts]);
  return (
    <div>
      <PageHeader
        title="Catalog"
        subtitle={
          <>
            What each AI and plan offers, and what Quiver thinks each option is good at. Plans and model names were checked
            against official pages on {checked}. Something outdated?{' '}
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer" className="underline decoration-gold underline-offset-4">
              Open an issue
            </a>
            .
          </>
        }
      />
      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <ProviderSection key={p.id} provider={p} owned={owned.has(p.id)} />
        ))}
      </div>
    </div>
  );
}

function ProviderSection({ provider, owned }: { provider: Provider; owned: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
      >
        <Monogram text={provider.monogram} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {provider.name} <span className="font-normal text-ink-faint">by {provider.maker}</span>
          </p>
          <p className="text-sm text-ink-soft">{provider.blurb}</p>
        </div>
        {owned && <Chip active>You have it</Chip>}
        <ChevronDown size={18} className={cx('shrink-0 text-ink-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-line px-4 pt-4 pb-5 sm:px-5">
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-faint">
                  <th className="pr-3 pb-2 font-medium">Option</th>
                  {provider.plans.map((pl) => (
                    <th key={pl.id} className="px-2 pb-2 text-center font-medium">
                      {pl.name}
                      <span className="block font-normal">{pl.price}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {provider.offerings.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3 align-top">
                      <p className="font-medium">{o.name}</p>
                      <p className="text-xs text-ink-faint">{o.summary}</p>
                      <Strengths offering={o} />
                    </td>
                    {provider.plans.map((pl) => (
                      <td key={pl.id} className="px-2 py-2.5 text-center align-top">
                        {o.plans.includes(pl.id) ? (
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold" aria-label="Included" />
                        ) : (
                          <span className="text-ink-faint" aria-label="Not included">
                            –
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {provider.plans.some((p) => p.note) && (
            <ul className="mt-3 space-y-1 text-xs text-ink-faint">
              {provider.plans
                .filter((p) => p.note)
                .map((p) => (
                  <li key={p.id}>
                    <span className="font-medium text-ink-soft">{p.name}:</span> {p.note}
                  </li>
                ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {provider.sources.map((s) => (
              <a key={s} href={s} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
                <ExternalLink size={12} /> {new URL(s).hostname}
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Strengths({ offering }: { offering: Offering }) {
  const top = (Object.entries(offering.scores) as [CategoryId, number][])
    .filter(([, s]) => s >= 8.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {top.map(([id]) => (
        <span key={id} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-soft">
          {CATEGORY_BY_ID[id].short}
        </span>
      ))}
      {offering.web && <Globe size={12} className="ml-0.5 text-ink-faint" aria-label="Can search the web" />}
      {!offering.files && <FileText size={12} className="text-ink-faint opacity-50" aria-label="No file uploads" />}
    </div>
  );
}
