import { CATEGORIES } from './categories';
import type { Analysis, AnalysisOverrides, CategoryId, Complexity, WeightedCategory } from './types';

/** Lower-case, unify Arabic/Persian letters and turn zero-width joiners into spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/‌/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const ASCII = /^[\x20-\x7e]+$/;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Matcher {
  test: (text: string) => boolean;
  phrase: boolean;
}

function matcher(keyword: string): Matcher {
  const k = normalize(keyword);
  if (ASCII.test(k)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(k)}(?=$|[^a-z0-9])`);
    return { test: (t) => re.test(t), phrase: k.includes(' ') };
  }
  return { test: (t) => t.includes(k), phrase: k.includes(' ') };
}

function compile(words: string[]): Matcher[] {
  return words.map(matcher);
}

/** Phrases count a bit more than single words because they are more specific. */
function score(text: string, matchers: Matcher[]): number {
  let total = 0;
  for (const m of matchers) if (m.test(text)) total += m.phrase ? 1.5 : 1;
  return total;
}

const CATEGORY_MATCHERS = CATEGORIES.map((c) => ({ id: c.id, matchers: compile(c.keywords) }));

const WEB = compile([
  'latest', 'news', 'today', 'current', 'currently', 'right now', 'this week', 'this month', 'this year', 'recent',
  'recently', 'price', 'prices', 'up to date', 'search the web', 'look up', 'sources', 'citations', 'link',
  'links', 'trending', 'release date', 'weather', 'stock', '2025', '2026', '2027',
  'جدیدترین', 'اخبار', 'امروز', 'قیمت', 'الان', 'آخرین', 'منبع', 'لینک',
]);

const FILES = compile([
  'pdf', 'attached', 'attachment', 'this file', 'my file', 'these files', 'upload', 'uploaded', 'document',
  'spreadsheet', 'csv', 'excel', 'xlsx', 'docx', 'screenshot', 'this photo', 'this image', 'my photo',
  'transcript', 'recording',
  'فایل', 'پیوست', 'پی دی اف', 'اسکرین شات', 'این عکس', 'اکسل',
]);

const QUICK = compile([
  'quick', 'quickly', 'fast', 'asap', 'urgent', 'short answer', 'briefly', 'one line', 'in a sentence', 'tl;dr',
  'سریع', 'فوری', 'کوتاه', 'خلاصه وار',
]);

const STAKES = compile([
  'important', 'critical', 'production', 'client', 'legal', 'medical', 'investor', 'investors', 'must be accurate',
  'accurate', 'job application', 'thesis', 'publish', 'board meeting', 'contract',
  'مهم', 'حیاتی', 'مشتری', 'دقیق', 'حقوقی', 'پزشکی', 'سرمایه گذار', 'پایان نامه',
]);

const COMPLEX = compile([
  'complex', 'complicated', 'detailed', 'comprehensive', 'advanced', 'architecture', 'large', 'end-to-end',
  'end to end', 'full', 'production', 'multi-step', 'in depth', 'in-depth', 'scalable', 'thorough', 'difficult',
  'hard', 'entire', 'whole',
  'پیچیده', 'کامل', 'جامع', 'حرفه ای', 'دقیق', 'سخت', 'پیشرفته',
]);

const SIMPLE = compile([
  'simple', 'quick', 'short', 'small', 'basic', 'easy', 'one-liner', 'one liner', 'tiny', 'briefly',
  'ساده', 'کوتاه', 'کوچک', 'سریع',
]);

const PERSIAN = /[؀-ۿ]/g;
const LATIN = /[a-z]/gi;

const round = (n: number) => Math.round(n * 100) / 100;

/** Rule-based reading of a task description. Works offline and costs nothing. */
export function analyze(input: string): Analysis {
  const text = normalize(input);
  const words = text ? text.split(' ').length : 0;

  const raw = new Map<CategoryId, number>();
  for (const { id, matchers } of CATEGORY_MATCHERS) {
    const s = score(text, matchers);
    if (s > 0) raw.set(id, s);
  }

  // Building a whole app is coding too; a coding task that mentions an app or repo is agentic.
  const agentic = raw.get('agentic-coding') ?? 0;
  const coding = raw.get('coding') ?? 0;
  if (agentic > 0) {
    raw.set('agentic-coding', agentic + coding * 0.5);
    raw.set('coding', Math.max(coding, agentic * 0.5));
  }
  // A "report" that is also research-y is a deep research job, not just a quick lookup.
  if ((raw.get('deep-research') ?? 0) > 0 && (raw.get('research') ?? 0) > 0) {
    raw.set('deep-research', (raw.get('deep-research') ?? 0) + 1);
  }
  // Images or video plus a little writing usually means the visual is the point.
  for (const visual of ['image', 'video'] as const) {
    if ((raw.get(visual) ?? 0) > 0 && (raw.get('writing') ?? 0) > 0 && !/script|caption|کپشن|سناریو/.test(text)) {
      raw.set(visual, (raw.get(visual) ?? 0) + 1);
    }
  }

  let entries = [...raw.entries()].sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) entries = [['general', 1]];
  const topScore = entries[0][1];
  entries = entries.filter(([, v]) => v >= topScore * 0.4).slice(0, 3);
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  const categories: WeightedCategory[] = entries.map(([id, v]) => ({ id, weight: round(v / sum) }));
  const primary = categories[0].id;

  const needsWeb =
    score(text, WEB) > 0 || primary === 'research' || primary === 'deep-research' || categories.some((c) => c.id === 'deep-research');
  const hasFiles = score(text, FILES) > 0;
  const quick = score(text, QUICK) > 0;
  const highStakes = score(text, STAKES) > 0;

  let c = 0;
  if (words > 60) c += 1;
  if (words > 160) c += 1;
  c += Math.min(2, score(text, COMPLEX));
  c -= Math.min(2, score(text, SIMPLE));
  if (primary === 'deep-research' || primary === 'agentic-coding') c += 1;
  if (primary === 'general') c -= 1;
  if (highStakes) c += 1;
  const complexity: Complexity = c >= 2 ? 'high' : c <= -1 ? 'low' : 'medium';

  const persianLetters = (input.match(PERSIAN) ?? []).length;
  const latinLetters = (input.match(LATIN) ?? []).length;
  const language: Analysis['language'] =
    persianLetters > latinLetters ? 'fa' : latinLetters > 0 || !input.trim() ? 'en' : 'other';

  return { categories, needsWeb, hasFiles, quick, highStakes, complexity, language, source: 'rules' };
}

/** Apply the user's manual corrections on top of an analysis. */
export function applyOverrides(base: Analysis, o: AnalysisOverrides): Analysis {
  let categories = base.categories;
  if (o.category && o.category !== base.categories[0].id) {
    const rest = base.categories.filter((c) => c.id !== o.category).slice(0, 2);
    const restWeight = rest.reduce((s, c) => s + c.weight, 0) || 1;
    categories = [
      { id: o.category, weight: rest.length ? 0.7 : 1 },
      ...rest.map((c) => ({ id: c.id, weight: round((0.3 * c.weight) / restWeight) })),
    ];
  }
  return {
    ...base,
    categories,
    needsWeb: o.needsWeb ?? base.needsWeb,
    hasFiles: o.hasFiles ?? base.hasFiles,
    quick: o.quick ?? base.quick,
    highStakes: o.highStakes ?? base.highStakes,
    complexity: o.complexity ?? base.complexity,
  };
}

export const primaryCategory = (a: Analysis): CategoryId => a.categories[0]?.id ?? 'general';
