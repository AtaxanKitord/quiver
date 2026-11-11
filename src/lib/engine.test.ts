import { describe, expect, it } from 'vitest';
import { analyze, applyOverrides, primaryCategory } from './analyzer';
import { PROVIDERS, offeringsFor } from './catalog';
import { buildPrompt } from './prompt';
import { recommend, suggestNew } from './recommender';
import type { Account, Task } from './types';

const acc = (id: string, providerId: string, planId: string, extra: Partial<Account> = {}): Account => ({
  id,
  providerId,
  planId,
  label: '',
  createdAt: 0,
  ...extra,
});

const NOW = 1_800_000_000_000;

describe('analyze', () => {
  const cases: [string, string][] = [
    ['Fix this TypeError in my React component, the stack trace is below', 'coding'],
    ['Build a landing page for my bakery and deploy it', 'agentic-coding'],
    ['What are the latest iPhone prices in Germany this week?', 'research'],
    ['Write an Instagram caption for our new coffee blend', 'writing'],
    ['Design a minimalist logo for a yoga studio', 'image'],
    ['Make a 10 second cinematic video of waves at sunset', 'video'],
    ['Summarize this 80-page PDF contract', 'documents'],
    ['Translate this email into German', 'translation'],
    ['Prove that the square root of 2 is irrational', 'reasoning'],
    ['Create a pitch deck for investors', 'office'],
    ['Give me name ideas for a podcast about design', 'brainstorm'],
    ['Write a comprehensive market research report on EV chargers in Europe with competitors', 'deep-research'],
    ['یک کپشن برای پست اینستاگرام بنویس', 'writing'],
    ['این متن رو به انگلیسی ترجمه کن', 'translation'],
    ['hi', 'general'],
  ];
  for (const [text, expected] of cases) {
    it(`"${text}" → ${expected}`, () => {
      expect(primaryCategory(analyze(text))).toBe(expected);
    });
  }

  it('detects web, files, speed and stakes', () => {
    const a = analyze('Quick: check the latest news about this and read the attached PDF. It is for an important client.');
    expect(a.needsWeb).toBe(true);
    expect(a.hasFiles).toBe(true);
    expect(a.quick).toBe(true);
    expect(a.highStakes).toBe(true);
  });

  it('rates simple and complex tasks differently', () => {
    expect(analyze('a simple quick question: what is a CPU?').complexity).toBe('low');
    expect(analyze('Build a complex, production-ready, scalable full-stack web app with auth and payments').complexity).toBe('high');
  });

  it('detects Persian', () => {
    expect(analyze('سلام، یک ایده برای اسم برند می‌خوام').language).toBe('fa');
  });

  it('weights add up to about 1', () => {
    const a = analyze('Write a blog post about Python code review tips and find the latest stats');
    const sum = a.categories.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeGreaterThan(0.98);
    expect(sum).toBeLessThan(1.02);
  });

  it('overrides replace the main category', () => {
    const a = applyOverrides(analyze('Write a blog post'), { category: 'image', needsWeb: true });
    expect(primaryCategory(a)).toBe('image');
    expect(a.needsWeb).toBe(true);
  });
});

