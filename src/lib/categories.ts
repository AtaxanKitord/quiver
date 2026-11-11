import type { CategoryId } from './types';

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  /** Used in sentences like "Strong at ...". */
  skill: string;
  blurb: string;
  /** Words that point to this kind of task. English and Persian. */
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'agentic-coding',
    label: 'Build in a codebase',
    short: 'Codebase',
    skill: 'working across a codebase',
    blurb: 'Apps, websites and changes across many files',
    keywords: [
      'codebase', 'repo', 'repository', 'my project', 'web app', 'mobile app', 'build an app', 'build a website',
      'create a website', 'make a website', 'full-stack', 'full stack', 'multiple files', 'across files', 'new feature',
      'add a feature', 'migrate', 'migration', 'pull request', 'saas', 'landing page', 'deploy', 'refactor the',
      'اپلیکیشن', 'وب سایت', 'وبسایت', 'سایت بساز', 'سایت طراحی', 'ریپازیتوری', 'پروژه برنامه نویسی',
    ],
  },
  {
    id: 'coding',
    label: 'Coding & debugging',
    short: 'Coding',
    skill: 'coding and debugging',
    blurb: 'Write, fix or explain code',
    keywords: [
      'code', 'coding', 'bug', 'debug', 'error', 'exception', 'stack trace', 'traceback', 'function', 'python',
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'java', 'c#', 'c++', 'rust', 'golang', 'sql',
      'regex', 'api', 'endpoint', 'compile', 'refactor', 'unit test', 'html', 'css', 'tailwind', 'npm', 'docker',
      'kotlin', 'swift', 'php', 'laravel', 'django', 'flask', 'flutter', 'json', 'yaml', 'git', 'bash', 'powershell',
      'algorithm', 'class', 'variable', 'script', 'wordpress', 'shopify liquid',
      'کد', 'برنامه نویسی', 'باگ', 'ارور', 'اسکریپت', 'پایتون', 'جاوااسکریپت', 'تابع', 'دیباگ',
    ],
  },
  {
    id: 'deep-research',
    label: 'Deep research report',
    short: 'Deep research',
    skill: 'deep research reports',
    blurb: 'A sourced, multi-page report on a topic',
    keywords: [
      'deep research', 'in-depth', 'in depth', 'comprehensive report', 'market research', 'literature review',
      'full report', 'detailed report', 'research report', 'competitive analysis', 'competitor analysis',
      'competitors', 'industry analysis', 'state of the', 'whitepaper', 'due diligence', 'market size',
      'تحقیق کامل', 'گزارش جامع', 'تحلیل بازار', 'تحقیق بازار', 'رقبا', 'تحقیق عمیق',
    ],
  },
  {
    id: 'research',
    label: 'Web research',
    short: 'Research',
    skill: 'web research',
    blurb: 'Current facts, prices, news and comparisons',
    keywords: [
      'latest', 'news', 'today', 'current', 'right now', 'this week', 'this month', 'price', 'prices', 'how much does',
      'compare', 'comparison', 'versus', 'vs', 'best', 'reviews', 'look up', 'find out', 'sources', 'trend', 'trending',
      'what happened', 'stock', 'weather', 'release date', 'recent', 'up to date', 'search the web',
      'جدیدترین', 'اخبار', 'امروز', 'قیمت', 'مقایسه', 'بهترین', 'ترند', 'آخرین',
    ],
  },
  {
    id: 'reasoning',
    label: 'Math & hard problems',
    short: 'Reasoning',
    skill: 'math and hard problems',
    blurb: 'Math, logic, science and tricky decisions',
    keywords: [
      'math', 'equation', 'solve', 'prove', 'proof', 'calculate', 'calculation', 'probability', 'statistics',
      'logic', 'puzzle', 'physics', 'chemistry', 'step by step', 'theorem', 'integral', 'derivative', 'riddle',
      'optimize', 'optimise', 'trade-off', 'tradeoff', 'decide between', 'which is better',
      'ریاضی', 'معادله', 'حل کن', 'اثبات', 'محاسبه', 'احتمال', 'فیزیک', 'شیمی', 'منطق',
    ],
  },
  {
    id: 'data',
    label: 'Data & spreadsheets',
    short: 'Data',
    skill: 'data analysis',
    blurb: 'Analyse tables, CSV and Excel, make charts',
    keywords: [
      'spreadsheet', 'excel', 'csv', 'data', 'dataset', 'chart', 'graph', 'plot', 'pivot', 'google sheets',
      'dashboard', 'table', 'kpi', 'sales data', 'visualize', 'visualise', 'formula', 'vlookup', 'xlsx',
      'اکسل', 'داده', 'دیتا', 'نمودار', 'جدول', 'آمار', 'فرمول',
    ],
  },
  {
    id: 'documents',
    label: 'Long documents & PDFs',
    short: 'Documents',
    skill: 'long documents',
    blurb: 'Read, summarise and question big files',
    keywords: [
      'pdf', 'document', 'contract', 'paper', 'research paper', 'book', 'pages', 'transcript', 'summarize',
      'summarise', 'summary', 'tl;dr', 'tldr', 'this file', 'attached', 'long text', 'chapter', 'terms and conditions',
      'پی دی اف', 'پیدیاف', 'سند', 'قرارداد', 'کتاب', 'خلاصه', 'مقاله علمی', 'فایل',
    ],
  },
  {
    id: 'image',
    label: 'Images',
    short: 'Image',
    skill: 'images',
    blurb: 'Create or edit pictures, logos and posters',
    keywords: [
      'image', 'picture', 'photo', 'logo', 'illustration', 'poster', 'banner', 'thumbnail', 'icon', 'draw',
      'drawing', 'render', 'artwork', 'product shot', 'mockup', 'wallpaper', 'sticker', 'remove background',
      'edit this photo', 'midjourney', 'cover art', 'character design', 'portrait',
      'عکس', 'تصویر', 'لوگو', 'پوستر', 'نقاشی', 'بنر', 'کاور', 'تامبنیل', 'طرح گرافیکی',
    ],
  },
  {
    id: 'video',
    label: 'Video',
    short: 'Video',
    skill: 'video',
    blurb: 'Generate clips and animations',
    keywords: [
      'video', 'clip', 'animation', 'animate', 'short film', 'footage', 'b-roll', 'b roll', 'trailer',
      'text to video', 'reel video', 'motion', 'cinematic',
      'ویدیو', 'ویدئو', 'کلیپ', 'انیمیشن', 'موشن', 'فیلم کوتاه',
    ],
  },
  {
    id: 'translation',
    label: 'Translation',
    short: 'Translate',
    skill: 'translation',
    blurb: 'Between languages, keeping tone and terms',
    keywords: [
      'translate', 'translation', 'into english', 'to english', 'into persian', 'to persian', 'farsi', 'in persian',
      'into arabic', 'into french', 'into german', 'into spanish', 'into turkish', 'localize', 'localise',
      'ترجمه', 'به انگلیسی', 'به فارسی', 'به عربی', 'به ترکی', 'به آلمانی',
    ],
  },
  {
    id: 'editing',
    label: 'Editing & rewriting',
    short: 'Editing',
    skill: 'editing and rewriting',
    blurb: 'Proofread, shorten or change the tone',
    keywords: [
      'edit', 'rewrite', 'proofread', 'polish', 'shorten', 'paraphrase', 'fix grammar', 'grammar', 'tone',
      'make it sound', 'rephrase', 'simplify this', 'improve this', 'improve my', 'more professional',
      'ویرایش', 'بازنویسی', 'اصلاح کن', 'روان تر', 'کوتاه تر', 'رسمی تر', 'غلط گیری',
    ],
  },
  {
    id: 'writing',
    label: 'Writing',
    short: 'Writing',
    skill: 'writing',
    blurb: 'Posts, emails, articles, scripts and stories',
    keywords: [
      'write', 'draft', 'article', 'blog', 'blog post', 'caption', 'email', 'letter', 'essay', 'story', 'copy',
      'copywriting', 'headline', 'slogan', 'tagline', 'bio', 'newsletter', 'cover letter', 'poem', 'speech',
      'product description', 'instagram post', 'linkedin post', 'social media post', 'tweet', 'thread', 'ad copy',
      'video script', 'youtube script', 'press release',
      'بنویس', 'متن', 'کپشن', 'مقاله', 'ایمیل', 'نامه', 'داستان', 'شعر', 'پست', 'اسلوگان', 'سناریو',
    ],
  },
  {
    id: 'office',
    label: 'Slides & office docs',
    short: 'Office',
    skill: 'slides and documents',
    blurb: 'Presentations, Word docs, resumes',
    keywords: [
      'slides', 'slide', 'presentation', 'powerpoint', 'deck', 'pitch deck', 'word document', 'docx', 'google docs',
      'outlook', 'meeting notes', 'agenda', 'resume', 'cv', 'invoice', 'template', 'proposal', 'report template',
      'ارائه', 'پاورپوینت', 'اسلاید', 'رزومه', 'ورد', 'پروپوزال', 'صورتجلسه',
    ],
  },
  {
    id: 'brainstorm',
    label: 'Ideas & strategy',
    short: 'Ideas',
    skill: 'ideas and strategy',
    blurb: 'Brainstorm names, plans and campaigns',
    keywords: [
      'ideas', 'idea', 'brainstorm', 'names', 'name for', 'suggest', 'suggestions', 'come up with', 'concepts',
      'strategy', 'plan', 'business idea', 'campaign', 'marketing plan', 'roadmap', 'options', 'content calendar',
      'ایده', 'اسم', 'پیشنهاد', 'استراتژی', 'برنامه ریزی', 'کمپین', 'تقویم محتوا',
    ],
  },
  {
    id: 'learning',
    label: 'Learn & explain',
    short: 'Learning',
    skill: 'explaining and teaching',
    blurb: 'Understand a topic, study, practise',
    keywords: [
      'explain', 'teach', 'learn', 'how does', 'why does', 'understand', 'tutorial', 'for beginners', 'eli5',
      'study', 'quiz', 'flashcards', 'exam', 'lesson', 'course', 'homework',
      'توضیح بده', 'یاد بگیرم', 'آموزش', 'بفهمم', 'امتحان', 'درس',
    ],
  },
  {
    id: 'general',
    label: 'General & quick questions',
    short: 'General',
    skill: 'everyday questions',
    blurb: 'Everyday questions and small tasks',
    keywords: [
      'what is', 'who is', 'when is', 'how to', 'define', 'meaning of', 'quick question', 'synonym', 'convert',
      'how many', 'recipe', 'tell me', 'advice',
      'چیست', 'چیه', 'کیه', 'یعنی چی', 'چطوری',
    ],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export const categoryLabel = (id: CategoryId) => CATEGORY_BY_ID[id]?.label ?? id;

/** Categories that need a special tool, not just a chat model. */
export const TOOL_CATEGORIES: CategoryId[] = ['image', 'video', 'deep-research', 'agentic-coding'];
