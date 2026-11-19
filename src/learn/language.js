// Track C: interface language (English or French), shared by Learn mode and later Quiz mode.

export const LANGUAGES = ['en', 'fr'];
const STORAGE_KEY = 'hav.lang';

// Storage can be missing or blocked (private mode, blocked site data): never let it break the app.
function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function initialLanguage() {
  const stored = readStored();
  if (LANGUAGES.includes(stored)) return stored;
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

let current = initialLanguage();
const listeners = new Set();
document.documentElement.lang = current;

export const getLanguage = () => current;

export function setLanguage(lang) {
  if (!LANGUAGES.includes(lang) || lang === current) return;
  current = lang;
  document.documentElement.lang = lang; // screen readers pronounce the text in the right language
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not saved: the choice still applies until the page is closed
  }
  listeners.forEach((cb) => cb(lang));
}

/** Calls `cb(lang)` whenever the language changes. Returns an unsubscribe function. */
export function onLanguageChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Text of an organs.json field in the given language. Fields are `{ en, fr }` (see
 * docs/DATA_CONTRACT.md); a plain string is accepted too. Falls back to English, then to ''.
 */
export function localized(value, lang = current) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value.en ?? '';
}