describe('catalog', () => {
  it('every offering points to real plans and has valid scores', () => {
    for (const p of PROVIDERS) {
      const planIds = new Set(p.plans.map((pl) => pl.id));
      expect(planIds.size).toBe(p.plans.length);
      for (const o of p.offerings) {
        expect(o.plans.length).toBeGreaterThan(0);
        for (const id of o.plans) expect(planIds.has(id), `${p.id}/${o.id} → ${id}`).toBe(true);
        for (const s of Object.values(o.scores)) {
          expect(s).toBeGreaterThanOrEqual(0);
          expect(s).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('every plan offers at least one thing', () => {
    for (const p of PROVIDERS) {
      for (const pl of p.plans) {
        expect(offeringsFor(acc('x', p.id, pl.id)).length, `${p.id}/${pl.id}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('recommend', () => {
  const accounts = [
    acc('cg', 'chatgpt', 'plus'),
    acc('cl', 'claude', 'pro'),
    acc('ge', 'gemini', 'free'),
    acc('px', 'perplexity', 'free'),
  ];

  it('sends codebase work to a coding agent', () => {
    const r = recommend(analyze('Add a dark mode feature across my React codebase and open a pull request'), accounts, [], NOW);
    expect(['claude-code', 'codex']).toContain(r.top?.offeringId);
  });

  it('sends image work to an image tool', () => {
    const r = recommend(analyze('Create a poster image for a jazz night'), accounts, [], NOW);
    expect(['images']).toContain(r.top?.offeringId);
  });

  it('sends current-events questions to something that can browse', () => {
    const r = recommend(analyze('What are the latest news about the EU AI Act today?'), accounts, [], NOW);
    const offering = offeringsFor(accounts.find((a) => a.id === r.top?.accountId)!).find((o) => o.id === r.top?.offeringId);
    expect(offering?.web).toBe(true);
  });

  it('prefers light models for simple questions', () => {
    const r = recommend(analyze('quick simple question: what is the capital of Australia?'), accounts, [], NOW);
    const offering = offeringsFor(accounts.find((a) => a.id === r.top?.accountId)!).find((o) => o.id === r.top?.offeringId);
    expect(offering?.weight).toBe(1);
  });

  it('skips accounts that hit a limit', () => {
    const limited = [acc('cl', 'claude', 'pro', { limitedUntil: NOW + 3600_000 }), acc('cg', 'chatgpt', 'plus')];
    const r = recommend(analyze('Refactor this Python function'), limited, [], NOW);
    expect(r.unavailable.map((u) => u.accountId)).toEqual(['cl']);
    expect(r.ranked.every((o) => o.accountId !== 'cl')).toBe(true);
  });

  it('spreads load across two accounts of the same plan', () => {
    const twins = [acc('a', 'claude', 'pro'), acc('b', 'claude', 'pro')];
    const analysis = analyze('Write a blog post about remote work');
    const first = recommend(analysis, twins, [], NOW).top!;
    const busy: Task[] = [1, 2, 3].map((i) => ({
      id: `t${i}`,
      text: 'x',
      createdAt: NOW - 1000,
      status: 'sent',
      analysis,
      pick: first,
      sentAt: NOW - 1000 * i,
    }));
    const second = recommend(analysis, twins, busy, NOW).top!;
    expect(second.accountId).not.toBe(first.accountId);
  });

  it('learns from bad ratings', () => {
    const analysis = analyze('Write a blog post about remote work');
    const base = recommend(analysis, accounts, [], NOW);
    const rated: Task[] = [1, 2, 3].map((i) => ({
      id: `t${i}`,
      text: 'x',
      createdAt: 0,
      status: 'done',
      analysis,
      pick: base.top!,
      rating: 'bad',
    }));
    const after = recommend(analysis, accounts, rated, NOW);
    const before = base.top!.match;
    const now = after.ranked.find((o) => o.key === base.top!.key)!.match;
    expect(now).toBeLessThan(before);
  });

  it('offers alternatives from other providers first', () => {
    const r = recommend(analyze('Write a newsletter about our product launch'), accounts, [], NOW);
    expect(r.alternatives.length).toBe(2);
    expect(r.alternatives.every((a) => a.providerId !== r.top?.providerId)).toBe(true);
  });

  it('suggests a new AI when none of yours can do the job', () => {
    const textOnly = [acc('ds', 'deepseek', 'free')];
    const analysis = analyze('Make a short video of a cat surfing');
    expect(recommend(analysis, textOnly, [], NOW).top).toBeUndefined();
    expect(suggestNew(analysis, textOnly).length).toBeGreaterThan(0);
  });
});

describe('buildPrompt', () => {
  it('keeps the task and adds blanks', () => {
    const p = buildPrompt('Write a launch email', analyze('Write a launch email'));
    expect(p.startsWith('Write a launch email')).toBe(true);
    expect(p).toContain('Audience:');
  });
});
