import type { CosmoIntent, TrendResult } from './types';

// Trend tables ported from the cosmos-agent branch. Occasion is read from the
// shopper's own words rather than a separate field, since this storefront only
// collects a free-text intent plus a formality.
const SEASON = 'Fall 2026';

const GLOBAL = [
  'quiet luxury',
  'linen everything',
  'sheer layers',
  'monochrome sets',
  'oversized blazers',
  'warm minimalism',
];

const BY_OCCASION: Record<string, string[]> = {
  wedding: ['floral midi', 'satin slip', 'lace detail', 'quiet luxury'],
  office: ['power suiting', 'loafers', 'trench coat', 'oversized blazers'],
  date: ['cut-out details', 'statement earrings', 'heeled boots', 'sheer layers'],
  brunch: ['linen sets', 'woven bags', 'printed scarves', 'linen everything'],
  cocktail: ['sequin details', 'structured mini', 'block heels', 'monochrome sets'],
  home: ['warm minimalism', 'bouclé texture', 'layered lighting', 'natural stone'],
  casual: ['denim on denim', 'oversized tees', 'platform sneakers'],
};

// Style tables from the cosmos-agent branch, keyed to the styles the Cosmo
// intake offers.
const BY_STYLE: Record<string, string[]> = {
  minimalist: ['clean lines', 'neutral palette', 'structured silhouettes', 'quality basics'],
  bohemian: ['flowy fabrics', 'earth tones', 'embroidery', 'layered jewelry'],
  classic: ['timeless cuts', 'navy and white', 'pearl accessories', 'loafers'],
  edgy: ['leather accents', 'asymmetric cuts', 'hardware details', 'bold prints'],
  romantic: ['ruffles', 'floral prints', 'pastel hues', 'delicate lace'],
  sporty: ['athleisure', 'color blocking', 'sneakers', 'functional pockets'],
};

const BY_FORMALITY: Record<string, string[]> = {
  'black tie': ['floor-length', 'sculpted tailoring', 'quiet luxury'],
  formal: ['power suiting', 'structured silhouettes', 'monochrome sets'],
  'semi-formal': ['timeless cuts', 'quality basics', 'oversized blazers'],
  casual: ['quality basics', 'linen everything', 'relaxed knits'],
};

function detectOccasion(query: string, category: string) {
  const low = query.toLowerCase();
  for (const key of Object.keys(BY_OCCASION))
    if (low.includes(key)) return key;
  return category === 'fashion' ? 'casual' : 'home';
}

export function trendAgent(intent: CosmoIntent): TrendResult {
  const occasion = detectOccasion(intent.query, intent.category);
  // Occasion and style tables are merged, as on the cosmos-agent branch, with
  // formality standing in when the shopper never picked a style.
  const merged = [
    ...new Set([
      ...(BY_OCCASION[occasion] || []),
      ...(intent.styleProfile
        ? BY_STYLE[intent.styleProfile] || []
        : BY_FORMALITY[intent.formality] || []),
    ]),
  ].slice(0, 6);
  const globalSet = new Set(GLOBAL);
  const overlap = merged.filter((t) => globalSet.has(t)).length;
  const score = merged.length
    ? Math.round((overlap / merged.length) * 100)
    : 0;
  return { agentId: 'trends', season: SEASON, occasion, trending: merged, score };
}
