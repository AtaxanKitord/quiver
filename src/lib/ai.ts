import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { AISettings } from '../store';
import { DEFAULT_MODEL } from './ai-config';
import { CATEGORIES } from './categories';
import { accountName, offeringsFor, planName } from './catalog';
import type { Account, AIHints, Analysis, CategoryId, Complexity } from './types';

/**
 * Optional deeper analysis with Claude, using the user's own API key.
 * The key stays in the browser and goes only to api.anthropic.com.
 */

/** Models that accept the server-side refusal fallback. */
const FALLBACK_MODELS = ['claude-fable-5-2', 'claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'];

function client(s: AISettings) {
  return new Anthropic({ apiKey: s.apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 1 });
}

/** Turn SDK errors into a short sentence for the UI. */
export function describeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'The API key was rejected. Check it in Settings.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key can’t use that model.';
  if (e instanceof Anthropic.NotFoundError) return 'That model wasn’t found. Pick another one in Settings.';
  if (e instanceof Anthropic.RateLimitError) return 'Rate limited. Try again in a moment.';
  if (e instanceof Anthropic.APIConnectionError) return 'Couldn’t reach the Claude API. Check your connection.';
  if (e instanceof Anthropic.APIError) return `Claude API error ${e.status ?? ''}`.trim();
  return e instanceof Error ? e.message : String(e);
}

export interface ModelChoice {
  id: string;
  name: string;
}

/** The models this key can use. Also works as a connection test. */
export async function listModels(s: AISettings): Promise<ModelChoice[]> {
  try {
    const models: ModelChoice[] = [];
    for await (const m of client(s).models.list({ limit: 100 })) models.push({ id: m.id, name: m.display_name });
    return models;
  } catch (e) {
    throw new Error(describeError(e));
  }
}

const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

const ResultSchema = z.object({
  categories: z.array(z.object({ id: z.enum(CATEGORY_IDS), weight: z.number() })),
  needsWeb: z.boolean(),
  hasFiles: z.boolean(),
  quick: z.boolean(),
  highStakes: z.boolean(),
  complexity: z.enum(['low', 'medium', 'high']),
  ranking: z.array(z.object({ option: z.string(), reason: z.string() })),
  prompt: z.string(),
  tips: z.array(z.string()),
});

const SYSTEM = `You are the routing engine of Quiver, an app that helps people decide which of their own AI subscriptions to use for a task, and how to get the best result from it.

You receive a task written by the user and the list of options they can use right now. Each option is one model or mode inside one of their accounts, with a key like "accountId::offeringId".

Do four things:
1. Classify the task into 1-3 categories from this list, with weights that add up to 1 (main category first):
${CATEGORIES.map((c) => `- ${c.id}: ${c.label}. ${c.blurb}`).join('\n')}
   Also decide: needsWeb (needs current information from the internet), hasFiles (the user will work from files they have), quick (speed matters more than depth), highStakes (mistakes would be costly), complexity (low, medium or high).
2. Rank the best 3 options for this task, using only keys from the list. Prefer the option that will give the best result without wasting a heavy model on a light task. Give each a reason of at most 15 words, written to the user ("Strong at long contracts and can read your PDF").
3. Write an improved prompt the user can paste into the top option. Keep their intent and facts, add useful structure (context, requirements, output format), and mark information only they can supply with [square brackets]. Write it in the same language the task is written in. Do not invent facts.
4. Give 2-3 short, specific tips for getting the best result with the top option for this task (in English).`;

function describeOptions(accounts: Account[], now: number): string {
  const lines: string[] = [];
  for (const account of accounts) {
    if (account.limitedUntil && account.limitedUntil > now) continue;
    const owner = `${accountName(account)} ${planName(account)}${account.label ? ` (${account.label})` : ''}`;
    for (const o of offeringsFor(account)) {
      const traits = [
        o.web ? 'can browse the web' : 'no web access',
        o.files ? 'reads files' : 'no file uploads',
        ['', 'light on limits', 'moderate on limits', 'heavy on limits'][o.weight],
        ['', 'slow', 'medium speed', 'fast'][o.speed],
      ].join(', ');
      lines.push(`- ${account.id}::${o.id} | ${owner} → ${o.name}: ${o.summary} (${traits})`);
    }
  }
  return lines.join('\n');
}

export interface AIResult {
  analysis: Analysis;
  hints: AIHints;
  prompt: string;
  tips: string[];
}

export async function analyzeWithAI(
  text: string,
  accounts: Account[],
  s: AISettings,
  signal?: AbortSignal,
): Promise<AIResult> {
  const model = s.model.trim() || DEFAULT_MODEL;
  const useFallback = FALLBACK_MODELS.includes(model);
  const options = describeOptions(accounts, Date.now());
  if (!options) throw new Error('None of your AIs is available right now.');

  let response;
  try {
    response = await client(s).beta.messages.parse(
      {
        model,
        max_tokens: 16000,
        system: SYSTEM,
        output_config: { effort: 'low', format: betaZodOutputFormat(ResultSchema) },
        // If the model declines, let the API retry on a suitable fallback model in the same call.
        ...(useFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        messages: [
          {
            role: 'user',
            content: `My options right now:\n${options}\n\nMy task:\n<task>\n${text}\n</task>`,
          },
        ],
      },
      { signal },
    );
  } catch (e) {
    throw new Error(describeError(e));
  }

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to analyse this task.');
  if (response.stop_reason === 'max_tokens') throw new Error('The analysis was cut off.');
  const out = response.parsed_output;
  if (!out) throw new Error('Claude returned an answer Quiver couldn’t read.');

  // Validate everything the model returned before trusting it.
  const seen = new Set<CategoryId>();
  const cats = out.categories.filter((c) => !seen.has(c.id) && seen.add(c.id) && c.weight > 0).slice(0, 3);
  const total = cats.reduce((sum, c) => sum + c.weight, 0) || 1;
  const categories = cats.length
    ? cats.map((c) => ({ id: c.id, weight: Math.round((c.weight / total) * 100) / 100 }))
    : [{ id: 'general' as CategoryId, weight: 1 }];

  const validKeys = new Set(
    accounts.flatMap((a) => offeringsFor(a).map((o) => `${a.id}::${o.id}`)),
  );
  const ranking = out.ranking.filter((r) => validKeys.has(r.option));

  return {
    analysis: {
      categories,
      needsWeb: out.needsWeb,
      hasFiles: out.hasFiles,
      quick: out.quick,
      highStakes: out.highStakes,
      complexity: out.complexity as Complexity,
      language: /[؀-ۿ]/.test(text) ? 'fa' : 'en',
      source: 'ai',
    },
    hints: {
      ranking: ranking.map((r) => r.option),
      reasons: Object.fromEntries(ranking.map((r) => [r.option, r.reason])),
    },
    prompt: out.prompt.trim(),
    tips: out.tips.map((t) => t.trim()).filter(Boolean).slice(0, 3),
  };
}
