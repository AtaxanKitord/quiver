import { primaryCategory } from './analyzer';
import type { Analysis, CategoryId, Offering } from './types';

interface Guide {
  /** Lines the user should fill in or keep. Square brackets mark blanks. */
  ask: string[];
  /** What the answer should look like. */
  output: string[];
  /** Advice shown next to the recommendation. */
  tips: string[];
}

const GUIDES: Record<CategoryId, Guide> = {
  general: {
    ask: [],
    output: ['Answer directly first, then add detail only if it helps.'],
    tips: ['One clear question per message gets a sharper answer than several mixed together.'],
  },
  writing: {
    ask: ['Audience: [who will read it]', 'Tone: [e.g. warm, confident, playful]', 'Length: [e.g. 150 words]'],
    output: ['Give me 2 versions with different angles so I can choose.'],
    tips: [
      'Paste an example you like; matching a sample works better than describing a style.',
      'Ask for two or three versions, then mix the best parts.',
    ],
  },
  editing: {
    ask: ['Keep: [what must not change, e.g. my voice, key facts]', 'Goal: [e.g. shorter, more formal, clearer]'],
    output: ['Return the edited text, then a short list of what you changed and why.'],
    tips: ['Say what must stay the same; otherwise the AI may change your voice.'],
  },
  translation: {
    ask: ['Translate into: [language]', 'Audience: [who will read it]', 'Keep as-is: [names, brands, technical terms]'],
    output: ['Natural, not word-for-word. Flag anything that has no good equivalent.'],
    tips: ['Tell it the audience and purpose; a natural translation beats a literal one.'],
  },
  coding: {
    ask: ['Language / framework and version: [ ]', 'What I expected vs. what happens: [ ]', 'Exact error message: [paste it]'],
    output: ['Explain the cause first, then give the corrected code and how to test it.'],
    tips: [
      'Paste the exact error and the smallest piece of code that shows the problem.',
      'Say which versions you use; many bugs are version-specific.',
    ],
  },
  'agentic-coding': {
    ask: ['Repo / stack: [ ]', 'Done looks like: [what should work when finished]', 'How to check it: [tests, build command, page to open]'],
    output: ['Start by exploring the code and proposing a short plan before changing files. Run the checks when done.'],
    tips: [
      'Describe the goal and how to verify it, not just the steps.',
      'For big changes, ask for a plan first and approve it before any edits.',
    ],
  },
  research: {
    ask: ['Region / market: [if it matters]', 'Time frame: [e.g. the last 3 months]'],
    output: ['Cite sources with links and dates. Say when information may be outdated or uncertain.'],
    tips: ['Ask for sources with dates, and open the important ones yourself.'],
  },
  'deep-research': {
    ask: ['Scope: [what is in and out]', 'Questions the report must answer: [ ]', 'Region / time frame: [ ]'],
    output: ['Structure: executive summary, key findings, details, open questions, sources with links.'],
    tips: [
      'A deep research run takes several minutes and uses a lot of your limit; spend a minute on a precise brief.',
      'List the questions the report must answer, so it does not wander.',
    ],
  },
  reasoning: {
    ask: ['Known values / constraints: [ ]'],
    output: ['Work through it step by step, then check the final answer a second way.'],
    tips: ['Ask it to verify the answer a second way; it catches many slips.'],
  },
  data: {
    ask: ['The data: [attach the file or paste a sample with headers]', 'Question to answer: [ ]'],
    output: ['Give the answer first, then the method, and a chart if it helps.'],
    tips: ['Upload the actual file instead of pasting numbers, and say what each column means.'],
  },
  documents: {
    ask: ['Focus on: [what you need from the document]'],
    output: ['Quote the exact passages you rely on, with page or section numbers.'],
    tips: [
      'Upload the whole file rather than pasting parts of it.',
      'Ask for quotes with page numbers, so you can check claims quickly.',
    ],
  },
  image: {
    ask: ['Subject: [ ]', 'Style: [e.g. photo, flat illustration, 3D render]', 'Aspect ratio: [e.g. 1:1, 4:5, 16:9]', 'Colors: [ ]', 'Text in the image: ["exact words" or none]'],
    output: [],
    tips: [
      'Describe what you see, not what you want it to mean: subject, setting, light, style, framing.',
      'Iterate: change one thing at a time between versions.',
    ],
  },
  video: {
    ask: ['Length: [seconds]', 'Aspect ratio: [9:16 for reels, 16:9 for YouTube]', 'Camera / motion: [ ]', 'Mood and sound: [ ]'],
    output: [],
    tips: ['Write it like a shot list: subject, action, camera move, lighting and sound.'],
  },
  brainstorm: {
    ask: ['Goal: [ ]', 'Constraints: [budget, audience, things to avoid]'],
    output: ['Give 10 varied ideas, then pick your top 3 and explain why.'],
    tips: ['Ask for many ideas first, then ask it to critique and rank them.'],
  },
  learning: {
    ask: ['My level: [beginner / some experience / advanced]'],
    output: ['Explain with a concrete example, then ask me 2 short questions to check I understood.'],
    tips: ['Say your level, and ask it to quiz you at the end.'],
  },
  office: {
    ask: ['Audience and purpose: [ ]', 'Length: [number of slides or pages]', 'Style: [e.g. minimal, corporate]'],
    output: ['Start with an outline for me to approve, then build the full file.'],
    tips: ['Approve an outline first; restructuring a finished deck is much slower.'],
  },
};

/** A structured prompt built from the task. Square brackets are blanks for the user. */
export function buildPrompt(text: string, analysis: Analysis): string {
  const primary = primaryCategory(analysis);
  const guide = GUIDES[primary];
  const lines: string[] = [text.trim()];

  const details = [...guide.ask];
  if (analysis.hasFiles && !details.some((d) => /attach/i.test(d))) details.push('Files: [attach them to this message]');
  if (primary !== 'general') details.unshift('Context: [who this is for and anything already tried]');
  if (details.length) lines.push('', 'Details:', ...details.map((d) => `- ${d}`));

  const output = [...guide.output];
  if (analysis.needsWeb && primary !== 'research' && primary !== 'deep-research') {
    output.push('Use current information from the web and include links.');
  }
  if (analysis.quick) output.push('Keep it short.');
  if (output.length) lines.push('', 'Output:', ...output.map((o) => `- ${o}`));

  return lines.join('\n');
}

/** Advice for getting a better result with the chosen option. */
export function buildTips(analysis: Analysis, offering?: Offering): string[] {
  const primary = primaryCategory(analysis);
  const tips: string[] = [];
  if (offering?.where) tips.push(`Where to find it: ${offering.where}`);
  tips.push(...(offering?.tips ?? []));
  tips.push(...GUIDES[primary].tips);
  if (analysis.hasFiles && primary !== 'documents' && primary !== 'data') {
    tips.push('Attach the files directly; the AI reads them better than pasted text.');
  }
  if (analysis.complexity === 'high' && primary !== 'agentic-coding') {
    tips.push('For a big task, ask for an outline or plan first, then go part by part.');
  }
  if (analysis.language === 'fa') {
    tips.push('Writing in Persian is fine. Say clearly which language you want the answer in.');
  }
  return [...new Set(tips)].slice(0, 6);
}
