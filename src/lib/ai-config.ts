import type { AISettings } from '../store';

// Kept apart from ai.ts so the Claude SDK only downloads when AI assist is actually used.

export const DEFAULT_MODEL = 'claude-opus-5-5';

export function aiReady(s: AISettings): boolean {
  return s.enabled && s.apiKey.trim().length > 20;
}
