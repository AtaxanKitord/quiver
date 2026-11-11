export type CategoryId =
  | 'general'
  | 'writing'
  | 'editing'
  | 'translation'
  | 'coding'
  | 'agentic-coding'
  | 'research'
  | 'deep-research'
  | 'reasoning'
  | 'data'
  | 'documents'
  | 'image'
  | 'video'
  | 'brainstorm'
  | 'learning'
  | 'office';

export type Complexity = 'low' | 'medium' | 'high';
export type Level = 1 | 2 | 3;

/** A subscription tier of a provider, e.g. ChatGPT Plus. */
export interface Plan {
  id: string;
  name: string;
  price: string;
  /** How much headroom the plan gives within its provider: 1 = tight free limits, 5 = the most. */
  usage: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

/** Something you can pick inside a provider's app: a model, or a mode such as Deep research. */
export interface Offering {
  id: string;
  name: string;
  kind: 'model' | 'mode';
  summary: string;
  /** Plan ids that include this offering. */
  plans: string[];
  /** 0-10 fit per task type. A missing category means "not made for this". */
  scores: Partial<Record<CategoryId, number>>;
  /** 3 = fastest. */
  speed: Level;
  /** How much of your usage limit it burns. 3 = heavy. */
  weight: Level;
  /** Can it search the web? */
  web: boolean;
  /** Can it read files you upload? */
  files: boolean;
  /** Where to find it in the app. */
  where?: string;
  tips?: string[];
}

export interface Provider {
  id: string;
  name: string;
  maker: string;
  monogram: string;
  /** Where a new chat starts. */
  url: string;
  blurb: string;
  plans: Plan[];
  offerings: Offering[];
  /** Official pages the data was checked against. */
  sources: string[];
}

export interface CustomAI {
  name: string;
  url?: string;
  categories: CategoryId[];
}

/** One of the user's own AI accounts. */
export interface Account {
  id: string;
  providerId: string;
  planId: string;
  label: string;
  /** Epoch ms. While in the future, the account is skipped. */
  limitedUntil?: number;
  custom?: CustomAI;
  createdAt: number;
}

export interface WeightedCategory {
  id: CategoryId;
  weight: number;
}

export interface Analysis {
  /** Sorted by weight, weights add up to 1. The first one is the main category. */
  categories: WeightedCategory[];
  needsWeb: boolean;
  hasFiles: boolean;
  quick: boolean;
  highStakes: boolean;
  complexity: Complexity;
  language: 'en' | 'fa' | 'other';
  source: 'rules' | 'ai';
}

/** Manual corrections the user makes to the automatic analysis. */
export interface AnalysisOverrides {
  category?: CategoryId;
  needsWeb?: boolean;
  hasFiles?: boolean;
  quick?: boolean;
  highStakes?: boolean;
  complexity?: Complexity;
}

export interface ScoredOption {
  key: string;
  accountId: string;
  providerId: string;
  planId: string;
  offeringId: string;
  /** 0-100 */
  match: number;
  reasons: string[];
  warnings: string[];
}

export interface Unavailable {
  accountId: string;
  until: number;
}

export interface Recommendation {
  ranked: ScoredOption[];
  top?: ScoredOption;
  alternatives: ScoredOption[];
  unavailable: Unavailable[];
}

export type TaskStatus = 'todo' | 'sent' | 'done';

export interface Task {
  id: string;
  text: string;
  createdAt: number;
  status: TaskStatus;
  analysis: Analysis;
  pick?: ScoredOption;
  prompt?: string;
  sentAt?: number;
  doneAt?: number;
  rating?: 'good' | 'bad';
}

/** Extra signal from the optional AI analysis. */
export interface AIHints {
  ranking: string[];
  reasons: Record<string, string>;
}
