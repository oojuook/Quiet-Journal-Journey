import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import {
  ArrowUp,
  BookOpen,
  CalendarDays,
  Compass,
  Feather,
  FileText,
  HeartHandshake,
  ImagePlus,
  Leaf,
  Lock,
  Mail,
  Moon,
  Newspaper,
  Paintbrush,
  Palette,
  PenLine,
  Plus,
  Quote,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Trash2,
  Waves
} from 'lucide-react';
import { auth, db, googleProvider } from './firebase';

const STORAGE_KEY = 'quiet-harbor-journal-v1';
const PIN_KEY = 'quiet-harbor-pin-v1';
const CUSTOM_WEATHER_STORAGE_KEY = 'quiet-journal-custom-weather-v1';
const CUSTOM_QUOTES_STORAGE_KEY = 'quiet-journal-custom-quotes-v1';
const QUOTE_STYLE_STORAGE_KEY = 'quiet-journal-quote-style-v1';
const JOURNAL_STYLE_STORAGE_KEY = 'quiet-journal-style-v1';
const COMPANION_STORAGE_KEY = 'quiet-journal-companion-v1';

function getInitialCompanion() {
  const defaults = {
    character: '🐭',
    leaf: '',
    rainEnabled: true,
    sootSpritesEnabled: true,
    animation: 'breathe',
    size: 80,
    x: 0,
    y: 0
  };
  try {
    const saved = localStorage.getItem(COMPANION_STORAGE_KEY);
    if (saved) {
      const parsed = { ...defaults, ...JSON.parse(saved) };
      if (parsed.leaf === '🍃') parsed.leaf = '';
      return parsed;
    }
  } catch {}
  return defaults;
}

const journalFontOptions = [
  { id: 'serif', label: 'Elegant Serif', css: '"Cormorant Garamond", Georgia, serif' },
  { id: 'sans', label: 'Clean Sans', css: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: 'hand', label: 'Soft Script', css: '"Segoe Print", "Bradley Hand", cursive' }
];

const journalSizeOptions = [
  { id: 'sm', label: 'Cozy', value: '1rem' },
  { id: 'md', label: 'Balanced', value: '1.12rem' },
  { id: 'lg', label: 'Spacious', value: '1.25rem' }
];

const quoteFontOptions = [
  { id: 'serif', label: 'Elegant Serif', css: '"Cormorant Garamond", Georgia, serif' },
  { id: 'sans', label: 'Clean Sans', css: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: 'hand', label: 'Journal Script', css: '"Segoe Print", "Bradley Hand", cursive' }
];

const quoteSizeOptions = [
  { id: 'sm', label: 'Soft', value: '1.5rem' },
  { id: 'md', label: 'Balanced', value: '1.9rem' },
  { id: 'lg', label: 'Focused', value: '2.5rem' }
];

const moods = [
  { label: 'Happy', emoji: '☀️', value: 5, color: 'bg-amber-300' },
  { label: 'Calm', emoji: '🏖️', value: 4, color: 'bg-sage-300' },
  { label: 'Neutral', emoji: '⛅', value: 3, color: 'bg-slate-200' },
  { label: 'Sad', emoji: '🌧️', value: 2, color: 'bg-blue-200' },
  { label: 'Anxious', emoji: '🌪️', value: 1, color: 'bg-rose-200' }
];

const prompts = [
  'What made you smile today?',
  'Name one thing you are grateful for right now.',
  'How are you really feeling in this moment?',
  'What do you need to hear from yourself today?',
  'What is one thing you can let go of?',
  'What small win did you have today?',
  'How would you describe your mood to a friend?'
];

const rewardMessages = [
  'Saved. You gave today a soft place to land. 🌿',
  'Tiny journal star earned. One sentence still counts. ✨',
  'Your positivity garden grew a little today. 🌱',
  'You showed up for yourself. That is worth keeping. 🤍',
  'Reflection saved. Future you may be glad this exists. ☁️',
  'Another little bloom for your archive. 🌷',
  'Quiet streak energy collected. Keep going softly. 🌙'
];

const quotes = [
  'You are allowed to go slowly. Small steps still move you forward.',
  'Rest is not a reward. It is part of the rhythm.',
  'Let this moment be enough to begin again.',
  'Your feelings can be real without being permanent.',
  'Breathe like the tide: arrive, soften, return.',
  'A quiet day can still be a brave day.',
  'Be gentle with yourself. You are doing the best you can.',
  'Slow progress is still progress.',
  'It is okay to take a break. The world can wait.',
  'You deserve the same kindness you give to others.',
  'Not every day has to be productive to be meaningful.',
  'Small wins are still wins worth celebrating.',
  'Your worth is not measured by your productivity.',
  'Peace begins with a single deep breath.',
  'The sun will rise, and you will try again with fresh eyes.',
  'Soft hearts can still be strong hearts.',
  'Let go of what you cannot control today.',
  'There is courage in simply showing up.',
  'Healing is not linear; it is perfectly okay to backtrack.',
  'You are exactly where you need to be in this moment.',
  'Today is a new page, write it gently.',
  'Even the darkest night will end and the sun will rise.',
  'Your pace does not need to match anyone elses.',
  'Let your thoughts pass like clouds in a quiet sky.',
  'Choose one small thing today that brings you peace.',
  'Growth happens quietly, beneath the surface.',
  'It is enough to simply exist right now.',
  'You are not behind; you are on your own timeline.',
  'A calm mind brings inner strength and self-confidence.',
  'Do not let yesterday take up too much of today.',
  'The present moment is filled with joy and happiness.',
  'Sometimes the most productive thing you can do is relax.',
  'You carry so much. It is okay to set some of it down.',
  'Be like water—flexible, yet powerful enough to reshape stone.',
  'The journey of a thousand miles begins with a single step.',
  'Kindness towards yourself is the greatest medicine.',
  'Inhale the future, exhale the past.',
  'Stars cannot shine without darkness.',
  'Let yourself rest in the spaces between words.',
  'Trust the timing of your life.',
  'Every moment is a fresh beginning.',
  'You are capable of amazing things, even on hard days.',
  'What feels like an ending is often just a new beginning.',
  'Quiet the mind, and the soul will speak.',
  'Be patient with yourself. Nothing in nature blooms all year.',
  'You are a work in progress, and that is perfectly fine.',
  'The world is better because you are in it.',
  'Your story is still being written.',
  'Take life one breath at a time.',
  'Wherever you are, be there fully.'
];

const resources = [
  {
    title: 'The 3-minute grounding reset',
    text: 'Name five things you see, four you feel, three you hear, two you smell, and one thing you can taste. Let the room become real again before you write.'
  },
  {
    title: 'A gentle body check-in',
    text: 'Start at your forehead and move slowly to your shoulders, chest, hands, stomach, legs, and feet. Notice tension without trying to force it away.'
  },
  {
    title: 'Tiny routine, big kindness',
    text: 'Choose one small daily anchor: water after waking, sunlight for two minutes, or one sentence in your journal before sleep.'
  },
  {
    title: 'When thoughts feel loud',
    text: 'Write the loudest thought as a sentence, then write: “A kinder way to say this might be…” This helps create distance without ignoring the feeling.'
  },
  {
    title: 'A low-energy reflection',
    text: 'Use three short lines: “Today felt…”, “I needed…”, and “Tomorrow I can try…”. A useful entry does not need to be long.'
  },
  {
    title: 'A safe closing ritual',
    text: 'End your entry by naming one object in the room, one sensation in your body, and one small action you can take next.'
  }
];

const tips = [
  'Write for honesty, not for grammar.',
  'Start with one sentence when a blank page feels too big.',
  'Track patterns without judging yourself for having them.',
  'End entries with one small next step or one thing you can release.',
  'Use prompts as doors, not assignments.',
  'Try naming the feeling before explaining it.',
  'Reread only when it feels supportive, not when it becomes self-criticism.',
  'Keep one “comfort list” of people, places, songs, and rituals that help.'
];

const wellnessArticles = [
  {
    title: 'How to start journaling when you do not know what to write',
    read: 'Quick note',
    body: 'Start by describing the present moment instead of trying to summarize your whole life. Write what the room feels like, what your body is asking for, and one sentence that begins with “Right now…”. This removes the pressure to be deep and turns journaling into a simple check-in.'
  },
  {
    title: 'Using mood tracking without judging yourself',
    read: 'Gentle guide',
    body: 'A mood tracker is most helpful when it becomes a pattern finder, not a report card. Instead of asking “Why am I not better?”, try asking “What tends to happen before this mood?” or “What helped even a little?” Curiosity is more useful than criticism.'
  },
  {
    title: 'A calming evening reflection routine',
    read: 'Quick note',
    body: 'Before sleep, keep the routine small: one thing that felt difficult, one thing that felt supportive, and one thing you can set down for tonight. This creates a gentle ending without turning bedtime into another task.'
  },
  {
    title: 'What to write on a difficult day',
    read: 'Support note',
    body: 'On difficult days, write in fragments. Try “I feel…”, “I wish…”, “I need…”, and “One safe next step is…”. Short phrases can carry a lot. You do not need to explain your feelings perfectly for them to matter.'
  },
  {
    title: 'Making a personal comfort menu',
    read: 'Gentle guide',
    body: 'A comfort menu is a short list of options for when your mind feels crowded. Include one body-based option, one connection option, one practical option, and one rest option. When stress rises, choose from the menu instead of starting from zero.'
  },
  {
    title: 'The difference between reflection and rumination',
    read: 'Gentle guide',
    body: 'Reflection often leads to understanding, kindness, or a next step. Rumination loops without relief. If writing starts to feel like a spiral, pause and shift to grounding: describe what you see, drink water, or write one compassionate closing sentence.'
  },
  {
    title: 'Gentle prompts for self-understanding',
    read: 'Quick note',
    body: 'Prompts work best when they open a door rather than demand an answer. Try: “What part of me needs patience?”, “What felt manageable today?”, or “What would support look like in the next hour?”'
  },
  {
    title: 'Building a journal habit that survives busy weeks',
    read: 'Gentle guide',
    body: 'A sustainable journal habit should be easy to return to. Set the bar low: one sentence counts, one mood check-in counts, and skipping a day does not erase the practice. The goal is a place to come back to.'
  }
];

const THEME_STORAGE_KEY = 'quiet-journal-theme-v1';
const DESIGN_STORAGE_KEY = 'quiet-journal-design-v1';
const CUSTOM_COLOR_STORAGE_KEY = 'quiet-journal-custom-color-v1';
const QUOTE_BG_STORAGE_KEY = 'quiet-journal-quote-bg-v1';
const COMFORT_MODE_STORAGE_KEY = 'quiet-journal-comfort-mode-v1';

const colorThemes = [
  { id: 'sage', name: 'Sage Calm', accent: '#587f49', soft: '#edf4e8', glow: '#bfd8b0' },
  { id: 'lavender', name: 'Lavender Rest', accent: '#7c6aa6', soft: '#f0ecfb', glow: '#c9bce8' },
  { id: 'ocean', name: 'Ocean Breath', accent: '#387f8f', soft: '#e7f5f7', glow: '#a8d8df' },
  { id: 'sunrise', name: 'Warm Sunrise', accent: '#b97843', soft: '#fff0df', glow: '#edc194' },
  { id: 'rose', name: 'Rose Kindness', accent: '#a96b76', soft: '#fbebee', glow: '#e8bbc3' }
];

