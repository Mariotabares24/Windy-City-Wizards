'use client';
import type { Preferences } from './contracts';

export const DEFAULT_PREFS: Preferences = {
  name: 'Mario',
  mode: 'personalized',
  history: true,
  location: 'Chicago',
  colors: [],
};

const KEY = 'cosmic-prefs-v1';
type Listener = (p: Preferences) => void;
const listeners = new Set<Listener>();
let current: Preferences = DEFAULT_PREFS;

function read(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function write(p: Preferences) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage quota etc. */
  }
}

if (typeof window !== 'undefined') {
  current = read();
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    current = read();
    listeners.forEach((l) => l(current));
  });
}

export const prefsStore = {
  get(): Preferences {
    return current;
  },
  set(p: Preferences) {
    current = p;
    write(p);
    listeners.forEach((l) => l(current));
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function isPrivateShopping(p: Preferences): boolean {
  return p.mode === 'solo';
}
