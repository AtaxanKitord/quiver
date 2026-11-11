import { ArrowRight, CheckCircle2, ExternalLink, FileText, Globe, Sparkles, Target, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_ICONS } from '../components/icons';
import { RecommendationView, useOption } from '../components/Recommendation';
import { Button, Card, Chip, PageHeader, Segmented, Toggle, cx } from '../components/ui';
import { aiReady } from '../lib/ai-config';
import { analyze, applyOverrides, primaryCategory } from '../lib/analyzer';
import { CATEGORIES, CATEGORY_BY_ID } from '../lib/categories';
import { accountName, accountUrl } from '../lib/catalog';
import { uid } from '../lib/id';
import { buildPrompt } from '../lib/prompt';
import { recommend } from '../lib/recommender';
import type { AIHints, Analysis, AnalysisOverrides, Complexity, Recommendation, ScoredOption } from '../lib/types';
import { go } from '../router';
import { useStore } from '../store';

const EXAMPLES = [
  'Fix a TypeError in my React component',
  'Write an Instagram caption for our new coffee blend',
  'Summarize this 60-page PDF contract and list the risks',
  'Design a minimalist logo for a yoga studio',
  'What are the latest iPhone prices in Germany?',
  'Build a landing page for my bakery and deploy it',
];

interface Shown {
  taskId: string;
  text: string;
  analysis: Analysis;
  rec: Recommendation;
  prompt: string;
  chosenKey?: string;
  aiTips?: string[];
  aiUsed: boolean;
}