const designStyles = [
  { id: 'soft', name: 'Soft Cards', description: 'Rounded, airy, and gentle.', radius: '1.5rem', texture: 'none' },
  { id: 'editorial', name: 'Editorial', description: 'More magazine-like and refined.', radius: '0.85rem', texture: 'linear-gradient(135deg, rgba(255,255,255,0.52), rgba(255,255,255,0))' },
  { id: 'playful', name: 'Playful Calm', description: 'Bubbly shapes with a lighter mood.', radius: '2.25rem', texture: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.55), transparent 28%)' }
];

const quoteCardColors = [
  { name: 'Forest', value: '#45643b' },
  { name: 'Lavender', value: '#6f5c99' },
  { name: 'Ocean', value: '#2f7585' },
  { name: 'Clay', value: '#9a6847' },
  { name: 'Rose', value: '#9b5f6b' },
  { name: 'Charcoal', value: '#2f3a37' }
];

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function shiftMonthKey(monthKey, offset) {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(year, month - 1 + offset, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

function buildCalendarDays(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        day,
        dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    })
  ];
}

function getInitialEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getSavedPin() {
  try {
    return localStorage.getItem(PIN_KEY) || '';
  } catch {
    return '';
  }
}

function getInitialCustomWeathers() {
  try {
    const saved = localStorage.getItem(CUSTOM_WEATHER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getInitialCustomQuotes() {
  try {
    const saved = localStorage.getItem(CUSTOM_QUOTES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getInitialQuoteStyle() {
  try {
    const saved = localStorage.getItem(QUOTE_STYLE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    fontId: 'serif',
    sizeId: 'md',
    textColor: '#ffffff'
  };
}

function getInitialJournalStyle() {
  try {
    const saved = localStorage.getItem(JOURNAL_STYLE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    fontId: 'sans',
    sizeId: 'md'
  };
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
}

function getPlainTextFromHtml(html = '') {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lift backdrop-blur transition hover:-translate-y-1 hover:bg-white/90">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={21} />
      </div>
      <p className="text-sm font-bold text-sage-800">{label}</p>
      <p className="mt-1 break-words text-2xl font-extrabold leading-tight tracking-tight text-ink">{value}</p>
    </div>
  );
}

function WeatherGlyph({ mood, size = 'text-3xl' }) {
  if (mood?.image) {
    return <img alt={mood.label} className="inline-block h-9 w-9 rounded-2xl object-cover shadow-sm" src={mood.image} />;
  }
  return <span className={`inline-block ${size}`} aria-label={mood?.label}>{mood?.emoji || '🌙'}</span>;
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-9 max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-sage-600">{eyebrow}</p>
      <h2 className="mt-3 font-display text-5xl font-bold leading-tight text-sage-950">{title}</h2>
      {text && <p className="mt-4 text-lg leading-8 text-sage-800">{text}</p>}
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <article className="customizable-card rounded-3xl border border-white/70 bg-white/75 p-6 shadow-lift backdrop-blur transition hover:-translate-y-1 hover:bg-white/90">
      <div className="theme-icon mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-sage-100 text-sage-800">
        <Icon size={22} />
      </div>
      <h3 className="text-2xl font-extrabold text-ink">{title}</h3>
      <div className="mt-3 leading-7 text-sage-800">{children}</div>
    </article>
  );
}

function ThemeStudio({
  selectedTheme,
  selectedDesign,
  customColor,
  quoteBg,
  companion,
  isOpen,
  onClose,
  onThemeChange,
  onDesignChange,
  onCustomColorChange,
  onQuoteBgChange,
  onCompanionChange
}) {
  const animationOptions = [
    { id: 'breathe', label: 'Breathe' },
    { id: 'bounce', label: 'Bounce' },
    { id: 'float', label: 'Float' },
    { id: 'wiggle', label: 'Wiggle' },
    { id: 'spin', label: 'Spin' },
    { id: 'wave', label: 'Wave' },
    { id: 'none', label: 'Still' }
  ];

  function handleCompanionImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onCompanionChange({ ...companion, character: String(reader.result || ''), size: Math.max(companion.size || 80, file.type.startsWith('video/') ? 140 : 100), leaf: '', x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={`customizer-shell fixed inset-y-0 right-0 z-30 flex transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div className={`fixed inset-0 bg-ink/20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside id="design" className={`relative h-full w-screen max-w-5xl overflow-y-auto bg-white/95 shadow-soft backdrop-blur-xl transition duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="grid min-h-full lg:grid-cols-12">
          <div className="theme-panel p-7 text-white lg:col-span-4 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <Palette className="text-white/90" size={34} />
              <button className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30" onClick={onClose} type="button">Done</button>
            </div>
            <p className="mt-7 text-sm font-bold uppercase tracking-widest text-white/80">Customize your space</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight">Choose the look that feels right today.</h2>
            <p className="mt-4 leading-7 text-white/85">Visitors can personalize colors and style. Their choice is saved only in their own browser, and this drawer can stay tucked away.</p>
          </div>
          <div className="space-y-7 p-7 lg:col-span-8 lg:p-8">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sage-700"><Paintbrush size={16} /> Color theme</div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {colorThemes.map((theme) => (
                  <button
                    className={`custom-option rounded-3xl border p-4 text-left transition hover:-translate-y-1 ${selectedTheme === theme.id ? 'is-selected border-sage-500 bg-sage-50 shadow-lift' : 'border-sage-100 bg-white'}`}
                    key={theme.id}
                    onClick={() => {
                      onThemeChange(theme.id);
                    }}
                    type="button"
                  >
                    <span className="mb-3 block h-9 w-full rounded-2xl" style={{ background: `linear-gradient(135deg, ${theme.soft}, ${theme.accent})` }} />
                    <span className="block text-sm font-extrabold text-ink">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <label className="custom-option rounded-3xl border border-sage-100 bg-white p-5 shadow-sm lg:col-span-1">
                <span className="mb-3 block text-sm font-bold uppercase tracking-widest text-sage-700">Custom color</span>
                <input
                  aria-label="Choose a custom accent color"
                  className="h-12 w-full cursor-pointer rounded-2xl border border-sage-100 bg-white p-1"
                  onChange={(event) => {
                    onCustomColorChange(event.target.value);
                    onThemeChange('custom');
                  }}
                  type="color"
                  value={customColor}
                />
                <span className="mt-3 block text-sm font-semibold text-sage-700">Pick any accent color.</span>
              </label>
              <div className="grid gap-3 lg:col-span-2">
                {designStyles.map((style) => (
                  <button
                    className={`custom-option flex items-center justify-between rounded-3xl border bg-white p-4 text-left transition hover:-translate-y-1 ${selectedDesign === style.id ? 'is-selected border-sage-500 shadow-lift' : 'border-sage-100'}`}
                    key={style.id}
                    onClick={() => {
                      onDesignChange(style.id);
                    }}
                    type="button"
                  >
                    <span>
                      <span className="block font-extrabold text-ink">{style.name}</span>
                      <span className="text-sm text-sage-700">{style.description}</span>
                    </span>
                    <span className="theme-dot h-8 w-8 rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-sage-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sage-700"><Quote size={16} /> Quote card color</div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {quoteCardColors.map((color) => (
                  <button
                    className={`custom-option rounded-2xl border p-3 text-left transition hover:-translate-y-1 ${quoteBg.toLowerCase() === color.value.toLowerCase() ? 'is-selected border-sage-500 shadow-lift' : 'border-sage-100'}`}
                    key={color.value}
                    onClick={() => {
                      onQuoteBgChange(color.value);
                    }}
                    type="button"
                  >
                    <span className="mb-2 block h-10 rounded-xl" style={{ background: color.value }} />
                    <span className="text-sm font-extrabold text-ink">{color.name}</span>
                  </button>
                ))}
              </div>
              <label className="mt-4 block rounded-2xl bg-sage-50 p-4">
                <span className="mb-3 block text-sm font-bold text-sage-800">Or pick any quote card color</span>
                <input className="h-11 w-full cursor-pointer rounded-xl border border-sage-100 bg-white p-1" onChange={(event) => onQuoteBgChange(event.target.value)} type="color" value={quoteBg} />
              </label>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sage-700"><Sparkles size={16} /> Quote companion</div>
              <div className="grid gap-4 rounded-3xl border border-sage-100 bg-sage-50/70 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-sage-800">
                    Mascot emoji or character
                    <input
                      className="mt-2 w-full rounded-2xl border border-sage-100 bg-white px-4 py-3 text-base outline-none focus:border-sage-400"
                      maxLength={4}
                      onChange={(event) => onCompanionChange({ ...companion, character: event.target.value })}
                      placeholder="🐭"
                      value={companion.character?.startsWith('data:') ? '' : companion.character}
                    />
                  </label>
                  <label className="block text-sm font-bold text-sage-800">
                    Leaf / prop
                    <input
                      className="mt-2 w-full rounded-2xl border border-sage-100 bg-white px-4 py-3 text-base outline-none focus:border-sage-400"
                      maxLength={4}
                      onChange={(event) => onCompanionChange({ ...companion, leaf: event.target.value })}
                      placeholder="🍃"
                      value={companion.leaf}
                    />
                  </label>
                </div>
                <label className="block text-sm font-bold text-sage-800">
                  Upload your own photo, GIF, or video to replace the mascot
                  <label className="mt-2 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-sage-300 bg-white px-4 py-4 text-sm font-bold text-sage-700 transition hover:border-sage-500 hover:text-sage-900">
                    <ImagePlus size={16} className="mr-2" /> Choose image, GIF, or video
                    <input accept="image/*,image/gif,video/*" className="hidden" onChange={handleCompanionImage} type="file" />
                  </label>
                </label>
                <label className="block text-sm font-bold text-sage-800">
                  Mascot size ({companion.size}px)
                  <input className="mt-2 w-full cursor-pointer accent-sage-700" min="40" max="140" onChange={(event) => onCompanionChange({ ...companion, size: Number(event.target.value) })} type="range" value={companion.size} />
                </label>
                <div>
                  <span className="block text-sm font-bold text-sage-800">Animation style</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {animationOptions.map((option) => (
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${companion.animation === option.id ? 'bg-sage-900 text-white' : 'bg-white text-sage-800 shadow-sm hover:bg-sage-100'}`}
                        key={option.id}
                        onClick={() => onCompanionChange({ ...companion, animation: option.id })}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-sage-800 shadow-sm">
                    <input checked={companion.rainEnabled} onChange={(event) => onCompanionChange({ ...companion, rainEnabled: event.target.checked })} type="checkbox" />
                    Rain drops
                  </label>
                  <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-sage-800 shadow-sm">
                    <input checked={companion.sootSpritesEnabled} onChange={(event) => onCompanionChange({ ...companion, sootSpritesEnabled: event.target.checked })} type="checkbox" />
                    Soot sprites
                  </label>
                </div>
                {companion.character?.startsWith('data:') && (
                  <button className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100" onClick={() => onCompanionChange({ ...companion, character: '🐭' })} type="button">
                    Remove custom photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MoodChart({ entries, weatherOptions }) {
  const recent = useMemo(() => entries.slice(0, 7).reverse(), [entries]);
  const legacyMoodMap = {
    'Grounded': 'Happy',
    'Soft': 'Calm',
    'Okay': 'Neutral',
    'Heavy': 'Sad',
    'Stormy': 'Anxious'
  };

  if (!recent.length) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-sage-200 bg-sage-50/70 p-8 text-center text-sage-700">
        Your mood garden is waiting for its first check-in.
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-white to-sage-50 p-5 shadow-inner">
      <div className="flex h-64 items-end gap-3 px-2">
        {recent.map((entry) => {
          const effectiveMoodLabel = legacyMoodMap[entry.mood] || entry.mood;
          const mood = weatherOptions.find((item) => item.label === effectiveMoodLabel) || weatherOptions.find(m => m.label === entry.mood) || weatherOptions[2] || moods[2];
          const heightClass = ['h-12', 'h-20', 'h-28', 'h-40', 'h-52'][mood.value - 1] || 'h-28';
          const entryDate = new Date(entry.createdAt);
          return (
            <div className="flex flex-1 flex-col items-center gap-3" key={entry.id}>
              <div className="flex h-52 w-full items-end justify-center rounded-2xl bg-white/40 p-1.5 shadow-inner backdrop-blur-sm">
                <div className={`w-full rounded-xl ${mood.color || ''} ${heightClass} shadow-md transition-all hover:scale-105 hover:shadow-lg`} style={mood.color ? undefined : { background: mood.hex || '#739f62' }} />
              </div>
              <WeatherGlyph mood={mood} size="text-xl" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-sage-400">{entryDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span className="text-xs font-extrabold text-sage-700">{entryDate.toLocaleDateString('en', { weekday: 'short' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrivacyGate({ hasPin, onUnlock, onCreatePin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!pin.trim()) return;
    if (!hasPin) {
      onCreatePin(pin.trim());
      return;
    }
    const saved = getSavedPin();
    if (pin.trim() === saved) onUnlock();
    else setError('That PIN did not match. Try again gently.');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-sand-50 text-ink">
      <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-sage-200/60 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-sand-200/70 blur-3xl" />
      <section className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="grid overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-soft backdrop-blur md:grid-cols-2">
          <div className="flex flex-col justify-between bg-gradient-to-br from-sage-100 via-mist to-sand-100 p-10">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-sage-800 shadow-lift">
                <ShieldCheck size={18} /> Private by default
              </div>
              <h1 className="font-display text-5xl font-bold leading-tight text-sage-900">Quiet Journal Journey</h1>
              <p className="mt-5 text-lg leading-8 text-sage-800">A calm space for daily reflection, mood tracking, guided prompts, and tiny reminders that you are allowed to soften.</p>
            </div>
            <div className="mt-12 flex items-center gap-3 rounded-3xl bg-white/65 p-4 text-sm text-sage-800">
              <Lock size={19} /> Entries stay in this browser using local storage.
            </div>
          </div>
          <form className="p-10" onSubmit={submit}>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-3xl bg-sage-100 text-sage-700">
              <Lock size={25} />
            </div>
            <h2 className="text-3xl font-extrabold text-ink">{hasPin ? 'Welcome back' : 'Create your soft lock'}</h2>
            <p className="mt-3 leading-7 text-sage-700">{hasPin ? 'Enter your private PIN to open your journal.' : 'Set a simple PIN for this browser. It is a light privacy step for your personal writing space.'}</p>
            <input
              className="mt-8 w-full rounded-2xl border border-sage-200 bg-white px-5 py-4 text-lg font-semibold tracking-widest outline-none transition focus:border-sage-500 focus:ring-4 focus:ring-sage-100"
              maxLength={12}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Your PIN"
              type="password"
              value={pin}
            />
            {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
            <button className="mt-6 w-full rounded-2xl bg-ink px-5 py-4 font-bold text-white shadow-lift transition hover:-translate-y-1 hover:bg-sage-800" type="submit">
              {hasPin ? 'Unlock journal' : 'Begin gently'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [entries, setEntries] = useState(getInitialEntries);
  const [selectedMood, setSelectedMood] = useState('Calm');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saveReward, setSaveReward] = useState('');
  const [customQuotes, setCustomQuotes] = useState(getInitialCustomQuotes);
  const [customQuoteDraft, setCustomQuoteDraft] = useState('');
  const [quoteStyle, setQuoteStyle] = useState(getInitialQuoteStyle);
  const [journalStyle, setJournalStyle] = useState(getInitialJournalStyle);
  const [petHappiness, setPetHappiness] = useState(60);
  const [petTreats, setPetTreats] = useState(0);
  const [petMood, setPetMood] = useState('walking');
  const [petPosition, setPetPosition] = useState({ x: 20, y: 40 });
  const [petDirection, setPetDirection] = useState(1);
  const [petBubble, setPetBubble] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => todayISO().slice(0, 7));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayISO());
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editMood, setEditMood] = useState('Calm');
  const editBodyRef = useRef(null);
  const [customWeathers, setCustomWeathers] = useState(getInitialCustomWeathers);
  const [customWeatherName, setCustomWeatherName] = useState('');
  const [customWeatherEmoji, setCustomWeatherEmoji] = useState('🌙');
  const [customWeatherImage, setCustomWeatherImage] = useState('');
  const [activePrompt, setActivePrompt] = useState(prompts[0]);
  const [hasPin, setHasPin] = useState(Boolean(getSavedPin()));
  const [locked, setLocked] = useState(Boolean(getSavedPin()));
  const [quoteIndex, setQuoteIndex] = useState(() => new Date().getDate() % quotes.length);
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'sage');
  const [selectedDesign, setSelectedDesign] = useState(() => localStorage.getItem(DESIGN_STORAGE_KEY) || 'soft');
  const [customColor, setCustomColor] = useState(() => localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) || '#587f49');
  const [quoteBg, setQuoteBg] = useState(() => localStorage.getItem(QUOTE_BG_STORAGE_KEY) || '#45643b');
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [comfortMode, setComfortMode] = useState(() => localStorage.getItem(COMFORT_MODE_STORAGE_KEY) === 'true');
  const [companion, setCompanion] = useState(getInitialCompanion);
  const [companionSelected, setCompanionSelected] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState('Local mode');
  const entryBodyRef = useRef(null);
  const companionInputRef = useRef(null);
  const companionMediaRef = useRef(null);

  const quickEmojis = ['✨', '🌸', '🍃', '☕', '🌙', '💛', '🌿', '☀️', '🧸', '🫧', '🍂', '🫶'];

  const activeTheme = colorThemes.find((theme) => theme.id === selectedTheme) || colorThemes[0];
  const activeDesign = designStyles.find((style) => style.id === selectedDesign) || designStyles[0];
  const weatherOptions = useMemo(() => [...moods, ...customWeathers], [customWeathers]);
  const quoteLibrary = useMemo(() => [...quotes, ...customQuotes], [customQuotes]);
  const activeQuoteFont = quoteFontOptions.find((font) => font.id === quoteStyle.fontId)?.css || quoteFontOptions[0].css;
  const activeQuoteSize = quoteSizeOptions.find((size) => size.id === quoteStyle.sizeId)?.value || quoteSizeOptions[1].value;
  const activeJournalFont = journalFontOptions.find((font) => font.id === journalStyle.fontId)?.css || journalFontOptions[0].css;
  const activeJournalSize = journalSizeOptions.find((size) => size.id === journalStyle.sizeId)?.value || journalSizeOptions[1].value;
  const companionIsVideo = String(companion.character || '').startsWith('data:video');
  const companionIsUploadedMedia = String(companion.character || '').startsWith('data:') || String(companion.character || '').startsWith('http');
  const companionFrameWidth = companionIsVideo ? Math.min(companion.size * 1.55, 300) : companion.size;
  const companionFrameHeight = companionIsVideo ? Math.min(companion.size * 1.15, 190) : companion.size;
  const themeStyle = {
    '--accent': selectedTheme === 'custom' ? customColor : activeTheme.accent,
    '--accent-soft': selectedTheme === 'custom' ? '#f4f1ec' : activeTheme.soft,
    '--accent-glow': selectedTheme === 'custom' ? customColor : activeTheme.glow,
    '--shape-radius': activeDesign.radius,
    '--theme-texture': activeDesign.texture,
    '--quote-bg': quoteBg
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      setCloudStatus(currentUser ? 'Cloud sync on' : 'Local mode');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const entriesQuery = query(collection(db, 'users', user.uid, 'entries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        setEntries(snapshot.docs.map((entryDoc) => ({ id: entryDoc.id, ...entryDoc.data() })));
        setCloudStatus('Cloud sync on');
      },
      (error) => {
        console.error('Cloud diary sync failed', error);
        setCloudStatus('Cloud sync needs setup');
      }
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_WEATHER_STORAGE_KEY, JSON.stringify(customWeathers));
  }, [customWeathers]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_QUOTES_STORAGE_KEY, JSON.stringify(customQuotes));
  }, [customQuotes]);

  useEffect(() => {
    localStorage.setItem(QUOTE_STYLE_STORAGE_KEY, JSON.stringify(quoteStyle));
  }, [quoteStyle]);

  useEffect(() => {
    localStorage.setItem(JOURNAL_STYLE_STORAGE_KEY, JSON.stringify(journalStyle));
  }, [journalStyle]);

  useEffect(() => {
    localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(companion));
  }, [companion]);

  useEffect(() => {
    return enableCompanionResize(companionMediaRef);
  }, [companionSelected, companion.size, companion.x, companion.y, companionIsVideo]);

  useEffect(() => {
    const handleWindowMouseDown = (event) => {
      if (companionMediaRef.current && !companionMediaRef.current.contains(event.target)) {
        setCompanionSelected(false);
      }
    };
    window.addEventListener('mousedown', handleWindowMouseDown);
    return () => window.removeEventListener('mousedown', handleWindowMouseDown);
  }, []);

  useEffect(() => {
    return enableImageResize(entryBodyRef, setBody);
  }, []);

  useEffect(() => {
    if (isEditingEntry) {
      return enableImageResize(editBodyRef, setEditBody);
    }
    return undefined;
  }, [isEditingEntry]);

  useEffect(() => {
    if (petMood === 'happy' || petMood === 'snack' || petMood === 'yawn') return undefined;
    const moveInterval = window.setInterval(() => {
      setPetPosition((current) => {
        const nextX = Math.max(6, Math.min(88, current.x + (Math.random() * 8 - 4) * petDirection));
        let nextDirection = petDirection;
        if (nextX <= 8 || nextX >= 86) {
          nextDirection = -petDirection;
          setPetDirection(nextDirection);
        }
        const nextY = Math.max(18, Math.min(68, current.y + (Math.random() * 7 - 3.5)));
        if (Math.random() > 0.82) {
          setPetMood('yawn');
          setPetBubble('mrrrp');
          window.setTimeout(() => {
            setPetMood('walking');
            setPetBubble('');
          }, 1200);
        } else if (Math.random() > 0.72) {
          setPetMood('running');
          window.setTimeout(() => setPetMood('walking'), 900);
        }
        return { x: nextX, y: nextY };
      });
    }, 1800);
    return () => window.clearInterval(moveInterval);
  }, [petDirection, petMood]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    localStorage.setItem(DESIGN_STORAGE_KEY, selectedDesign);
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, customColor);
    localStorage.setItem(QUOTE_BG_STORAGE_KEY, quoteBg);
  }, [selectedTheme, selectedDesign, customColor, quoteBg]);

  useEffect(() => {
    localStorage.setItem(COMFORT_MODE_STORAGE_KEY, String(comfortMode));
  }, [comfortMode]);

  const streak = useMemo(() => {
    const dates = new Set(entries.map((entry) => entry.createdAt.slice(0, 10)));
    let count = 0;
    const cursor = new Date(todayISO());
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [entries]);

  const averageMood = useMemo(() => {
    if (!entries.length) return '—';
    const legacyMoodMap = { 'Grounded': 'Happy', 'Soft': 'Calm', 'Okay': 'Neutral', 'Heavy': 'Sad', 'Stormy': 'Anxious' };
    const score = entries.reduce((sum, entry) => {
      const effectiveMoodLabel = legacyMoodMap[entry.mood] || entry.mood;
      const mood = weatherOptions.find((item) => item.label === effectiveMoodLabel) || weatherOptions.find(m => m.label === entry.mood) || moods[2];
      return sum + mood.value;
    }, 0) / entries.length;
    if (score >= 4.5) return 'Happy';
    if (score >= 3.5) return 'Calm';
    if (score >= 2.5) return 'Neutral';
    if (score >= 1.5) return 'Sad';
    return 'Anxious';
  }, [entries, weatherOptions]);

  const weeklySummary = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const recentEntries = entries.filter((entry) => new Date(entry.createdAt) >= sevenDaysAgo);
    if (!recentEntries.length) {
      return 'No pressure to have a streak. One gentle check-in is enough to begin.';
    }
    const counts = recentEntries.reduce((acc, entry) => ({ ...acc, [entry.mood]: (acc[entry.mood] || 0) + 1 }), {});
    const commonMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Calm';
    return `You checked in ${recentEntries.length} time${recentEntries.length === 1 ? '' : 's'} this week. Your most common mood was ${commonMood}.`;
  }, [entries]);

  const entriesByDate = useMemo(() => entries.reduce((acc, entry) => {
    const key = entry.createdAt.slice(0, 10);
    return { ...acc, [key]: [...(acc[key] || []), entry] };
  }, {}), [entries]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const selectedDateEntries = entriesByDate[selectedCalendarDate] || [];

  const rewardLevel = useMemo(() => {
    if (entries.length >= 30) return { title: 'Moon Keeper', emoji: '🌙', next: 'Your journal garden is glowing.' };
    if (entries.length >= 14) return { title: 'Kindness', emoji: '🌷', next: `${30 - entries.length} more entries until Moon Keeper.` };
    if (entries.length >= 7) return { title: 'Weekly Spark', emoji: '✨', next: `${14 - entries.length} more entries until Kindness.` };
    if (entries.length >= 3) return { title: 'Seedling', emoji: '🌱', next: `${7 - entries.length} more entries until Weekly Spark.` };
    return { title: 'Starter', emoji: '☁️', next: `${Math.max(3 - entries.length, 1)} more entries until Seedling.` };
  }, [entries.length]);

  const draftText = useMemo(() => getPlainTextFromHtml(body), [body]);
  const weeklyGoal = 5;
  const weeklyCheckIns = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    return entries.filter((entry) => new Date(entry.createdAt) >= sevenDaysAgo).length;
  }, [entries]);
  const entriesToNextReward = useMemo(() => {
    if (entries.length >= 30) return 0;
    if (entries.length >= 14) return 30 - entries.length;
    if (entries.length >= 7) return 14 - entries.length;
    if (entries.length >= 3) return 7 - entries.length;
    return Math.max(3 - entries.length, 0);
  }, [entries.length]);
  const journalQuest = useMemo(() => ([
    { label: 'Pick today’s feeling', done: Boolean(selectedMood) },
    { label: 'Name this moment', done: Boolean(title.trim() || draftText) },
    { label: 'Keep one honest detail', done: draftText.length >= 40 }
  ]), [draftText, selectedMood, title]);
  const completedQuestCount = journalQuest.filter((step) => step.done).length;
  const journalNudge = useMemo(() => {
    if (streak >= 7) return 'Your journaling rhythm is feeling real now — keep the streak soft, not stressful.';
    if (weeklyCheckIns >= weeklyGoal) return 'Weekly glow unlocked. You have already given this week plenty of attention.';
    if (selectedMood === 'Anxious' || selectedMood === 'Sad') return 'Keep this entry gentle. A few honest lines is more than enough today.';
    if (draftText.length >= 40) return 'This is already becoming a memory worth keeping. Add one more detail if you want.';
    return 'Tiny entries still count. A title, one line, and a mood is a full check-in.';
  }, [draftText.length, selectedMood, streak, weeklyCheckIns]);

  async function signInWithGoogle() {
    try {
      setCloudStatus('Opening Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      if (entries.length) {
        await Promise.all(
          entries.map((entry) => setDoc(doc(db, 'users', result.user.uid, 'entries', entry.id), entry, { merge: true }))
        );
      }
      setCloudStatus('Cloud sync on');
    } catch (error) {
      console.error('Google sign-in failed', error);
      setCloudStatus('Sign-in was cancelled or blocked');
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      setEntries(getInitialEntries());
      setCloudStatus('Local mode');
    } catch (error) {
      console.error('Sign out failed', error);
      setCloudStatus('Could not sign out');
    }
  }

  async function saveEntry(event) {
    event.preventDefault();
    if (!body.trim() && !title.trim()) return;
    const entry = {
      id: crypto.randomUUID(),
      title: title.trim() || activePrompt,
      body: body.trim(),
      mood: selectedMood,
      prompt: activePrompt,
      createdAt: new Date().toISOString()
    };
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'entries', entry.id), entry);
        setCloudStatus('Saved to cloud');
      } catch (error) {
        console.error('Could not save cloud entry', error);
        setCloudStatus('Cloud save failed');
      }
    } else {
      setEntries((currentEntries) => [entry, ...currentEntries]);
    }
    setSaveReward(rewardMessages[Math.floor(Math.random() * rewardMessages.length)]);
    window.setTimeout(() => setSaveReward(''), 4200);
    setTitle('');
    setBody('');
    if (entryBodyRef.current) entryBodyRef.current.innerHTML = '';
    setActivePrompt(prompts[(prompts.indexOf(activePrompt) + 1) % prompts.length]);
    setSelectedMood('Calm');
  }

  async function deleteEntry(id) {
    setEntries(entries.filter((entry) => entry.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setIsEditingEntry(false);
    }
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'entries', id));
        setCloudStatus('Deleted from cloud');
      } catch (error) {
        console.error('Could not delete cloud entry', error);
        setCloudStatus('Cloud delete failed');
      }
    }
  }

  function startEditingEntry() {
    if (!selectedEntry) return;
    setEditTitle(selectedEntry.title);
    setEditBody(selectedEntry.body || '');
    setEditMood(selectedEntry.mood);
    setIsEditingEntry(true);
    window.setTimeout(() => {
      if (editBodyRef.current) {
        editBodyRef.current.innerHTML = selectedEntry.body || '';
      }
    }, 0);
  }

  async function saveEditedEntry() {
    if (!selectedEntry) return;
    const editor = editBodyRef.current;
    const finalBody = editor?.innerHTML ?? editBody;
    const updated = {
      ...selectedEntry,
      title: editTitle.trim() || 'Untitled moment',
      body: finalBody,
      mood: editMood
    };
    setEntries((currentEntries) => currentEntries.map((entry) => entry.id === selectedEntry.id ? updated : entry));
    setSelectedEntry(updated);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'entries', selectedEntry.id), updated);
        setCloudStatus('Updated in cloud');
      } catch (error) {
        console.error('Could not update cloud entry', error);
        setCloudStatus('Cloud update failed');
      }
    }
    setIsEditingEntry(false);
  }

  function handleWeatherImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomWeatherImage(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  function insertTextAtCursor(text) {
    const editor = entryBodyRef.current;
    if (!editor) {
      setBody((current) => current + text);
      return;
    }
    editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.append(document.createTextNode(text));
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setBody(editor.innerHTML);
  }

  function insertTextInEditor(editor, text) {
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.append(document.createTextNode(text));
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function toggleBulletList(editorRef, updateBody) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand('insertUnorderedList');
    updateBody(editor.innerHTML);
  }

  function insertImageInEditor(editor, src) {
    if (!editor) return;
    editor.focus();
    const img = document.createElement('img');
    img.src = src;
    img.className = 'journal-inline-img';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '1rem auto';
    img.style.borderRadius = '1rem';
    img.style.position = 'relative';
    img.style.transform = 'translate(0px, 0px)';
    img.draggable = false;
    img.alt = 'Journal photo';
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editor.appendChild(img);
    }
    const br = document.createElement('br');
    img.after(br);
  }

  function insertQuickEmoji(emoji) {
    insertTextAtCursor(`${emoji} `);
  }

  function insertEditQuickEmoji(emoji) {
    insertTextInEditor(editBodyRef.current, `${emoji} `);
    setEditBody(editBodyRef.current?.innerHTML || editBody);
  }

  function handleEntryImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const editor = entryBodyRef.current;
      insertImageInEditor(editor, String(reader.result || ''));
      setBody(editor?.innerHTML || body);
    };
    reader.readAsDataURL(file);
  }

  function handleEditEntryImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const editor = editBodyRef.current;
      insertImageInEditor(editor, String(reader.result || ''));
      setEditBody(editor?.innerHTML || editBody);
    };
    reader.readAsDataURL(file);
  }

  function renderJournalContent(content) {
    return <div className="prose-journal" dangerouslySetInnerHTML={{ __html: String(content || '') }} />;
  }

  function handleDirectCompanionUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCompanion((current) => ({ ...current, character: String(reader.result || ''), size: Math.max(current.size || 80, file.type.startsWith('video/') ? 140 : 100), leaf: '', x: 0, y: 0 }));
      setCompanionSelected(true);
    };
    reader.readAsDataURL(file);
  }

  function enableImageResize(editorRef, updateBody) {
    const editor = editorRef.current;
    if (!editor) return () => {};

    let selectedImg = null;
    let activeMode = null;
    let resizeSideX = 1;
    let resizeSideY = 1;
    let animationFrame = null;
    let lastClientX = 0;
    let lastClientY = 0;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;
    let startTranslateX = 0;
    let startTranslateY = 0;

    const parseTranslate = (img) => {
      const match = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/.exec(img.style.transform || '');
      return {
        x: match ? Number(match[1]) : 0,
        y: match ? Number(match[2]) : 0
      };
    };

    const clampImageTranslate = (img, nextX, nextY) => {
      const editorRect = editor.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const maxX = Math.max(0, (editorRect.width - imgRect.width) / 2);
      const maxY = Math.max(0, (editorRect.height - imgRect.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY))
      };
    };

    const serializeEditor = () => {
      const clone = editor.cloneNode(true);
      clone.querySelectorAll('img').forEach((img) => img.classList.remove('selected-media'));
      return clone.innerHTML;
    };

    const clearSelection = () => {
      if (selectedImg) {
        selectedImg.classList.remove('selected-media');
        selectedImg = null;
      }
    };

    const handleMouseDown = (e) => {
      if (e.target.tagName === 'IMG') {
        if (selectedImg !== e.target) {
          clearSelection();
          selectedImg = e.target;
          selectedImg.classList.add('selected-media');
          e.preventDefault();
          return;
        }

        const rect = selectedImg.getBoundingClientRect();
        const edgeThreshold = 18;
        const nearLeft = e.clientX <= rect.left + edgeThreshold;
        const nearRight = e.clientX >= rect.right - edgeThreshold;
        const nearTop = e.clientY <= rect.top + edgeThreshold;
        const nearBottom = e.clientY >= rect.bottom - edgeThreshold;

        if (nearLeft || nearRight || nearTop || nearBottom) {
          activeMode = 'resize';
          resizeSideX = nearLeft ? -1 : 1;
          resizeSideY = nearTop ? -1 : 1;
          startW = selectedImg.offsetWidth;
          startH = selectedImg.offsetHeight;
        } else {
          activeMode = 'move';
        }

        const translate = parseTranslate(selectedImg);
        startTranslateX = translate.x;
        startTranslateY = translate.y;
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();
        return;
      }

      clearSelection();
    };

    const handleMouseMove = (e) => {
      if (!selectedImg || !activeMode) return;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      if (animationFrame) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        if (!selectedImg || !activeMode) return;
        const dx = lastClientX - startX;
        const dy = lastClientY - startY;

        if (activeMode === 'move') {
          const next = clampImageTranslate(selectedImg, startTranslateX + dx, startTranslateY + dy);
          selectedImg.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
          return;
        }

        const aspectRatio = startW / startH || 1;
        const sizeDeltaX = resizeSideX * dx;
        const sizeDeltaY = resizeSideY * dy;
        const dominantDelta = Math.abs(sizeDeltaX) > Math.abs(sizeDeltaY) ? sizeDeltaX : sizeDeltaY;
        const newW = Math.max(100, startW + dominantDelta);
        const newH = newW / aspectRatio;
        selectedImg.style.width = `${newW}px`;
        selectedImg.style.height = `${newH}px`;
        selectedImg.style.maxWidth = '100%';
      });
    };

    const handleMouseUp = () => {
      if (selectedImg && activeMode) {
        updateBody(serializeEditor());
      }
      activeMode = null;
    };

    editor.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      clearSelection();
      editor.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }

  function enableCompanionResize(mediaRef) {
    const media = mediaRef.current;
    if (!media) return () => {};

    let mode = null;
    let resizeHandle = null;
    let startX = 0;
    let startY = 0;
    let startSize = 0;
    let startPosX = 0;
    let startPosY = 0;
    let animationFrame = null;
    let lastClientX = 0;
    let lastClientY = 0;

    const getFrameDimensions = (size) => ({
      width: companionIsVideo ? Math.min(size * 1.55, 300) : size,
      height: companionIsVideo ? Math.min(size * 1.15, 190) : size
    });

    const clampPosition = (size, nextX, nextY) => {
      const container = media.closest('.totoro-container');
      const containerRect = container?.getBoundingClientRect();
      const frame = getFrameDimensions(size);
      if (!containerRect) return { x: nextX, y: nextY };
      const maxX = Math.max(0, (containerRect.width - frame.width) / 2);
      const maxY = Math.max(0, (containerRect.height - frame.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY))
      };
    };

    const handleMouseDown = (event) => {
      const clickedUpload = event.target.closest('.companion-upload-button');
      if (clickedUpload) return;
      if (!media.contains(event.target)) return;

      if (!companionSelected) {
        setCompanionSelected(true);
        event.preventDefault();
        return;
      }

      const handle = event.target.closest('[data-resize-handle]');
      startX = event.clientX;
      startY = event.clientY;
      startSize = companion.size || 80;
      startPosX = companion.x || 0;
      startPosY = companion.y || 0;

      if (handle) {
        mode = 'resize';
        resizeHandle = handle.getAttribute('data-resize-handle');
      } else {
        mode = 'move';
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const handleMouseMove = (event) => {
      if (!mode) return;
      lastClientX = event.clientX;
      lastClientY = event.clientY;
      if (animationFrame) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        if (!mode) return;
        const dx = lastClientX - startX;
        const dy = lastClientY - startY;

        if (mode === 'move') {
          const next = clampPosition(startSize, startPosX + dx, startPosY + dy);
          setCompanion((current) => ({ ...current, x: next.x, y: next.y }));
          return;
        }

        let sizeDelta = 0;
        if (resizeHandle === 'ml') sizeDelta = -dx;
        else if (resizeHandle === 'mr') sizeDelta = dx;
        else if (resizeHandle === 'tm') sizeDelta = -dy;
        else if (resizeHandle === 'bm') sizeDelta = dy;
        else {
          const handleXSign = resizeHandle?.includes('l') ? -1 : 1;
          const handleYSign = resizeHandle?.includes('t') ? -1 : 1;
          const sizeDeltaX = handleXSign * dx;
          const sizeDeltaY = handleYSign * dy;
          sizeDelta = Math.abs(sizeDeltaX) > Math.abs(sizeDeltaY) ? sizeDeltaX : sizeDeltaY;
        }

        const nextSize = Math.max(48, Math.min(240, startSize + sizeDelta));
        const frameBefore = getFrameDimensions(startSize);
        const frameAfter = getFrameDimensions(nextSize);

        const anchorLeft = resizeHandle?.includes('l');
        const anchorRight = resizeHandle?.includes('r');
        const anchorTop = resizeHandle?.includes('t');
        const anchorBottom = resizeHandle?.includes('b');
        const horizontalShift = anchorLeft ? -(frameAfter.width - frameBefore.width) / 2 : anchorRight ? (frameAfter.width - frameBefore.width) / 2 : 0;
        const verticalShift = anchorTop ? -(frameAfter.height - frameBefore.height) / 2 : anchorBottom ? (frameAfter.height - frameBefore.height) / 2 : 0;

        const next = clampPosition(nextSize, startPosX + horizontalShift, startPosY + verticalShift);
        setCompanion((current) => ({ ...current, size: nextSize, x: next.x, y: next.y }));
      });
    };

    const handleMouseUp = () => {
      mode = null;
      resizeHandle = null;
    };

    media.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      media.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }

  function addCustomWeather() {
    const cleanName = customWeatherName.trim();
    if (!cleanName) return;
    const customWeather = {
      id: crypto.randomUUID(),
      label: cleanName,
      emoji: customWeatherEmoji.trim() || '🌙',
      image: customWeatherImage,
      value: 3,
      hex: quoteBg || '#739f62'
    };
    setCustomWeathers([...customWeathers, customWeather]);
    setSelectedMood(cleanName);
    setCustomWeatherName('');
    setCustomWeatherEmoji('🌙');
    setCustomWeatherImage('');
  }

  function handlePetSceneMove(event) {
    if (petMood === 'snack' || petMood === 'happy') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const distance = Math.hypot(x - petPosition.x, y - petPosition.y);
    if (distance < 18) {
      petTheDog();
    }
  }

  function petTheDog() {
    setPetHappiness((current) => Math.min(100, current + 10));
    setPetMood('happy');
    setPetBubble('prrr');
    window.setTimeout(() => {
      setPetMood('walking');
      setPetBubble('');
    }, 1300);
  }

  function feedTheDog() {
    setPetHappiness((current) => Math.min(100, current + 18));
    setPetTreats((current) => current + 1);
    setPetMood('snack');
    setPetBubble('nom nom');
    window.setTimeout(() => {
      setPetMood('walking');
      setPetBubble('');
    }, 1500);
  }

  function addCustomQuote() {
    const quote = customQuoteDraft.trim();
    if (!quote) return;
    setCustomQuotes([...customQuotes, quote]);
    setQuoteIndex(quotes.length + customQuotes.length);
    setCustomQuoteDraft('');
  }

  function deleteCustomQuote(quoteToDelete) {
    setCustomQuotes(customQuotes.filter((quote) => quote !== quoteToDelete));
    setQuoteIndex(0);
  }

  function deleteCustomWeather(label) {
    setCustomWeathers(customWeathers.filter((weather) => weather.label !== label));
    if (selectedMood === label) setSelectedMood('Calm');
  }

  function createPin(pin) {
    localStorage.setItem(PIN_KEY, pin);
    setHasPin(true);
    setLocked(false);
  }

  if (locked) {
    return <PrivacyGate hasPin={hasPin} onCreatePin={createPin} onUnlock={() => setLocked(false)} />;
  }

  return (
    <main className={`personalized-site design-${selectedDesign} ${comfortMode ? 'comfort-mode' : ''} min-h-screen overflow-hidden bg-sand-50 pb-24 text-ink lg:pb-0`} style={themeStyle}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-sage-200/70 blur-3xl" />
        <div className="absolute right-0 top-56 h-96 w-96 rounded-full bg-sand-200/80 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-100/70 blur-3xl" />
      </div>


      <nav className="sticky top-0 z-20 px-4 pt-4">
        <div className="site-nav-shell mx-auto max-w-7xl rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-soft backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <a className="flex items-center gap-3" href="#home">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sage-700 text-white shadow-lift">
                <Waves size={23} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-sage-900">Quiet Journal Journey</p>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-600">Private daily journal</p>
              </div>
            </a>
            <div className="site-nav-actions flex flex-1 flex-wrap items-center justify-end gap-3">
              {user ? (
                <div className="rounded-3xl border border-sage-200 bg-white px-4 py-2 text-right text-xs font-extrabold text-sage-950 shadow-lift">
                  <p>{user.displayName || user.email}</p>
                  <p className="text-sage-500">{cloudStatus}</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-sage-200 bg-white px-4 py-2 text-xs font-extrabold text-sage-950 shadow-lift">
                  {authLoading ? 'Checking login...' : 'Sign in to sync your private entries'}
                </div>
              )}
              {user ? (
                <button className="rounded-full border border-sage-200 bg-white/80 px-5 py-3 text-sm font-bold text-sage-800 shadow-lift transition hover:-translate-y-1 hover:bg-white" onClick={handleSignOut} type="button">
                  Sign out
                </button>
              ) : (
                <button className="rounded-full border border-sage-200 bg-white/80 px-5 py-3 text-sm font-bold text-sage-800 shadow-lift transition hover:-translate-y-1 hover:bg-white" onClick={signInWithGoogle} disabled={authLoading} type="button">
                  Sign in with Google
                </button>
              )}
              <button className={`rounded-full border px-5 py-3 text-sm font-bold shadow-lift transition hover:-translate-y-1 ${comfortMode ? 'border-sage-800 bg-sage-900 text-white' : 'border-sage-200 bg-white/80 text-sage-800 hover:bg-white'}`} onClick={() => setComfortMode(!comfortMode)} type="button">
                Comfort mode
              </button>
              <button className="rounded-full border border-sage-200 bg-white/80 px-5 py-3 text-sm font-bold text-sage-800 shadow-lift transition hover:-translate-y-1 hover:bg-white" onClick={() => setLocked(true)} type="button">
                Lock space
              </button>
            </div>
          </div>
          <div className="site-nav-links mt-4 hidden flex-wrap gap-2 border-t border-sage-100/80 pt-4 lg:flex">
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#journal">Journal</a>
            <button className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" onClick={() => setCustomizerOpen(true)} type="button">Design</button>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#about">About</a>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#resources">Resources</a>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#articles">Articles</a>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#tips">Tips</a>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#privacy">Privacy</a>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#terms">Terms</a>
            <a className="rounded-full border border-sage-200 bg-white/95 px-4 py-2 text-sm font-extrabold text-sage-950 transition hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white" href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <section id="home" className="mx-auto grid max-w-7xl gap-8 px-6 pb-10 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-soft backdrop-blur lg:p-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-2 text-sm font-bold text-sage-800">
              <Sparkles size={17} /> Today can be held softly
            </div>
            <h1 className="font-display text-6xl font-bold leading-none tracking-tight text-sage-950">Your private daily journal for brighter thoughts.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-sage-800">Write one honest entry, collect small good moments, and turn reflection into a gentle habit you actually want to return to.</p>
            <div className="mt-6 grid gap-3 rounded-3xl border border-sage-100 bg-white/75 p-5 text-sm font-semibold leading-6 text-sage-800 sm:grid-cols-3">
              <div><span className="font-extrabold text-sage-950">1.</span> Pick how you feel.</div>
              <div><span className="font-extrabold text-sage-950">2.</span> Write one honest sentence.</div>
              <div><span className="font-extrabold text-sage-950">3.</span> Save it privately, or sync with Google.</div>
            </div>
            <div className="mt-4 rounded-3xl border border-sage-200 bg-sage-50/90 p-5 text-sm font-bold leading-6 text-sage-900">
              Your diary is private. Signing in only lets you sync your own entries across devices — other visitors cannot see them.
            </div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage-900 px-5 py-3 text-sm font-extrabold text-white shadow-lift transition hover:-translate-y-1 hover:bg-sage-800 lg:hidden" onClick={() => setCustomizerOpen(true)} type="button">
              <Palette size={17} /> Customize the look
            </button>
            <div className="mt-9 grid gap-4 sm:grid-cols-4">
              <StatCard icon={BookOpen} label="Entries" value={entries.length} tone="bg-sage-100 text-sage-800" />
              <StatCard icon={Sunrise} label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} tone="bg-sand-100 text-sand-500" />
              <StatCard icon={HeartHandshake} label="Average mood" value={averageMood} tone="bg-teal-100 text-teal-700" />
              <StatCard icon={Sparkles} label="Reward level" value={`${rewardLevel.emoji} ${rewardLevel.title}`} tone="bg-rose-50 text-rose-700" />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="quote-card quote-card-premium h-full rounded-3xl border border-white/70 p-8 shadow-soft">
            <Quote className="mb-8 opacity-80" size={34} />
            <p className="quote-main-text font-bold leading-tight" style={{ fontFamily: activeQuoteFont, fontSize: activeQuoteSize, color: quoteStyle.textColor, lineHeight: 1.45 }}>“{quoteLibrary[quoteIndex % quoteLibrary.length]}”</p>
            <button className="quote-button mt-8 rounded-full bg-white px-5 py-3 text-sm font-extrabold shadow-lift transition hover:-translate-y-1 hover:bg-sage-50" onClick={() => setQuoteIndex((quoteIndex + 1) % quoteLibrary.length)}>
              Another calming quote
            </button>

            <div className="totoro-container group">
              {companion.rainEnabled && (
                <>
                  <div className="rain-drop" style={{ left: '10%', animationDelay: '0s' }}></div>
                  <div className="rain-drop" style={{ left: '25%', animationDelay: '0.4s' }}></div>
                  <div className="rain-drop" style={{ left: '40%', animationDelay: '0.2s' }}></div>
                  <div className="rain-drop" style={{ left: '60%', animationDelay: '0.8s' }}></div>
                  <div className="rain-drop" style={{ left: '75%', animationDelay: '0.6s' }}></div>
                  <div className="rain-drop" style={{ left: '90%', animationDelay: '1s' }}></div>
                </>
              )}
              
              {companion.sootSpritesEnabled && (
                <>
                  <div className="soot-sprite" style={{ left: '15%', animationDelay: '0s' }}>●</div>
                  <div className="soot-sprite" style={{ right: '20%', animationDelay: '0.7s' }}>●</div>
                </>
              )}
              
              <div className="totoro-companion-wrap relative" style={{ fontSize: `${companion.size}px`, lineHeight: 1 }}>
                {companion.leaf && !companionIsUploadedMedia && <div className="totoro-leaf pointer-events-none" style={{ fontSize: `${companion.size * 0.5}px` }}>{companion.leaf}</div>}
                <div
                  ref={companionMediaRef}
                  className={`companion-media-frame cursor-pointer ${companionSelected ? 'is-selected' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCompanionSelected(true);
                  }}
                  style={{
                    width: `${companionFrameWidth}px`,
                    height: `${companionFrameHeight}px`,
                    transform: `translate(${companion.x || 0}px, ${companion.y || 0}px)`
                  }}
                >
                  <div className={`companion-visual companion-${companion.animation}`}>
                    {companionIsVideo ? (
                      <video
                        autoPlay
                        className="companion-video"
                        loop
                        muted
                        playsInline
                        src={companion.character}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : companion.character?.startsWith('data:') || companion.character?.startsWith('http') ? (
                      <img src={companion.character} alt="Companion" className="companion-img" style={{ width: '100%', height: '100%' }} draggable="false" />
                    ) : (
                      <div className={`totoro companion-${companion.animation}`}>{companion.character}</div>
                    )}
                  </div>
                  {companionSelected && (
                    <>
                      <span className="companion-selection-border" />
                      <span className="companion-handle companion-handle-tl" data-resize-handle="tl" />
                      <span className="companion-handle companion-handle-tm" data-resize-handle="tm" />
                      <span className="companion-handle companion-handle-tr" data-resize-handle="tr" />
                      <span className="companion-handle companion-handle-ml" data-resize-handle="ml" />
                      <span className="companion-handle companion-handle-mr" data-resize-handle="mr" />
                      <span className="companion-handle companion-handle-bl" data-resize-handle="bl" />
                      <span className="companion-handle companion-handle-bm" data-resize-handle="bm" />
                      <span className="companion-handle companion-handle-br" data-resize-handle="br" />
                    </>
                  )}
                  <button
                    className="companion-upload-button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      companionInputRef.current?.click();
                    }}
                    type="button"
                  >
                    <ImagePlus size={18} />
                  </button>
                  <input ref={companionInputRef} accept="image/*,image/gif,video/*" className="hidden" onChange={handleDirectCompanionUpload} type="file" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className="rounded-3xl border border-sage-100 bg-white/85 p-6 shadow-lift backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-sage-100 text-sage-800">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-widest text-sage-700">Today’s journal reward</p>
                <h2 className="mt-2 text-2xl font-extrabold text-ink">{rewardLevel.emoji} {rewardLevel.title} energy</h2>
                <p className="mt-2 max-w-2xl leading-7 text-sage-900">{rewardLevel.next} Save a reflection to collect another tiny spark, keep your archive glowing, and turn journaling into a habit that feels genuinely nice to return to.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[30rem]">
              <div className="rounded-3xl border border-sage-100 bg-sage-50/80 p-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-sage-600">Current streak</p>
                <p className="mt-2 text-2xl font-extrabold text-sage-950">{streak} day{streak === 1 ? '' : 's'}</p>
                <p className="mt-1 text-sm font-semibold text-sage-700">Little steps still count.</p>
              </div>
              <div className="rounded-3xl border border-sage-100 bg-rose-50/70 p-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-rose-500">Weekly glow</p>
                <p className="mt-2 text-2xl font-extrabold text-sage-950">{weeklyCheckIns}/{weeklyGoal}</p>
                <p className="mt-1 text-sm font-semibold text-sage-700">Check-ins this week.</p>
              </div>
              <div className="rounded-3xl border border-sage-100 bg-sand-50/80 p-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-sand-500">Next bloom</p>
                <p className="mt-2 text-2xl font-extrabold text-sage-950">{entriesToNextReward === 0 ? 'Unlocked' : `${entriesToNextReward} away`}</p>
                <p className="mt-1 text-sm font-semibold text-sage-700">Until your next level.</p>
              </div>
            </div>
            <a className="inline-flex shrink-0 rounded-full bg-sage-900 px-5 py-3 text-sm font-extrabold text-white shadow-lift transition hover:-translate-y-1 hover:bg-sage-800" href="#journal">
              Write today’s entry
            </a>
          </div>
        </div>
      </section>

      <ThemeStudio
        companion={companion}
        customColor={customColor}
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        onCompanionChange={setCompanion}
        onCustomColorChange={setCustomColor}
        onDesignChange={setSelectedDesign}
        onQuoteBgChange={setQuoteBg}
        onThemeChange={setSelectedTheme}
        quoteBg={quoteBg}
        selectedDesign={selectedDesign}
        selectedTheme={selectedTheme}
      />

      <section id="journal" className="mx-auto max-w-7xl px-6 py-8">
        <form className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur lg:p-8" onSubmit={saveEntry}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-sage-600">Today’s journal entry</p>
              <h2 className="mt-1 text-3xl font-extrabold text-ink">Write how you feel today.</h2>
            </div>
            <div className="rounded-full bg-sage-50 px-4 py-2 text-sm font-bold text-sage-700">{formatDate(new Date().toISOString())}</div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3 md:grid-cols-5">
            {weatherOptions.map((mood) => (
              <button
                className={`group relative rounded-3xl border p-4 text-center transition hover:-translate-y-1 ${selectedMood === mood.label ? 'border-sage-500 bg-sage-100 shadow-lift' : 'border-sage-100 bg-white hover:bg-sage-50'}`}
                key={mood.label}
                onClick={() => setSelectedMood(mood.label)}
                type="button"
              >
                {mood.id && (
                  <span
                    className="absolute right-2 top-2 rounded-full bg-white/80 px-2 text-xs font-bold text-sage-500 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteCustomWeather(mood.label);
                    }}
                  >
                    ×
                  </span>
                )}
                <WeatherGlyph mood={mood} />
                <span className="mt-2 block text-sm font-bold text-sage-800">{mood.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-6 rounded-3xl border border-sage-100 bg-sage-50/70 p-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm font-bold text-sage-800">
                Writing font
                <select className="min-w-[160px] rounded-2xl border border-sage-100 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-sage-400 focus:ring-4 focus:ring-sage-100" onChange={(event) => setJournalStyle({ ...journalStyle, fontId: event.target.value })} value={journalStyle.fontId}>
                  {journalFontOptions.map((font) => (
                    <option key={font.id} value={font.id}>{font.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm font-bold text-sage-800">
                Writing size
                <select className="min-w-[120px] rounded-2xl border border-sage-100 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-sage-400 focus:ring-4 focus:ring-sage-100" onChange={(event) => setJournalStyle({ ...journalStyle, sizeId: event.target.value })} value={journalStyle.sizeId}>
                  {journalSizeOptions.map((size) => (
                    <option key={size.id} value={size.id}>{size.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-sage-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sage-700"><ImagePlus size={16} /> Custom emotion</div>
            <div className="grid gap-3 md:grid-cols-5">
              <input
                className="rounded-2xl border border-sage-100 bg-sage-50/80 px-4 py-3 font-semibold outline-none transition focus:border-sage-400 focus:bg-white"
                onChange={(event) => setCustomWeatherName(event.target.value)}
                placeholder="Name"
                value={customWeatherName}
              />
              <input
                className="rounded-2xl border border-sage-100 bg-sage-50/80 px-4 py-3 font-semibold outline-none transition focus:border-sage-400 focus:bg-white"
                maxLength={4}
                onChange={(event) => setCustomWeatherEmoji(event.target.value)}
                placeholder="Emoji"
                value={customWeatherEmoji}
              />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-sage-300 bg-sage-50/80 px-4 py-3 text-sm font-bold text-sage-800 transition hover:bg-sage-100 md:col-span-2">
                <ImagePlus size={18} /> Upload image
                <input accept="image/*" className="hidden" onChange={handleWeatherImageUpload} type="file" />
              </label>
              <button className="rounded-2xl bg-sage-800 px-4 py-3 font-bold text-white shadow-lift transition hover:-translate-y-1 hover:bg-sage-700" onClick={addCustomWeather} type="button">
                Add emotion
              </button>
            </div>
            {customWeatherImage && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sage-50 p-3 text-sm font-semibold text-sage-800">
                <img alt="Custom weather preview" className="h-12 w-12 rounded-2xl object-cover" src={customWeatherImage} />
                Image ready — add a name, then save it as a custom emotion.
              </div>
            )}
            <p className="mt-3 text-xs font-bold text-sage-800">Uploaded images stay in this browser with your local journal settings.</p>
          </div>

          <label className="mb-3 block text-sm font-bold text-sage-800" htmlFor="entry-title">Title</label>
          <input
            className="mb-6 w-full rounded-3xl border border-sage-100 bg-sage-50/80 px-5 py-4 text-lg font-semibold outline-none transition focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
            id="entry-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Name this moment"
            value={title}
          />

          <div className="mb-6 rounded-3xl bg-gradient-to-r from-sage-50 to-sand-50 p-6 shadow-inner">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sage-700"><Feather size={16} /> Guided reflection</div>
            <p className="font-display text-2xl font-bold leading-relaxed text-sage-950">{activePrompt}</p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-sage-900 shadow-lift transition hover:-translate-y-1 hover:bg-sage-50" onClick={() => setActivePrompt(prompts[(prompts.indexOf(activePrompt) + 1) % prompts.length])} type="button">
              <Sparkles size={15} /> Try another prompt
            </button>
          </div>

          <div className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="rounded-3xl border border-sage-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-sage-600">Today’s mini ritual</p>
                  <h3 className="mt-2 text-xl font-extrabold text-ink">Complete {completedQuestCount}/3 gentle steps</h3>
                </div>
                <div className="rounded-full bg-sage-100 px-3 py-2 text-sm font-extrabold text-sage-800">+1 spark</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {journalQuest.map((step) => (
                  <div key={step.label} className={`rounded-full px-4 py-2 text-sm font-bold transition ${step.done ? 'bg-sage-900 text-white shadow-lift' : 'border border-sage-100 bg-sage-50 text-sage-700'}`}>
                    {step.done ? '✓' : '○'} {step.label}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-sage-800">{journalNudge}</p>
            </div>
            <div className="rounded-3xl border border-sage-100 bg-gradient-to-br from-sand-50 to-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-sand-500">Weekly bloom</p>
              <p className="mt-2 text-3xl font-extrabold text-sage-950">{weeklyCheckIns}/{weeklyGoal}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-sage-700">{weeklyCheckIns >= weeklyGoal ? 'You hit your soft weekly rhythm already.' : `${weeklyGoal - weeklyCheckIns} more check-in${weeklyGoal - weeklyCheckIns === 1 ? '' : 's'} to fill this week.`}</p>
            </div>
            <div className="rounded-3xl border border-sage-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-rose-500">Next reward</p>
              <p className="mt-2 text-3xl font-extrabold text-sage-950">{rewardLevel.emoji}</p>
              <p className="mt-2 text-base font-extrabold text-sage-900">{entriesToNextReward === 0 ? 'Your journal garden is in bloom.' : `${entriesToNextReward} more ${entriesToNextReward === 1 ? 'entry' : 'entries'} to level up.`}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-sage-700">Keep stacking tiny reflections — they add up beautifully.</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-sage-100 bg-sage-50/80 p-3">
            <span className="mr-1 text-xs font-extrabold uppercase tracking-widest text-sage-700">Format</span>
            <button className="rounded-lg bg-white p-2 shadow-sm transition hover:bg-sage-50" onClick={() => toggleBulletList(entryBodyRef, setBody)} title="Bullet points" type="button">• List</button>
            <div className="mx-2 h-6 w-px bg-sage-200"></div>
            <span className="mr-1 text-xs font-extrabold uppercase tracking-widest text-sage-700">Add mood</span>
            {quickEmojis.map((emoji) => (
              <button key={emoji} className="rounded-full bg-white px-2 py-1 text-base shadow-sm transition hover:-translate-y-0.5 hover:bg-sage-50" onClick={() => insertQuickEmoji(emoji)} type="button">
                {emoji}
              </button>
            ))}
            <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-full bg-sage-800 px-4 py-2 text-xs font-extrabold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-sage-700">
              <ImagePlus size={14} /> Add photo
              <input accept="image/*" className="hidden" onChange={handleEntryImageUpload} type="file" />
            </label>
          </div>

          <div
            ref={entryBodyRef}
            className="journal-editor min-h-72 w-full overflow-auto rounded-3xl border border-sage-100 bg-white px-5 py-5 outline-none transition focus:border-sage-400 focus:ring-4 focus:ring-sage-100"
            contentEditable
            suppressContentEditableWarning
            style={{ fontFamily: activeJournalFont, fontSize: activeJournalSize, lineHeight: 1.85, color: '#24312e', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            onInput={(e) => setBody(e.currentTarget.innerHTML)}
            data-placeholder="Let your thoughts land here. Add emojis or pictures to capture today better. No fixing required."
          />
          <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white shadow-lift transition hover:-translate-y-1 hover:bg-sage-800" type="submit">
            <Plus size={19} /> Save today’s reflection
          </button>
          {saveReward && (
            <div className="reward-toast mt-5 rounded-3xl border border-sage-100 bg-sage-900 p-5 font-extrabold leading-7 text-white shadow-soft">
              {saveReward}
            </div>
          )}
        </form>

        <div className="mt-8 grid gap-8 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur lg:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-sage-600">Reflection pattern</p>
                <h2 className="mt-1 text-3xl font-extrabold text-ink">Your last seven journal check-ins</h2>
              </div>
              <Moon className="text-sage-600" />
            </div>
            <MoodChart entries={entries} weatherOptions={weatherOptions} />
            <div className="mt-5 rounded-3xl bg-white p-5 text-sm font-bold leading-6 text-sage-900 shadow-inner">
              {weeklySummary}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-sage-600">Journal calendar</p>
                <h2 className="mt-1 text-2xl font-extrabold text-ink">Track your writing days</h2>
              </div>
              <CalendarDays className="text-sage-700" />
            </div>
            <div className="mb-4 flex items-center justify-between rounded-3xl bg-sage-50 p-3">
              <button className="rounded-full bg-white px-3 py-2 text-sm font-extrabold text-sage-800 shadow-sm" onClick={() => setCalendarMonth(shiftMonthKey(calendarMonth, -1))} type="button">‹</button>
              <p className="font-extrabold text-sage-950">{formatMonthLabel(calendarMonth)}</p>
              <button className="rounded-full bg-white px-3 py-2 text-sm font-extrabold text-sage-800 shadow-sm" onClick={() => setCalendarMonth(shiftMonthKey(calendarMonth, 1))} type="button">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-extrabold uppercase tracking-wider text-sage-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEntries = day ? entriesByDate[day.dateKey] || [] : [];
                const isSelected = day?.dateKey === selectedCalendarDate;
                const isToday = day?.dateKey === todayISO();
                return day ? (
                  <button
                    className={`relative aspect-square rounded-2xl border text-sm font-extrabold transition hover:-translate-y-0.5 ${isSelected ? 'border-sage-800 bg-sage-900 text-white shadow-lift' : isToday ? 'border-sage-300 bg-sage-100 text-sage-900' : 'border-sage-100 bg-white text-sage-800 hover:bg-sage-50'}`}
                    key={day.dateKey}
                    onClick={() => setSelectedCalendarDate(day.dateKey)}
                    type="button"
                  >
                    {day.day}
                    {dayEntries.length > 0 && <span className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? 'bg-white' : 'bg-sage-700'}`} />}
                  </button>
                ) : <div key={`blank-${index}`} />;
              })}
            </div>
            <div className="mt-5 rounded-3xl bg-white p-4 shadow-inner">
              <p className="text-xs font-extrabold uppercase tracking-widest text-sage-600">{selectedCalendarDate}</p>
              {selectedDateEntries.length ? (
                <div className="mt-3 space-y-3">
                  {selectedDateEntries.map((entry) => (
                    <button className="w-full rounded-2xl border border-sage-100 bg-sage-50 p-3 text-left transition hover:bg-white" key={entry.id} onClick={() => setSelectedEntry(entry)} type="button">
                      <p className="font-extrabold text-sage-950">{entry.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-sage-700">{getPlainTextFromHtml(entry.body || entry.prompt || '') || 'Photo entry'}</p>
                    </button>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm font-semibold leading-6 text-sage-700">No entry for this date yet. Pick this day as your next little check-in.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur lg:p-8">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className="text-sage-700" />
              <h2 className="text-2xl font-extrabold text-ink">Your positivity archive</h2>
            </div>
            <div className="max-h-96 space-y-4 overflow-y-auto pr-2">
              {!entries.length && <p className="rounded-3xl bg-white p-5 font-semibold leading-7 text-sage-900 shadow-inner">No entries yet. Start with one sentence if that is all you have today.</p>}
              {entries.map((entry) => {
                const effectiveMoodLabel = { 'Grounded': 'Happy', 'Soft': 'Calm', 'Okay': 'Neutral', 'Heavy': 'Sad', 'Stormy': 'Anxious' }[entry.mood] || entry.mood;
                const mood = weatherOptions.find((item) => item.label === effectiveMoodLabel) || weatherOptions.find(m => m.label === entry.mood) || moods[2];
                return (
                  <article
                    className="group cursor-pointer rounded-3xl border border-sage-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lift"
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sage-700"><WeatherGlyph mood={mood} size="text-base" />{entry.mood} · {formatDate(entry.createdAt)}</div>
                        <h3 className="text-xl font-extrabold text-ink">{entry.title}</h3>
                      </div>
                      <button className="rounded-full p-2 text-sage-400 opacity-70 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100" onClick={() => deleteEntry(entry.id)} type="button" aria-label="Delete entry">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-4 whitespace-pre-line leading-7 text-sage-800">
                      {(() => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = entry.body || entry.prompt || '';
                        const images = tempDiv.querySelectorAll('img');
                        let preview = tempDiv.textContent || tempDiv.innerText || '';
                        if (images.length > 0) preview = '📷 ' + preview;
                        return preview.trim();
                      })()}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className="quote-card quote-card-premium rounded-3xl border border-white/70 p-8 shadow-soft">
          <Quote className="mb-8 opacity-80" size={34} />
          <p className="quote-main-text font-bold leading-tight" style={{ fontFamily: activeQuoteFont, fontSize: activeQuoteSize, color: quoteStyle.textColor, lineHeight: 1.45 }}>“{quoteLibrary[quoteIndex % quoteLibrary.length]}”</p>
          <button className="quote-button mt-8 rounded-full bg-white px-5 py-3 text-sm font-extrabold shadow-lift transition hover:-translate-y-1 hover:bg-sage-50" onClick={() => setQuoteIndex((quoteIndex + 1) % quoteLibrary.length)}>
            Another calming quote
          </button>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          eyebrow="About Quiet Journal Journey"
          title="A daily journal that rewards tiny positive moments."
          text="Quiet Journal Journey is a private writing space built to make journaling feel light, repeatable, and encouraging — one honest entry at a time."
        />
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard icon={Lock} title="Private by design">
            Your entries are saved to your Google-linked account when you sign in, or only in your browser when you do not. Other visitors opening the site will see their own journal, not yours.
          </InfoCard>
          <InfoCard icon={Leaf} title="Calm, minimal rhythm">
            The interface uses soft colors, spacious cards, and tiny prompts so the experience feels more like exhaling than checking off a task.
          </InfoCard>
          <InfoCard icon={Compass} title="Built for daily understanding">
            Mood tracking and prompts help you notice patterns over time, without turning emotions into a scorecard.
          </InfoCard>
          <InfoCard icon={ImagePlus} title="Custom emotions">
            Create custom moods with your own words, emoji, or uploaded images so your check-ins feel personal and expressive.
          </InfoCard>
          <InfoCard icon={Palette} title="A look that fits you">
            Choose color themes, card styles, and quote-card colors. Each visitor can make the space feel like their own.
          </InfoCard>
          <InfoCard icon={HeartHandshake} title="Positive self-awareness">
            The site offers journaling guidance and reflection tools for everyday self-understanding, small wins, and clearer personal direction.
          </InfoCard>
        </div>
      </section>

      <section id="resources" className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          eyebrow="Positive reflection tools"
          title="Small practices that make journaling easier."
          text="Use these when you want a softer entry, a little gratitude, or a calmer way to close the day."
        />
        <div className="mb-6 grid gap-5 md:grid-cols-2">
          <InfoCard icon={ShieldCheck} title="A clear mind moment">
            Pause before you write: take one slow breath, notice your current state, and choose one word that describes what you want more of today.
          </InfoCard>
          <InfoCard icon={Mail} title="Share the good when you want">
            If a journal entry helps you understand yourself, you can choose to share a positive insight with someone you trust — only if it feels right.
          </InfoCard>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {resources.map((resource) => (
            <InfoCard icon={HeartHandshake} title={resource.title} key={resource.title}>
              {resource.text}
            </InfoCard>
          ))}
        </div>
      </section>

      <section id="articles" className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          eyebrow="Wellness Library"
          title="Original short articles for gentler self-reflection."
          text="These short reflections help visitors begin private journaling with more clarity, kindness, and curiosity."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {wellnessArticles.map((article, index) => (
            <article className="customizable-card rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lift backdrop-blur transition hover:-translate-y-1 hover:bg-white/95" key={article.title}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-sage-800">Article {index + 1}</span>
                <span className="text-sm font-bold text-sage-600">{article.read}</span>
              </div>
              <h3 className="text-2xl font-extrabold leading-tight text-ink">{article.title}</h3>
              <p className="mt-4 leading-8 text-sage-800">{article.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tips" className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-12">
        <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-sand-100 to-sage-100 p-8 shadow-soft lg:col-span-5 lg:p-10">
          <Newspaper className="mb-7 text-sage-700" size={36} />
          <p className="text-sm font-bold uppercase tracking-widest text-sage-700">Journaling tips</p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-tight text-sage-950">A softer way to start writing.</h2>
          <p className="mt-5 leading-8 text-sage-800">Think of journaling as a conversation with yourself. The goal is not to be profound; it is to be present.</p>
        </div>
        <div className="grid gap-4 lg:col-span-7">
          {tips.map((tip, index) => (
            <div className="flex items-start gap-4 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lift backdrop-blur" key={tip}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-700 font-bold text-white">{index + 1}</div>
              <p className="pt-2 text-lg font-semibold leading-7 text-sage-900">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          eyebrow="Privacy Policy"
          title="Your reflections belong to you."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard icon={Shield} title="What is stored">
            Journal entries are saved to your Google-linked cloud account when you sign in. If you use the site without signing in, entries, mood choices, custom emotion labels/images, and your optional PIN stay in this browser using local storage.
          </InfoCard>
          <InfoCard icon={Lock} title="What visitors can see">
            Other people who open the website do not see your entries. Their browser creates a separate journal space, and signed-in entries are separated by Google account.
          </InfoCard>
          <InfoCard icon={ShieldCheck} title="Google sign-in">
            Google sign-in is used so your journal can follow you across devices. Your email is used to identify your account and sync your entries.
          </InfoCard>
          <InfoCard icon={FileText} title="Advertising and Google AdSense">
            This site may use Google AdSense to show ads. Google and its partners may use cookies or similar technologies to serve and measure ads based on visits to this and other websites. Visitors can manage ad personalization through Google Ads Settings.
          </InfoCard>
          <InfoCard icon={Mail} title="Contact for privacy questions">
            For privacy questions, feedback, or requests, contact the site owner at atastymealy@gmail.com.
          </InfoCard>
        </div>
      </section>

      <section id="terms" className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="sticky top-28 rounded-3xl border border-white/70 bg-white/75 p-8 shadow-soft backdrop-blur">
            <Scale className="mb-7 text-sage-700" size={36} />
            <p className="text-sm font-bold uppercase tracking-widest text-sage-600">Helpful notes</p>
            <h2 className="mt-3 font-display text-5xl font-bold leading-tight text-sage-950">A simple space for personal writing.</h2>
          </div>
        </div>
        <div className="space-y-5 lg:col-span-7">
          <InfoCard icon={HeartHandshake} title="For personal reflection">
            Quiet Journal Journey is made for private journaling, positivity, and everyday self-understanding. Use it as a space to notice your thoughts and what matters to you.
          </InfoCard>
          <InfoCard icon={Sunrise} title="Choose your own pace">
            There is no perfect streak and no pressure to write a lot. A tiny note, a good thing, or one honest sentence is enough.
          </InfoCard>
          <InfoCard icon={PenLine} title="Write what feels useful">
            You can use prompts, skip prompts, write a long entry, or keep it short. The journal is here to help you understand your current state and what you want next.
          </InfoCard>
          <InfoCard icon={Shield} title="Content ownership">
            Your writing remains yours. Signed-in entries are stored under your Google-linked account, while signed-out entries stay in your browser storage.
          </InfoCard>
          <InfoCard icon={FileText} title="Advertising disclosure">
            The site may show third-party ads to support free access. Ad providers may set cookies or use similar technologies according to their own policies.
          </InfoCard>
          <InfoCard icon={Mail} title="Questions about these terms">
            Contact atastymealy@gmail.com if you have questions about the site, privacy, or these terms.
          </InfoCard>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-6 py-14">
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-sage-900 text-white shadow-soft">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-10">
              <Mail className="mb-7 text-sage-100" size={36} />
              <p className="text-sm font-bold uppercase tracking-widest text-sage-200">Contact</p>
              <h2 className="mt-3 font-display text-5xl font-bold leading-tight">Questions, feedback, or partnership ideas?</h2>
              <p className="mt-5 leading-8 text-sage-100">Send questions, feedback, collaboration ideas, or privacy requests to the site owner. This helps visitors, advertisers, and review teams understand who runs the site.</p>
            </div>
            <div className="bg-white/10 p-8 lg:p-10">
              <div className="rounded-3xl bg-white/95 p-6 text-ink shadow-lift">
                <p className="text-sm font-bold uppercase tracking-widest text-sage-600">Site owner email</p>
                <a className="mt-3 block break-words text-2xl font-extrabold text-sage-900 underline decoration-sage-300 underline-offset-4" href="mailto:atastymealy@gmail.com">
                  atastymealy@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-dashed border-sage-300 bg-white/60 p-8 text-center shadow-lift backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-widest text-sage-600">Support this project</p>
          <h2 className="mt-3 text-2xl font-extrabold text-ink">Help keep Quiet Journal Journey free and peaceful</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-sage-700">This space may be supported by gentle, non-intrusive advertising after approval. Ads will stay outside the private writing area so journaling remains calm.</p>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-6">
        <div className="rounded-3xl border border-white/70 bg-white/60 p-6 text-center text-sm leading-7 text-sage-700 shadow-lift backdrop-blur">
          <div className="mb-3 flex flex-wrap justify-center gap-4 font-bold text-sage-800">
            <a href="#home">Home</a>
            <button onClick={() => setCustomizerOpen(true)} type="button">Design</button>
            <a href="#about">About</a>
            <a href="#resources">Resources</a>
            <a href="#articles">Articles</a>
            <a href="#tips">Tips</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </div>
          Quiet Journal Journey is a private positivity journal for noticing your thoughts, collecting small good moments, and understanding what you want next.
        </div>
      </footer>

      <div className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-3 gap-2 rounded-3xl border border-sage-100 bg-white/95 p-2 text-xs font-extrabold text-sage-900 shadow-soft backdrop-blur lg:hidden">
        <a className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 hover:bg-sage-50" href="#home"><BookOpen size={18} /> Home</a>
        <a className="flex flex-col items-center gap-1 rounded-2xl bg-sage-900 px-2 py-2 text-white hover:bg-sage-800" href="#journal"><PenLine size={18} /> Write</a>
        <a className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 hover:bg-sage-50" href="#resources"><HeartHandshake size={18} /> Help</a>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm" onClick={() => { if (!isEditingEntry) setSelectedEntry(null); }}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-soft lg:p-9" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                {isEditingEntry ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {weatherOptions.map((mood) => (
                      <button
                        className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${editMood === mood.label ? 'bg-sage-900 text-white' : 'bg-sage-100 text-sage-800 hover:bg-sage-200'}`}
                        key={mood.label}
                        onClick={() => setEditMood(mood.label)}
                        type="button"
                      >
                        <WeatherGlyph mood={mood} size="text-base" /> {mood.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-bold uppercase tracking-widest text-sage-600">{selectedEntry.mood} · {formatDate(selectedEntry.createdAt)}</div>
                )}
                {isEditingEntry ? (
                  <input
                    className="w-full rounded-2xl border border-sage-100 bg-sage-50/80 px-4 py-3 text-2xl font-extrabold text-ink outline-none focus:border-sage-400"
                    onChange={(event) => setEditTitle(event.target.value)}
                    value={editTitle}
                  />
                ) : (
                  <h3 className="mt-2 text-3xl font-extrabold text-ink">{selectedEntry.title}</h3>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!isEditingEntry ? (
                  <button className="rounded-full bg-sage-100 px-4 py-2 text-sm font-extrabold text-sage-900 transition hover:bg-sage-200" onClick={startEditingEntry} type="button">Edit</button>
                ) : (
                  <>
                    <button className="rounded-full bg-sage-100 px-4 py-2 text-sm font-extrabold text-sage-900 transition hover:bg-sage-200" onClick={() => setIsEditingEntry(false)} type="button">Cancel</button>
                    <button className="rounded-full bg-sage-900 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-sage-800" onClick={saveEditedEntry} type="button">Save</button>
                  </>
                )}
                <button className="rounded-full bg-sage-100 px-4 py-2 text-sm font-extrabold text-sage-900 transition hover:bg-sage-200" onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }} type="button">Close</button>
              </div>
            </div>
            {selectedEntry.prompt && !isEditingEntry && (
              <div className="mb-5 rounded-2xl bg-sage-50 p-4 text-sm font-bold leading-7 text-sage-900">
                Reflection prompt: {selectedEntry.prompt}
              </div>
            )}
            {isEditingEntry ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-sage-100 bg-sage-50/80 p-3">
                  <span className="mr-1 text-xs font-extrabold uppercase tracking-widest text-sage-700">Format</span>
                  <button className="rounded-lg bg-white p-2 shadow-sm transition hover:bg-sage-50" onClick={() => toggleBulletList(editBodyRef, setEditBody)} title="Bullet points" type="button">• List</button>
                  <div className="mx-2 h-6 w-px bg-sage-200"></div>
                  <span className="mr-1 text-xs font-extrabold uppercase tracking-widest text-sage-700">Add mood</span>
                  {quickEmojis.map((emoji) => (
                    <button key={emoji} className="rounded-full bg-white px-2 py-1 text-base shadow-sm transition hover:-translate-y-0.5 hover:bg-sage-50" onClick={() => insertEditQuickEmoji(emoji)} type="button">
                      {emoji}
                    </button>
                  ))}
                  <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-full bg-sage-800 px-4 py-2 text-xs font-extrabold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-sage-700">
                    <ImagePlus size={14} /> Add photo
                    <input accept="image/*" className="hidden" onChange={handleEditEntryImageUpload} type="file" />
                  </label>
                </div>
                <div
                  ref={editBodyRef}
                  className="journal-editor min-h-72 w-full overflow-auto rounded-3xl border border-sage-100 bg-white px-5 py-5 outline-none transition focus:border-sage-400 focus:ring-4 focus:ring-sage-100"
                  contentEditable
                  suppressContentEditableWarning
                  style={{ fontFamily: activeJournalFont, fontSize: activeJournalSize, lineHeight: 1.85, color: '#24312e', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  onInput={(e) => setEditBody(e.currentTarget.innerHTML)}
                  data-placeholder="Edit your thoughts here..."
                />
              </>
            ) : (
              <div className="text-lg leading-8 text-sage-900">{renderJournalContent(selectedEntry.body || 'No body text was saved for this entry.')}</div>
            )}
          </div>
        </div>
      )}

      <button
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-sage-900 text-white shadow-lift transition hover:-translate-y-1 hover:bg-sage-800"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        type="button"
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </button>
    </main>
  );
}

export default App;
