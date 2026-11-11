import type { Account, CategoryId, Offering, Plan, Provider } from './types';

/**
 * The built-in knowledge Quiver uses to recommend.
 *
 * Plans and model names were checked against each provider's official pages on the date below.
 * Scores (0-10) are editorial judgements of how well an option fits each kind of task. They are
 * meant to be argued with: if something is outdated or wrong, open an issue or a pull request.
 */
export const CATALOG_CHECKED = '2026-11-11';

type ModelInput = Omit<Offering, 'kind' | 'web' | 'files'> & Partial<Pick<Offering, 'web' | 'files'>>;

const model = (o: ModelInput): Offering => ({ kind: 'model', web: true, files: true, ...o });
const mode = (o: ModelInput): Offering => ({ kind: 'mode', web: false, files: true, ...o });

const plan = (id: string, name: string, price: string, usage: Plan['usage'], note?: string): Plan => ({
  id,
  name,
  price,
  usage,
  note,
});

export const PROVIDERS: Provider[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    maker: 'OpenAI',
    monogram: 'CG',
    url: 'https://chatgpt.com/',
    blurb: 'The all-rounder: strong reasoning, images, deep research and the Codex coding agent.',
    sources: [
      'https://chatgpt.com/pricing/',
      'https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt',
    ],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('go', 'Go', '$8/mo', 2, 'More messages, uploads and images than Free. No GPT-6.'),
      plan('plus', 'Plus', '$20/mo', 3),
      plan('pro', 'Pro', 'from $100/mo', 5, 'Three usage tiers: $100, $200 and $500.'),
    ],
    offerings: [
      model({
        id: 'gpt-5.6-luna',
        name: 'GPT-5.6 Luna',
        summary: 'The fast default on Free and Go. Pick Think for harder questions.',
        plans: ['free', 'go'],
        scores: {
          general: 8, writing: 7, editing: 7.5, translation: 7.5, coding: 6.5, research: 7, reasoning: 6.5,
          data: 6, documents: 6, brainstorm: 7.5, learning: 7.5, office: 6,
        },
        speed: 3,
        weight: 1,
        where: 'Default model. Choose Think in the composer for harder questions.',
      }),
      model({
        id: 'gpt-6-instant',
        name: 'GPT-6 · Instant',
        summary: 'Fast answers from the current flagship.',
        plans: ['plus', 'pro'],
        scores: {
          general: 9, writing: 8, editing: 8.5, translation: 8.5, coding: 7.5, research: 8, reasoning: 7,
          data: 7.5, documents: 7.5, brainstorm: 8.5, learning: 8.5, office: 7.5,
        },
        speed: 3,
        weight: 1,
        where: 'Model menu → GPT-6, thinking level Instant.',
      }),
      model({
        id: 'gpt-6-thinking',
        name: 'GPT-6 · Thinking',
        summary: 'GPT-6 with Medium or High thinking (Extra High on Pro) for harder work.',
        plans: ['plus', 'pro'],
        scores: {
          general: 7.5, writing: 8.5, editing: 8.5, translation: 8.5, coding: 9, research: 9, reasoning: 9.3,
          data: 9, documents: 8.8, brainstorm: 8.5, learning: 9, office: 8.5,
        },
        speed: 2,
        weight: 2,
        where: 'Model menu → GPT-6, thinking level High (Extra High on Pro).',
        tips: ['Raise the thinking level only for hard problems; it is slower and uses more of your limit.'],
      }),
      model({
        id: 'gpt-6-pro',
        name: 'GPT-6 Pro (Astra)',
        summary: 'OpenAI’s top reasoning tier for the hardest problems and long workflows.',
        plans: ['pro'],
        scores: {
          writing: 8.8, editing: 8.6, translation: 8.6, coding: 9.5, research: 9.3, reasoning: 10, data: 9.5,
          documents: 9.3, brainstorm: 9, learning: 9, office: 8.6,
        },
        speed: 1,
        weight: 3,
        where: 'Model menu → GPT-6, thinking level Pro.',
        tips: ['GPT-6 Pro has its own weekly allowance. Save it for work that really needs it.'],
      }),
      mode({
        id: 'deep-research',
        name: 'Deep research',
        summary: 'Browses many sources and writes a cited report. Limited on Free and Go.',
        plans: ['free', 'go', 'plus', 'pro'],
        scores: { 'deep-research': 9.3, research: 8 },
        speed: 1,
        weight: 3,
        web: true,
        where: 'Composer → + → Deep research.',
        tips: ['Answer its clarifying questions carefully; they shape the whole report.'],
      }),
      mode({
        id: 'images',
        name: 'ChatGPT Images',
        summary: 'Image creation and editing inside the chat. Better quality from Plus up.',
        plans: ['free', 'go', 'plus', 'pro'],
        scores: { image: 9 },
        speed: 2,
        weight: 2,
        where: 'Ask for an image in the chat, or open Images in the sidebar.',
        tips: ['Put any text that must appear in the image in quotes, spelled exactly.'],
      }),
      mode({
        id: 'codex',
        name: 'Codex',
        summary: 'OpenAI’s coding agent. Works in your repo from the web, desktop app or CLI.',
        plans: ['free', 'go', 'plus', 'pro'],
        scores: { 'agentic-coding': 9.3, coding: 8.6 },
        speed: 2,
        weight: 2,
        where: 'chatgpt.com/codex, the ChatGPT desktop app or the Codex CLI.',
        tips: ['Connect the GitHub repo and say how to check the result, for example which tests to run.'],
      }),
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    maker: 'Anthropic',
    monogram: 'CL',
    url: 'https://claude.ai/new',
    blurb: 'Excellent writer and coder, with Claude Code for real projects and long-context reading.',
    sources: ['https://claude.com/pricing'],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('pro', 'Pro', '$20/mo', 3, 'Fable is available but paid with extra usage credits.'),
      plan('max', 'Max', '$100/mo', 4, '5x Pro usage. Fable up to half of the weekly limit.'),
      plan('ultra', 'Ultra', '$200/mo', 5, '10x Pro weekly usage and no 5-hour limit.'),
    ],
    offerings: [
      model({
        id: 'haiku-5.5',
        name: 'Haiku 5.5',
        summary: 'The fastest, lightest Claude. Good for quick everyday work.',
        plans: ['free', 'pro', 'max', 'ultra'],
        scores: {
          general: 8.5, writing: 7.5, editing: 8, translation: 8, coding: 7.5, research: 7, reasoning: 7,
          data: 7, documents: 7.5, brainstorm: 7.5, learning: 8, office: 7,
        },
        speed: 3,
        weight: 1,
        where: 'Model menu → Haiku.',
      }),
      model({
        id: 'sonnet-5.5',
        name: 'Sonnet 5.5',
        summary: 'The balanced default: great writing and coding at good speed.',
        plans: ['free', 'pro', 'max', 'ultra'],
        scores: {
          general: 8.5, writing: 9.2, editing: 9.2, translation: 8.7, coding: 9.2, research: 8.3, reasoning: 8.7,
          data: 8.5, documents: 9, brainstorm: 9, learning: 9, office: 8.7,
        },
        speed: 2,
        weight: 2,
        where: 'Model menu → Sonnet. Turn on extended thinking for tricky problems.',
      }),
      model({
        id: 'opus-5.5',
        name: 'Opus 5.5',
        summary: 'Claude’s most capable everyday model for complex writing, code and analysis.',
        plans: ['pro', 'max', 'ultra'],
        scores: {
          general: 7.5, writing: 9.5, editing: 9.4, translation: 9, coding: 9.6, research: 8.7, reasoning: 9.4,
          data: 9, documents: 9.4, brainstorm: 9.3, learning: 9.2, office: 9,
        },
        speed: 2,
        weight: 3,
        where: 'Model menu → Opus.',
        tips: ['Opus uses your limit faster than Sonnet; keep it for work where quality matters most.'],
      }),
      model({
        id: 'fable-5.2',
        name: 'Fable 5.2',
        summary: 'Anthropic’s top model, for the hardest and longest tasks.',
        plans: ['max', 'ultra'],
        scores: {
          writing: 9.6, editing: 9.4, translation: 9.1, coding: 9.8, research: 9, reasoning: 9.8, data: 9.3,
          documents: 9.5, brainstorm: 9.5, learning: 9.3, office: 9.1,
        },
        speed: 1,
        weight: 3,
        where: 'Model menu → Fable.',
        tips: ['Fable can use up to half of your weekly limit. Save it for your hardest work.'],
      }),
      mode({
        id: 'research',
        name: 'Research',
        summary: 'Claude searches widely and writes a cited report.',
        plans: ['pro', 'max', 'ultra'],
        scores: { 'deep-research': 9, research: 8.5 },
        speed: 1,
        weight: 3,
        web: true,
        where: 'Composer → turn on Research.',
      }),
      mode({
        id: 'claude-code',
        name: 'Claude Code',
        summary: 'Anthropic’s coding agent in your terminal, IDE, desktop app or browser.',
        plans: ['pro', 'max', 'ultra'],
        scores: { 'agentic-coding': 9.7, coding: 8.8 },
        speed: 2,
        weight: 2,
        where: 'claude.ai/code, the Claude desktop app, or `claude` in your terminal.',
        tips: [
          'For bigger changes, ask it to propose a plan before it edits files.',
          'Give it a way to check its work: tests, a build command or a screenshot.',
        ],
      }),
      mode({
        id: 'docs-slides',
        name: 'Claude Docs, Slides & Design',
        summary: 'Creates documents, decks and visual designs you can edit and share.',
        plans: ['free', 'pro', 'max', 'ultra'],
        scores: { office: 9.2 },
        speed: 2,
        weight: 2,
        where: 'Ask for a doc, a deck or a design in the chat.',
      }),
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    maker: 'Google',
    monogram: 'GE',
    url: 'https://gemini.google.com/app',
    blurb: 'Huge file uploads, great images and video, and deep links into Google apps.',
    sources: ['https://gemini.google/subscriptions/'],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('plus', 'Google AI Plus', '$4.99/mo', 2, 'About 2x Free usage. Adds the Flash model and video.'),
      plan('pro', 'Google AI Pro', '$19.99/mo', 3, 'About 4x Free usage. Adds Gemini 4 Argon and the Pro model.'),
      plan('ultra', 'Google AI Ultra', 'from $99.99/mo', 5, 'Adds Gemini 4 Carbon. 5x or 20x Pro usage.'),
    ],
    offerings: [
      model({
        id: 'flash-lite',
        name: 'Gemini Flash-Lite',
        summary: 'The light, fast model on the Free plan.',
        plans: ['free'],
        scores: {
          general: 8, writing: 6.5, editing: 7, translation: 7.5, coding: 6, research: 7.5, reasoning: 6, data: 6,
          documents: 7, brainstorm: 7, learning: 7, office: 6,
        },
        speed: 3,
        weight: 1,
      }),
      model({
        id: 'flash',
        name: 'Gemini Flash',
        summary: 'Fast and capable; most of the paid-plan allowance goes here.',
        plans: ['plus', 'pro', 'ultra'],
        scores: {
          general: 9, writing: 7.8, editing: 8, translation: 8.5, coding: 8, research: 8.5, reasoning: 8, data: 8,
          documents: 8.5, brainstorm: 8, learning: 8.5, office: 7.5,
        },
        speed: 3,
        weight: 1,
        where: 'Model menu → Fast / Flash.',
      }),
      model({
        id: 'pro-3.1',
        name: 'Gemini 3.1 Pro',
        summary: 'Google’s Pro model, strong with very long files.',
        plans: ['pro', 'ultra'],
        scores: {
          general: 7.5, writing: 8.5, editing: 8.5, translation: 8.8, coding: 8.8, research: 8.8, reasoning: 9,
          data: 8.8, documents: 9.4, brainstorm: 8.5, learning: 9, office: 8,
        },
        speed: 2,
        weight: 2,
        where: 'Model menu → Pro.',
      }),
      model({
        id: 'argon',
        name: 'Gemini 4 Argon',
        summary: 'The newest Gemini 4 model on Pro and Ultra.',
        plans: ['pro', 'ultra'],
        scores: {
          general: 8, writing: 9, editing: 9, translation: 9, coding: 9.3, research: 9.2, reasoning: 9.4, data: 9.2,
          documents: 9.6, brainstorm: 9, learning: 9.2, office: 8.5,
        },
        speed: 2,
        weight: 3,
        where: 'Model menu → Gemini 4 Argon.',
        tips: ['Upload whole files (up to about 1,500 pages) instead of pasting excerpts.'],
      }),
      model({
        id: 'carbon',
        name: 'Gemini 4 Carbon',
        summary: 'Google’s most capable model, only on Ultra.',
        plans: ['ultra'],
        scores: {
          writing: 9.2, editing: 9.1, translation: 9.2, coding: 9.6, research: 9.4, reasoning: 9.8, data: 9.5,
          documents: 9.7, brainstorm: 9.3, learning: 9.3, office: 8.8,
        },
        speed: 1,
        weight: 3,
        where: 'Model menu → Gemini 4 Carbon.',
      }),
      mode({
        id: 'deep-research',
        name: 'Deep Research',
        summary: 'Builds a research plan, reads many sources and writes a report.',
        plans: ['free', 'plus', 'pro', 'ultra'],
        scores: { 'deep-research': 9.2, research: 8.5 },
        speed: 1,
        weight: 3,
        web: true,
        where: 'Tools → Deep Research.',
        tips: ['Review and edit the research plan before it starts.'],
      }),
      mode({
        id: 'images',
        name: 'Images (Nano Banana)',
        summary: 'Very good at editing photos and keeping a character or product consistent.',
        plans: ['free', 'plus', 'pro', 'ultra'],
        scores: { image: 9.3 },
        speed: 2,
        weight: 2,
        where: 'Tools → Create images, or upload a photo and describe the edit.',
        tips: ['For edits, upload the photo and say exactly what to change and what to keep.'],
      }),
      mode({
        id: 'video',
        name: 'Video generation',
        summary: 'Text or image to video with Google’s video models; more in Google Flow.',
        plans: ['plus', 'pro', 'ultra'],
        scores: { video: 9.3 },
        speed: 1,
        weight: 3,
        where: 'Tools → Create videos, or Google Flow for longer scenes.',
        tips: ['Describe the shot like a director: subject, action, camera move, lighting and sound.'],
      }),
      mode({
        id: 'antigravity',
        name: 'Google Antigravity',
        summary: 'Google’s agentic development platform for real projects.',
        plans: ['pro', 'ultra'],
        scores: { 'agentic-coding': 8.8, coding: 8 },
        speed: 2,
        weight: 2,
      }),
      mode({
        id: 'notebook',
        name: 'Gemini Notebook',
        summary: 'A research and writing assistant grounded in the sources you add.',
        plans: ['free', 'plus', 'pro', 'ultra'],
        scores: { documents: 9.3, learning: 8.8 },
        speed: 2,
        weight: 1,
        tips: ['Add all your sources first, then ask questions; answers cite your own files.'],
      }),
      mode({
        id: 'workspace',
        name: 'Gemini in Gmail & Docs',
        summary: 'Works inside Gmail, Docs, Sheets and Vids.',
        plans: ['plus', 'pro', 'ultra'],
        scores: { office: 8.5, data: 7.5 },
        speed: 3,
        weight: 1,
      }),
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    maker: 'SpaceXSI (xAI)',
    monogram: 'GR',
    url: 'https://grok.com/',
    blurb: 'Real-time X and web data, images and video with Imagine, and Grok Build for code.',
    sources: ['https://x.ai/pricing'],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('plus', 'Plus', '$8/mo', 2),
      plan('premium', 'Premium', '$30/mo', 3, '4x Plus usage, latest Grok models, images and video.'),
      plan('super', 'Super', '$100/mo', 4, '15x Plus usage.'),
      plan('ultra', 'Ultra', '$200/mo', 5, '50x Plus usage.'),
    ],
    offerings: [
      model({
        id: 'grok-fast',
        name: 'Grok',
        summary: 'Grok on the Free and Plus plans.',
        plans: ['free', 'plus'],
        scores: {
          general: 8, writing: 7.5, editing: 7.5, translation: 7.5, coding: 7.5, research: 8.5, reasoning: 7.5,
          data: 7, documents: 7, brainstorm: 8, learning: 7.5, office: 6.5,
        },
        speed: 3,
        weight: 1,
        tips: ['Grok is especially good at what people are saying on X right now.'],
      }),
      model({
        id: 'grok-4.7',
        name: 'Grok 4.7',
        summary: 'The latest Grok model on Premium and up.',
        plans: ['premium', 'super', 'ultra'],
        scores: {
          general: 8.5, writing: 8.5, editing: 8.5, translation: 8.5, coding: 9, research: 9.2, reasoning: 9.2,
          data: 8.5, documents: 8.5, brainstorm: 8.8, learning: 8.5, office: 7.5,
        },
        speed: 2,
        weight: 2,
        tips: ['Grok is especially good at what people are saying on X right now.'],
      }),
      mode({
        id: 'imagine',
        name: 'Grok Imagine (images)',
        summary: 'Image generation in Grok.',
        plans: ['plus', 'premium', 'super', 'ultra'],
        scores: { image: 8.5 },
        speed: 3,
        weight: 2,
      }),
      mode({
        id: 'imagine-video',
        name: 'Grok Imagine (video)',
        summary: 'Short video clips; 1080p and 15 seconds from Super up.',
        plans: ['premium', 'super', 'ultra'],
        scores: { video: 8.8 },
        speed: 2,
        weight: 3,
      }),
      mode({
        id: 'build',
        name: 'Grok Build',
        summary: 'Grok’s coding agent. Shares the usage pool with Cursor.',
        plans: ['plus', 'premium', 'super', 'ultra'],
        scores: { 'agentic-coding': 8.7, coding: 8 },
        speed: 2,
        weight: 2,
      }),
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    maker: 'Perplexity',
    monogram: 'PX',
    url: 'https://www.perplexity.ai/',
    blurb: 'Answers with sources. The specialist for anything that needs the web.',
    sources: ['https://www.perplexity.ai/help-center/en/articles/10354919-what-advanced-ai-models-are-included-in-my-subscription'],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('pro', 'Pro', '$20/mo', 3),
      plan('max', 'Max', '$200/mo', 5),
    ],
    offerings: [
      model({
        id: 'search',
        name: 'Search (Best)',
        summary: 'Fast cited answers; Perplexity picks the model.',
        plans: ['free', 'pro', 'max'],
        scores: { general: 8.5, research: 9.5, learning: 8, brainstorm: 7, writing: 6.5, documents: 7 },
        speed: 3,
        weight: 1,
        tips: ['Ask follow-ups in the same thread to narrow the answer down.'],
      }),
      model({
        id: 'pro-search',
        name: 'Pro Search · frontier models',
        summary: 'Choose GPT, Claude, Gemini or Grok models inside Perplexity, with search.',
        plans: ['pro', 'max'],
        scores: {
          general: 8.5, research: 9.6, reasoning: 8.5, writing: 8, editing: 7.5, translation: 8, coding: 7.5,
          data: 7.5, documents: 8.3, learning: 8.5, brainstorm: 8,
        },
        speed: 2,
        weight: 2,
        where: 'Model picker next to the search box.',
      }),
      mode({
        id: 'research',
        name: 'Research mode',
        summary: 'Runs many searches and writes a sourced report. Limited on Free.',
        plans: ['free', 'pro', 'max'],
        scores: { 'deep-research': 9.2, research: 9 },
        speed: 1,
        weight: 3,
        web: true,
        where: 'Search box → Research.',
      }),
    ],
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    maker: 'Microsoft',
    monogram: 'MC',
    url: 'https://copilot.microsoft.com/',
    blurb: 'Best when your work lives in Word, Excel, PowerPoint and Outlook.',
    sources: ['https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/individuals'],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('m365', 'Microsoft 365 Personal / Family', 'from $9.99/mo', 2, 'Copilot inside the Office apps, with limits.'),
      plan('premium', 'Microsoft 365 Premium', '$19.99/mo', 4, 'Highest limits plus Researcher and Analyst agents.'),
    ],
    offerings: [
      model({
        id: 'chat',
        name: 'Copilot chat',
        summary: 'Microsoft’s everyday assistant on the web, Windows and mobile.',
        plans: ['free', 'm365', 'premium'],
        scores: {
          general: 8, writing: 7.5, editing: 7.5, translation: 7.5, coding: 7, research: 8, reasoning: 7.5,
          data: 6.5, documents: 7, brainstorm: 7.5, learning: 8, office: 7,
        },
        speed: 3,
        weight: 1,
      }),
      mode({
        id: 'office',
        name: 'Copilot in Word, Excel & PowerPoint',
        summary: 'Works on the open document, workbook or deck.',
        plans: ['m365', 'premium'],
        scores: { office: 9.3, data: 8.5, documents: 8, editing: 8 },
        speed: 2,
        weight: 2,
        where: 'Open the file in the Office app and click Copilot.',
        tips: ['Run it inside the Office app so it can see the whole file.'],
      }),
      mode({
        id: 'researcher',
        name: 'Researcher agent',
        summary: 'Multi-step research across the web and your files.',
        plans: ['premium'],
        scores: { 'deep-research': 8.7, research: 8.5 },
        speed: 1,
        weight: 3,
        web: true,
      }),
      mode({
        id: 'analyst',
        name: 'Analyst agent',
        summary: 'Reasons over data files and writes analysis.',
        plans: ['premium'],
        scores: { data: 9, reasoning: 8 },
        speed: 1,
        weight: 3,
      }),
      mode({
        id: 'images',
        name: 'Image creation',
        summary: 'Create images from the chat.',
        plans: ['free', 'm365', 'premium'],
        scores: { image: 7.5 },
        speed: 2,
        weight: 2,
      }),
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    maker: 'DeepSeek',
    monogram: 'DS',
    url: 'https://chat.deepseek.com/',
    blurb: 'Free and strong at math and code. Text only.',
    sources: ['https://chat.deepseek.com/'],
    plans: [plan('free', 'Free', '$0', 3, 'The chat app is free.')],
    offerings: [
      model({
        id: 'instant',
        name: 'DeepSeek · Instant',
        summary: 'Fast answers from DeepSeek’s V4 models.',
        plans: ['free'],
        scores: {
          general: 8, writing: 7.3, editing: 7.3, translation: 7.5, coding: 8, research: 7.5, reasoning: 8, data: 7,
          documents: 7, brainstorm: 7.5, learning: 8, office: 6,
        },
        speed: 3,
        weight: 1,
        where: 'Default mode. Turn on Search for current information.',
      }),
      model({
        id: 'deepthink',
        name: 'DeepSeek · DeepThink',
        summary: 'Step-by-step reasoning; strong at math and code.',
        plans: ['free'],
        scores: {
          general: 7, writing: 7.8, editing: 7.8, translation: 8, coding: 8.9, research: 8, reasoning: 9.2, data: 8,
          documents: 7.8, brainstorm: 8, learning: 8.5, office: 6.5,
        },
        speed: 2,
        weight: 2,
        where: 'Turn on DeepThink under the message box.',
      }),
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral Le Chat',
    maker: 'Mistral AI',
    monogram: 'MI',
    url: 'https://chat.mistral.ai/',
    blurb: 'Very fast answers, strong in European languages, plus the Vibe coding agent.',
    sources: ['https://mistral.ai/pricing/'],
    plans: [plan('free', 'Free', '$0', 1), plan('pro', 'Pro', '$14.99/mo', 3)],
    offerings: [
      model({
        id: 'medium-3.5',
        name: 'Mistral Medium 3.5',
        summary: 'The default Le Chat model.',
        plans: ['free', 'pro'],
        scores: {
          general: 8.5, writing: 7.8, editing: 8, translation: 8.7, coding: 8, research: 8, reasoning: 7.8, data: 7.5,
          documents: 7.8, brainstorm: 7.8, learning: 8, office: 7,
        },
        speed: 3,
        weight: 1,
      }),
      mode({
        id: 'deep-research',
        name: 'Deep research',
        summary: 'Sourced research reports. More on Pro.',
        plans: ['free', 'pro'],
        scores: { 'deep-research': 8.3, research: 8 },
        speed: 1,
        weight: 3,
        web: true,
      }),
      mode({
        id: 'vibe',
        name: 'Mistral Vibe',
        summary: 'Mistral’s coding agent and CLI.',
        plans: ['pro'],
        scores: { 'agentic-coding': 8.3, coding: 7.8 },
        speed: 2,
        weight: 2,
      }),
    ],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    maker: 'GitHub',
    monogram: 'GH',
    url: 'https://github.com/copilot',
    blurb: 'Coding help inside your editor and on GitHub, with many models to choose from.',
    sources: ['https://docs.github.com/en/copilot/get-started/plans'],
    plans: [
      plan('free', 'Free', '$0', 1),
      plan('pro', 'Pro', '$10/mo', 2),
      plan('pro-plus', 'Pro+', '$39/mo', 4),
      plan('max', 'Max', '$100/mo', 5),
    ],
    offerings: [
      mode({
        id: 'chat',
        name: 'Copilot Chat',
        summary: 'Code help in VS Code, JetBrains and on github.com.',
        plans: ['free', 'pro', 'pro-plus', 'max'],
        scores: { coding: 8.5, learning: 7 },
        speed: 3,
        weight: 1,
        tips: ['Open the files you are asking about so Copilot has them as context.'],
      }),
      mode({
        id: 'agent',
        name: 'Copilot agent',
        summary: 'Agent mode in the editor and the cloud coding agent on GitHub.',
        plans: ['pro', 'pro-plus', 'max'],
        scores: { 'agentic-coding': 9, coding: 8.6 },
        speed: 2,
        weight: 2,
        tips: ['Write the issue like a ticket: goal, files involved and how to test it.'],
      }),
      mode({
        id: 'premium-models',
        name: 'Copilot with premium models',
        summary: 'Top Claude, GPT and Gemini models, paid from your monthly credits.',
        plans: ['pro-plus', 'max'],
        scores: { 'agentic-coding': 9.3, coding: 9.4 },
        speed: 2,
        weight: 3,
      }),
    ],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    maker: 'Midjourney',
    monogram: 'MJ',
    url: 'https://www.midjourney.com/imagine',
    blurb: 'The artist: the most striking, stylised images, plus short videos.',
    sources: ['https://docs.midjourney.com/'],
    plans: [
      plan('basic', 'Basic', '$10/mo', 2),
      plan('standard', 'Standard', '$30/mo', 3),
      plan('pro', 'Pro', '$60/mo', 4),
      plan('mega', 'Mega', '$120/mo', 5),
    ],
    offerings: [
      mode({
        id: 'image',
        name: 'Midjourney images',
        summary: 'Artistic, high-end image generation with style references.',
        plans: ['basic', 'standard', 'pro', 'mega'],
        scores: { image: 9.5 },
        speed: 2,
        weight: 1,
        tips: ['Keep prompts visual: subject, medium, lighting, lens and mood. Use --ar for the aspect ratio.'],
      }),
      mode({
        id: 'video',
        name: 'Midjourney video',
        summary: 'Animate your images into short clips.',
        plans: ['basic', 'standard', 'pro', 'mega'],
        scores: { video: 8 },
        speed: 2,
        weight: 3,
      }),
    ],
  },
];

