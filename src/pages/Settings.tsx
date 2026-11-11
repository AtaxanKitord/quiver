import { Download, KeyRound, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { REPO_URL } from '../components/Layout';
import { Button, Card, Field, PageHeader, Segmented, Toggle, inputClass } from '../components/ui';
import type { ModelChoice } from '../lib/ai';
import { DEFAULT_MODEL } from '../lib/ai-config';
import { CATALOG_CHECKED } from '../lib/catalog';
import { go } from '../router';
import { isExportFile, useStore, type Theme } from '../store';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <Appearance />
      <AIAssist />
      <Data />
      <About />
    </div>
  );
}

function Section({ title, children, subtitle }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Appearance() {
  const theme = useStore((s) => s.settings.theme);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <Section title="Appearance">
      <Segmented<Theme>
        label="Theme"
        value={theme}
        onChange={(v) => setSettings({ theme: v })}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    </Section>
  );
}

function AIAssist() {
  const ai = useStore((s) => s.settings.ai);
  const setAI = useStore((s) => s.setAI);
  const [models, setModels] = useState<ModelChoice[]>([]);
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });

  const test = async () => {
    setStatus({ kind: 'busy' });
    try {
      const { listModels } = await import('../lib/ai');
      const list = await listModels(ai);
      setModels(list);
      setStatus({ kind: 'ok', text: `Connected. ${list.length} models available.` });
    } catch (e) {
      setStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <Section
      title="AI assist (optional)"
      subtitle="Quiver works fully offline with its built-in rules. Add a Claude API key for a deeper reading of each task and a rewritten prompt."
    >
      <div className="space-y-4">
        <Toggle
          checked={ai.enabled}
          onChange={(enabled) => setAI({ enabled })}
          label="Use Claude to analyse tasks"
          hint="You can still switch it off per task."
        />
        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <KeyRound size={14} /> Claude API key
            </span>
          }
          hint={
            <>
              Get one at{' '}
              <a href="https://platform.claude.com/" target="_blank" rel="noreferrer" className="underline decoration-gold underline-offset-4">
                platform.claude.com
              </a>
              . It is stored only in this browser, sent only to api.anthropic.com, and never included in exports. Each
              analysis is billed to your API account (usually a few cents or less).
            </>
          }
        >
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
            value={ai.apiKey}
            onChange={(e) => setAI({ apiKey: e.target.value })}
            placeholder="sk-ant-…"
          />
        </Field>
        <Field label="Model" hint={`Default: ${DEFAULT_MODEL}. Lighter models such as Claude Haiku cost much less per analysis.`}>
          {models.length > 0 ? (
            <select className={inputClass} value={ai.model || DEFAULT_MODEL} onChange={(e) => setAI({ model: e.target.value })}>
              {!models.some((m) => m.id === (ai.model || DEFAULT_MODEL)) && <option value={ai.model || DEFAULT_MODEL}>{ai.model || DEFAULT_MODEL}</option>}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              className={inputClass}
              value={ai.model}
              onChange={(e) => setAI({ model: e.target.value })}
              placeholder={DEFAULT_MODEL}
              spellCheck={false}
            />
          )}
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={test} disabled={ai.apiKey.trim().length < 20 || status.kind === 'busy'}>
            {status.kind === 'busy' ? 'Checking…' : 'Test key & load models'}
          </Button>
          {status.text && (
            <span role="status" className={status.kind === 'error' ? 'text-sm text-ink' : 'text-sm text-ink-soft'}>
              {status.text}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}

function Data() {
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiver-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const upload = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isExportFile(data)) throw new Error('not a Quiver backup');
      importData(data);
      setMessage(`Imported ${data.accounts.length} AIs and ${data.tasks.length} tasks.`);
    } catch (e) {
      setMessage(`Couldn’t import that file (${e instanceof Error ? e.message : 'unknown error'}).`);
    }
  };

  return (
    <Section title="Your data" subtitle="Everything lives in this browser. Export a backup to move it to another device.">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={download}>
          <Download size={16} /> Export backup
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Import backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = '';
          }}
        />
        {confirmReset ? (
          <span className="flex items-center gap-2">
            <span className="text-sm text-ink-soft">Delete all AIs, tasks and settings?</span>
            <Button
              variant="danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                go('new');
              }}
            >
              Yes, delete
            </Button>
            <Button variant="quiet" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button variant="quiet" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset everything
          </Button>
        )}
      </div>
      {message && (
        <p className="mt-3 text-sm text-ink-soft" role="status">
          {message}
        </p>
      )}
    </Section>
  );
}

function About() {
  return (
    <Section title="About Quiver">
      <div className="space-y-2 text-sm text-ink-soft">
        <p>
          Quiver is free and open source. Model and plan data last checked on {CATALOG_CHECKED}. Quiver is not affiliated
          with any AI provider; product names belong to their owners.
        </p>
        <p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium text-ink underline decoration-gold underline-offset-4">
            Source code and issues on GitHub
          </a>
        </p>
      </div>
    </Section>
  );
}
