import { primaryCategory } from './analyzer';
import { CATEGORY_BY_ID } from './categories';
import { PROVIDERS, offeringsFor, planName, planUsage } from './catalog';
import type { Account, AIHints, Analysis, Offering, Recommendation, ScoredOption, Task, Unavailable } from './types';

const HOUR = 60 * 60 * 1000;
const LOAD_WINDOW = 5 * HOUR;

export const optionKey = (accountId: string, offeringId: string) => `${accountId}::${offeringId}`;

const feedbackKey = (providerId: string, offeringId: string, category: string) =>
  `${providerId}:${offeringId}:${category}`;

/** Average rating (-1..1) and count per option + category, from tasks the user rated. */
export function feedbackTable(tasks: Task[]): Map<string, { avg: number; n: number }> {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const t of tasks) {
    if (!t.pick || !t.rating) continue;
    const k = feedbackKey(t.pick.providerId, t.pick.offeringId, primaryCategory(t.analysis));
    const cur = sums.get(k) ?? { sum: 0, n: 0 };
    cur.sum += t.rating === 'good' ? 1 : -1;
    cur.n += 1;
    sums.set(k, cur);
  }
  return new Map([...sums].map(([k, v]) => [k, { avg: v.sum / v.n, n: v.n }]));
}

/** How many tasks were sent to each account in the last few hours. */
export function recentLoad(tasks: Task[], now: number): Map<string, number> {
  const load = new Map<string, number>();
  for (const t of tasks) {
    if (!t.pick || !t.sentAt || now - t.sentAt > LOAD_WINDOW) continue;
    load.set(t.pick.accountId, (load.get(t.pick.accountId) ?? 0) + 1);
  }
  return load;
}