export const PROVIDER_BY_ID: Record<string, Provider> = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

export const CUSTOM_PROVIDER_ID = 'custom';

export function getProvider(id: string): Provider | undefined {
  return PROVIDER_BY_ID[id];
}

export function getPlan(providerId: string, planId: string): Plan | undefined {
  return PROVIDER_BY_ID[providerId]?.plans.find((p) => p.id === planId);
}

/** A synthetic offering for an AI the user added by hand. */
function customOffering(account: Account): Offering {
  const scores: Partial<Record<CategoryId, number>> = { general: 6.5 };
  for (const c of account.custom?.categories ?? []) scores[c] = 8.5;
  return {
    id: 'custom',
    name: account.custom?.name ?? 'Custom AI',
    kind: 'model',
    summary: 'An AI you added yourself.',
    plans: [account.planId],
    scores,
    speed: 2,
    weight: 2,
    web: true,
    files: true,
  };
}

/** Everything the account's plan lets the user pick. */
export function offeringsFor(account: Account): Offering[] {
  if (account.providerId === CUSTOM_PROVIDER_ID) return [customOffering(account)];
  const provider = PROVIDER_BY_ID[account.providerId];
  if (!provider) return [];
  return provider.offerings.filter((o) => o.plans.includes(account.planId));
}

export function getOffering(account: Account, offeringId: string): Offering | undefined {
  return offeringsFor(account).find((o) => o.id === offeringId);
}

export function accountName(account: Account): string {
  if (account.providerId === CUSTOM_PROVIDER_ID) return account.custom?.name ?? 'Custom AI';
  return PROVIDER_BY_ID[account.providerId]?.name ?? account.providerId;
}

export function accountUrl(account: Account): string | undefined {
  if (account.providerId === CUSTOM_PROVIDER_ID) return account.custom?.url;
  return PROVIDER_BY_ID[account.providerId]?.url;
}

export function planName(account: Account): string {
  if (account.providerId === CUSTOM_PROVIDER_ID) return 'Custom';
  return getPlan(account.providerId, account.planId)?.name ?? account.planId;
}

export function planUsage(account: Account): number {
  if (account.providerId === CUSTOM_PROVIDER_ID) return 3;
  return getPlan(account.providerId, account.planId)?.usage ?? 3;
}

export function monogram(account: Account): string {
  if (account.providerId === CUSTOM_PROVIDER_ID) {
    return (account.custom?.name ?? 'AI').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || 'AI';
  }
  return PROVIDER_BY_ID[account.providerId]?.monogram ?? '??';
}
