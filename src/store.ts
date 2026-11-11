import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Account, Task } from './lib/types';

export type Theme = 'system' | 'light' | 'dark';
export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface Settings {
  theme: Theme;
  onboarded: boolean;
  ai: AISettings;
}

export interface ExportFile {
  app: 'quiver';
  version: 1;
  exportedAt: string;
  accounts: Account[];
  tasks: Task[];
  settings: Omit<Settings, 'ai'> & { ai: Omit<AISettings, 'apiKey'> };
}

interface State {
  accounts: Account[];
  tasks: Task[];
  settings: Settings;
  /** Text waiting on the New task page, e.g. when re-routing an old task. */
  draft: string;

  addAccounts: (accounts: Account[]) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => void;

  upsertTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  setAI: (patch: Partial<AISettings>) => void;
  setDraft: (text: string) => void;

  exportData: () => ExportFile;
  importData: (file: ExportFile) => void;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  onboarded: false,
  ai: { enabled: false, provider: 'anthropic', apiKey: '', model: '' },
};

/** localStorage can throw (private mode, blocked storage). Fall back to memory so the app still works. */
const safeStorage = () => {
  const memory = new Map<string, string>();
  return {
    getItem: (k: string) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return memory.get(k) ?? null;
      }
    },
    setItem: (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        memory.set(k, v);
      }
    },
    removeItem: (k: string) => {
      try {
        localStorage.removeItem(k);
      } catch {
        memory.delete(k);
      }
    },
  };
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      accounts: [],
      tasks: [],
      settings: DEFAULT_SETTINGS,
      draft: '',

      addAccounts: (accounts) => set((s) => ({ accounts: [...s.accounts, ...accounts] })),
      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      upsertTask: (task) =>
        set((s) => {
          const exists = s.tasks.some((t) => t.id === task.id);
          return { tasks: exists ? s.tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...s.tasks] };
        }),
      updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setAI: (patch) => set((s) => ({ settings: { ...s.settings, ai: { ...s.settings.ai, ...patch } } })),
      setDraft: (draft) => set({ draft }),

      exportData: () => {
        const { accounts, tasks, settings } = get();
        const { apiKey: _omit, ...ai } = settings.ai;
        return {
          app: 'quiver',
          version: 1,
          exportedAt: new Date().toISOString(),
          accounts,
          tasks,
          settings: { ...settings, ai },
        };
      },
      importData: (file) =>
        set((s) => ({
          accounts: file.accounts ?? [],
          tasks: file.tasks ?? [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...file.settings,
            onboarded: true,
            // Keep the key that is already in this browser; exports never contain it.
            ai: { ...DEFAULT_SETTINGS.ai, ...file.settings?.ai, apiKey: s.settings.ai.apiKey },
          },
        })),
      resetAll: () => set({ accounts: [], tasks: [], settings: DEFAULT_SETTINGS, draft: '' }),
    }),
    {
      name: 'quiver-v1',
      version: 1,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ accounts: s.accounts, tasks: s.tasks, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...p.settings, ai: { ...DEFAULT_SETTINGS.ai, ...p.settings?.ai } },
        };
      },
    },
  ),
);

export function isExportFile(value: unknown): value is ExportFile {
  const v = value as ExportFile;
  return !!v && v.app === 'quiver' && Array.isArray(v.accounts) && Array.isArray(v.tasks);
}