interface Context {
  analysis: Analysis;
  load: Map<string, number>;
  feedback: Map<string, { avg: number; n: number }>;
  hints?: AIHints;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Score one option. Returns undefined when the option can't do the main job at all. */
export function scoreOption(account: Account, offering: Offering, ctx: Context): ScoredOption | undefined {
  const { analysis } = ctx;
  const primary = primaryCategory(analysis);
  const primaryScore = offering.scores[primary];
  if (primaryScore === undefined) return undefined;

  const reasons: string[] = [];
  const warnings: string[] = [];

  // How good is it at this kind of work? Missing secondary skills count as weak, not zero.
  let quality = 0;
  for (const c of analysis.categories) {
    const s = offering.scores[c.id] ?? (c.id === primary ? 0 : Math.max(0, primaryScore - 3));
    quality += c.weight * s;
  }

  let adjust = 0;
  const heavy = offering.weight === 3;
  const light = offering.weight === 1;

  if (analysis.complexity === 'high') {
    adjust += (offering.weight - 2) * 0.6;
    if (heavy) reasons.push('A top-tier option for a demanding task');
  } else if (analysis.complexity === 'low') {
    adjust -= (offering.weight - 1) * 0.5;
    if (light) reasons.push('Light and fast, so it saves your heavier limits');
  } else {
    // Everyday tasks: the balanced option is usually enough, so keep heavy models in reserve.
    adjust -= Math.max(0, offering.weight - 2) * 0.5;
  }

  if (analysis.quick) {
    adjust += (offering.speed - 2) * 0.6;
    if (offering.speed === 3) reasons.push('Fast replies');
  }

  if (analysis.highStakes) {
    adjust += (offering.weight - 2) * 0.4 + (primaryScore >= 9 ? 0.3 : 0);
    if (heavy && analysis.complexity !== 'high') reasons.push('Worth a top model, since mistakes here would be costly');
  }

  if (analysis.needsWeb) {
    if (offering.web) {
      if (primary !== 'research' && primary !== 'deep-research') reasons.push('Can search the web for current information');
    } else {
      adjust -= 2.5;
      warnings.push('Can’t search the web. Paste the facts or sources it needs.');
    }
  }

  if (analysis.hasFiles && !offering.files) {
    adjust -= 2;
    warnings.push('Can’t read uploaded files.');
  }

  // Bigger plans have more headroom for heavy work.
  const usage = planUsage(account);
  adjust += (usage - 3) * 0.08 * offering.weight;
  if (usage >= 4 && offering.weight >= 2) reasons.push(`Your ${planName(account)} plan has plenty of room for this`);

  // Spread work across accounts so no single one hits its limit.
  const used = ctx.load.get(account.id) ?? 0;
  if (used > 0) {
    adjust -= Math.min(1.5, used * 0.25 * offering.weight);
    if (used >= 3) warnings.push(`Used ${used} times in the last 5 hours, so it may be close to its limit.`);
  }

  // Learn from how the user rated similar tasks.
  const fb = ctx.feedback.get(feedbackKey(account.providerId, offering.id, primary));
  if (fb) {
    adjust += 0.8 * fb.avg * Math.min(fb.n, 3) / 3;
    if (fb.avg > 0.3) reasons.push('You rated it well for similar tasks');
    if (fb.avg < -0.3) warnings.push('You rated it poorly for similar tasks.');
  }

  const key = optionKey(account.id, offering.id);
  const hintRank = ctx.hints?.ranking.indexOf(key) ?? -1;
  if (hintRank >= 0 && hintRank < 3) adjust += [1.2, 0.8, 0.5][hintRank];
  const hintReason = ctx.hints?.reasons[key];

  // Lead with what it is good at.
  const label = CATEGORY_BY_ID[primary].skill;
  const strength =
    primaryScore >= 9.4
      ? `One of the strongest options for ${label}`
      : primaryScore >= 8.5
        ? `Strong at ${label}`
        : primaryScore >= 7
          ? `Good at ${label}`
          : `Can handle ${label}`;
  const allReasons = [...(hintReason ? [hintReason] : []), strength, ...reasons];

  return {
    key,
    accountId: account.id,
    providerId: account.providerId,
    planId: account.planId,
    offeringId: offering.id,
    match: Math.round(clamp((quality + adjust) * 10, 1, 99)),
    reasons: [...new Set(allReasons)].slice(0, 4),
    warnings,
  };
}

/** Pick the best option plus up to two alternatives, preferring other providers, then other accounts. */
function pickAlternatives(ranked: ScoredOption[]): ScoredOption[] {
  const [top, ...rest] = ranked;
  if (!top) return [];
  const chosen: ScoredOption[] = [];
  const passes: ((o: ScoredOption) => boolean)[] = [
    (o) => o.providerId !== top.providerId && !chosen.some((c) => c.providerId === o.providerId),
    (o) => o.accountId !== top.accountId && !chosen.some((c) => c.accountId === o.accountId),
    () => true,
  ];
  for (const pass of passes) {
    for (const o of rest) {
      if (chosen.length >= 2) break;
      if (!chosen.includes(o) && pass(o)) chosen.push(o);
    }
  }
  return chosen;
}

export interface Suggestion {
  providerId: string;
  planId: string;
  offeringId: string;
  score: number;
}

/**
 * Options the user doesn't have yet that would fit this task, cheapest plan first.
 * Shown when nothing they own can do the job, or does it poorly.
 */
export function suggestNew(analysis: Analysis, accounts: Account[], limit = 2): Suggestion[] {
  const primary = primaryCategory(analysis);
  const owned = new Set(accounts.map((a) => a.providerId));
  const best = new Map<string, Suggestion>();
  for (const provider of PROVIDERS) {
    if (owned.has(provider.id)) continue;
    for (const offering of provider.offerings) {
      const score = offering.scores[primary];
      if (score === undefined || score < 8) continue;
      // The cheapest plan that includes it: plans are listed cheapest first.
      const planId = provider.plans.find((p) => offering.plans.includes(p.id))?.id;
      if (!planId) continue;
      const current = best.get(provider.id);
      if (!current || score > current.score) best.set(provider.id, { providerId: provider.id, planId, offeringId: offering.id, score });
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export function recommend(
  analysis: Analysis,
  accounts: Account[],
  tasks: Task[],
  now: number = Date.now(),
  hints?: AIHints,
): Recommendation {
  const ctx: Context = {
    analysis,
    load: recentLoad(tasks, now),
    feedback: feedbackTable(tasks),
    hints,
  };
  const ranked: ScoredOption[] = [];
  const unavailable: Unavailable[] = [];

  for (const account of accounts) {
    if (account.limitedUntil && account.limitedUntil > now) {
      unavailable.push({ accountId: account.id, until: account.limitedUntil });
      continue;
    }
    for (const offering of offeringsFor(account)) {
      const scored = scoreOption(account, offering, ctx);
      if (scored) ranked.push(scored);
    }
  }

  ranked.sort((a, b) => b.match - a.match);
  return { ranked, top: ranked[0], alternatives: pickAlternatives(ranked), unavailable };
}