export function NewTask() {
  const accounts = useStore((s) => s.accounts);
  const tasks = useStore((s) => s.tasks);
  const draft = useStore((s) => s.draft);
  const setDraft = useStore((s) => s.setDraft);
  const aiSettings = useStore((s) => s.settings.ai);
  const upsertTask = useStore((s) => s.upsertTask);
  const updateTask = useStore((s) => s.updateTask);

  const [text, setText] = useState(draft);
  const [overrides, setOverrides] = useState<AnalysisOverrides>({});
  const [shown, setShown] = useState<Shown | null>(null);
  const [sent, setSent] = useState<ScoredOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const canUseAI = aiReady(aiSettings);
  const [useAI, setUseAI] = useState(canUseAI);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A task re-routed from the Tasks page arrives as a draft.
  useEffect(() => {
    if (draft) setDraft('');
  }, [draft, setDraft]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const auto = useMemo(() => analyze(text), [text]);
  const analysis = applyOverrides(auto, overrides);
  const primary = primaryCategory(analysis);
  const ready = text.trim().length >= 3;

  const setFlag = (key: keyof AnalysisOverrides, value: AnalysisOverrides[keyof AnalysisOverrides]) =>
    setOverrides((o) => ({ ...o, [key]: value }));

  const find = async () => {
    if (!ready || busy) return;
    setSent(null);
    setAiError('');
    let used = analysis;
    let hints: AIHints | undefined;
    let prompt: string | undefined;
    let aiTips: string[] | undefined;
    let aiUsed = false;

    if (useAI && canUseAI) {
      setBusy(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const { analyzeWithAI } = await import('../lib/ai');
        const result = await analyzeWithAI(text, accounts, aiSettings, controller.signal);
        // Manual corrections still win over the AI's reading.
        used = applyOverrides(result.analysis, overrides);
        hints = result.hints;
        prompt = result.prompt;
        aiTips = result.tips;
        aiUsed = true;
      } catch (e) {
        if (controller.signal.aborted) return;
        setAiError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }

    const rec = recommend(used, accounts, tasks, Date.now(), hints);
    const finalPrompt = prompt || buildPrompt(text, used);
    // Re-running the same text updates its task instead of adding a duplicate.
    const existing = shown && shown.text === text ? tasks.find((t) => t.id === shown.taskId && t.status === 'todo') : undefined;
    const taskId = existing?.id ?? uid();
    upsertTask({
      id: taskId,
      text: text.trim(),
      createdAt: existing?.createdAt ?? Date.now(),
      status: 'todo',
      analysis: used,
      prompt: finalPrompt,
    });
    setShown({ taskId, text, analysis: used, rec, prompt: finalPrompt, chosenKey: rec.top?.key, aiTips, aiUsed });
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const onSend = (option: ScoredOption) => {
    if (!shown) return;
    updateTask(shown.taskId, { status: 'sent', pick: option, prompt: shown.prompt, sentAt: Date.now(), analysis: shown.analysis });
    setSent(option);
  };

  const reset = () => {
    setText('');
    setOverrides({});
    setShown(null);
    setSent(null);
    setAiError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <PageHeader title="What do you need to get done?" subtitle="Describe the task in your own words. Quiver picks the best of your AIs for it." />

      <Card className="p-4 sm:p-5">
        <textarea
          dir="auto"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (sent) setSent(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) find();
          }}
          rows={4}
          placeholder="e.g. Write a friendly email to a client explaining a two-week delay…"
          aria-label="Task description"
          className="w-full resize-y bg-transparent text-lg leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
        />
        {!text && (
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Chip key={ex} onClick={() => setText(ex)} className="text-left whitespace-normal">
                {ex}
              </Chip>
            ))}
          </div>
        )}

        {ready && (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-ink-faint">Task type</span>
                <span className="relative">
                  <select
                    value={primary}
                    onChange={(e) => setFlag('category', e.target.value as Analysis['categories'][number]['id'])}
                    className="appearance-none rounded-full border border-gold bg-gold-soft py-1 pr-7 pl-3 text-sm font-medium text-ink focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ArrowRight size={12} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rotate-90 text-ink-soft" />
                </span>
              </label>
              {analysis.categories.slice(1).map((c) => {
                const Icon = CATEGORY_ICONS[c.id];
                return (
                  <Chip key={c.id} title="Also part of this task">
                    <Icon size={13} /> {CATEGORY_BY_ID[c.id].short}
                  </Chip>
                );
              })}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-faint">Effort</span>
                <Segmented<Complexity>
                  label="Effort"
                  value={analysis.complexity}
                  onChange={(v) => setFlag('complexity', v)}
                  options={[
                    { value: 'low', label: 'Simple' },
                    { value: 'medium', label: 'Normal' },
                    { value: 'high', label: 'Complex' },
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={analysis.needsWeb} onClick={() => setFlag('needsWeb', !analysis.needsWeb)}>
                <Globe size={13} /> Needs current info
              </Chip>
              <Chip active={analysis.hasFiles} onClick={() => setFlag('hasFiles', !analysis.hasFiles)}>
                <FileText size={13} /> I’ll attach files
              </Chip>
              <Chip active={analysis.quick} onClick={() => setFlag('quick', !analysis.quick)}>
                <Zap size={13} /> Keep it quick
              </Chip>
              <Chip active={analysis.highStakes} onClick={() => setFlag('highStakes', !analysis.highStakes)}>
                <Target size={13} /> High stakes
              </Chip>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {canUseAI ? (
            <Toggle checked={useAI} onChange={setUseAI} label="Deeper analysis with AI" hint={`Uses your ${aiSettings.provider} API key`} />
          ) : (
            <a href="#/settings" className="text-xs text-ink-faint hover:text-ink">
              Optional: add an API key in Settings for deeper AI analysis
            </a>
          )}
          <Button variant="gold" size="lg" onClick={find} disabled={!ready || busy}>
            {busy ? (
              <>
                <Sparkles size={16} className="animate-pulse" /> Thinking…
              </>
            ) : (
              <>
                Find the best AI <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
        {aiError && (
          <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft" role="status">
            AI analysis failed, so Quiver used its built-in rules. ({aiError})
          </p>
        )}
      </Card>

      <div ref={resultsRef} className="scroll-mt-20">
        {sent ? (
          <SentNotice option={sent} onNew={reset} />
        ) : (
          shown && (
            <div className="mt-8">
              {shown.aiUsed && (
                <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink-faint">
                  <Sparkles size={13} /> Analysed with AI
                </p>
              )}
              <RecommendationView
                rec={shown.rec}
                analysis={shown.analysis}
                prompt={shown.prompt}
                onPromptChange={(prompt) => setShown((s) => (s ? { ...s, prompt } : s))}
                chosenKey={shown.chosenKey}
                onChoose={(chosenKey) => {
                  setShown((s) => (s ? { ...s, chosenKey } : s));
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onSend={onSend}
                onSave={() => {
                  if (shown) updateTask(shown.taskId, { prompt: shown.prompt });
                  go('tasks');
                }}
                aiTips={shown.aiTips}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function SentNotice({ option, onNew }: { option: ScoredOption; onNew: () => void }) {
  const r = useOption(option);
  return (
    <Card className={cx('mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center')}>
      <CheckCircle2 size={28} className="shrink-0 text-brand dark:text-gold" />
      <div className="flex-1">
        <p className="font-display text-xl font-semibold">
          Prompt copied{r ? ` for ${accountName(r.account)} · ${r.offering?.name ?? ''}` : ''}.
        </p>
        <p className="text-sm text-ink-soft">Paste it into the new tab. When you’re done, mark the task as done in Tasks and rate the result.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {r && accountUrl(r.account) && (
          <a
            href={accountUrl(r.account)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-medium hover:bg-surface-2"
          >
            Open {accountName(r.account)} <ExternalLink size={14} />
          </a>
        )}
        <Button variant="ghost" onClick={() => go('tasks')}>
          Open Tasks
        </Button>
        <Button variant="gold" onClick={onNew}>
          New task
        </Button>
      </div>
    </Card>
  );
}
