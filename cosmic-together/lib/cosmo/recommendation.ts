import { products } from '../catalog';
import type { Product } from '../catalog';
import type { CosmoIntent, RecommendationResult, ScoredProduct } from './types';

// Scoring engine ported from the cosmos-agent branch: hard gates first, then
// weighted relevance. The formality gate is kept from the previous ranker —
// without it a black-tie request happily returns casual shirts.
const WEIGHTS = {
  budgetSweet: 12,
  tagMatch: 18,
  paletteMatch: 10,
  // Social weight has to be able to actually reorder a shortlist, otherwise
  // circle voting is decorative. It still cannot bypass any hard gate.
  socialVote: 5,
  socialCap: 25,
  arBonus: 3,
};

const CATEGORY_MAP: Record<string, string[]> = {
  dress: ['wrap dress', 'midi dress', 'slip dress', 'blazer dress', 'maxi dress'],
  dresses: ['wrap dress', 'midi dress', 'slip dress', 'blazer dress', 'maxi dress'],
  blazer: ['blazer', 'tailored blazer', 'blazer dress'],
  jacket: ['blazer', 'tailored blazer'],
  skirt: ['midi skirt'],
  shirt: ['shirt'],
  oxford: ['shirt'],
  coat: ['coat'],
  jumper: ['knitwear'],
  sweater: ['knitwear'],
  knitwear: ['knitwear'],
  cashmere: ['knitwear'],
  bedding: ['bedding'],
  duvet: ['bedding'],
  chair: ['chair', 'accent chair'],
  sofa: ['chair', 'accent chair'],
  seat: ['chair', 'accent chair'],
  lamp: ['lamp'],
  light: ['lamp'],
  vase: ['vase set'],
  decor: ['vase set'],
  candle: ['candle'],
  yoga: ['yoga mat'],
  mat: ['yoga mat'],
  headphone: ['headphones'],
  headphones: ['headphones'],
  speaker: ['speaker'],
};

const COLOR_MAP: Record<string, string[]> = {
  blue: ['blue', 'cobalt', 'navy', 'sapphire', 'midnight', 'powder blue', 'sky blue', 'french blue', 'dusty blue'],
  navy: ['navy', 'midnight', 'french blue'],
  cobalt: ['cobalt', 'blue'],
  red: ['red', 'crimson', 'scarlet'],
  burgundy: ['burgundy', 'wine'],
  green: ['green', 'sage', 'olive', 'forest'],
  sage: ['sage'],
  black: ['black', 'midnight'],
  white: ['white', 'ivory', 'cream', 'off-white'],
  ivory: ['ivory', 'cream', 'off-white'],
  pink: ['pink', 'blush', 'rose', 'dusty rose'],
  purple: ['purple', 'lilac', 'violet', 'plum'],
  orange: ['orange', 'rust', 'terracotta'],
  brown: ['brown', 'camel', 'tan', 'chocolate'],
  camel: ['camel', 'tan'],
  grey: ['grey', 'gray', 'stone', 'charcoal'],
  gray: ['grey', 'gray', 'stone', 'charcoal'],
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'with', 'and', 'or', 'best', 'good', 'great', 'some',
  'any', 'get', 'want', 'need', 'looking', 'show', 'find', 'me', 'my', 'i',
  'give', 'please', 'under', 'around', 'about', 'that', 'this', 'something',
]);

type Parsed = {
  kindFilter: string[] | null;
  colorFilter: string[] | null;
  keywords: string[];
};

export function parseQuery(query: string): Parsed {
  const raw = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = raw.split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  let kindFilter: string[] | null = null;
  let colorFilter: string[] | null = null;
  for (const w of words) {
    if (!kindFilter && CATEGORY_MAP[w]) kindFilter = CATEGORY_MAP[w];
    if (!colorFilter && COLOR_MAP[w]) colorFilter = COLOR_MAP[w];
  }
  return { kindFilter, colorFilter, keywords: words.filter((w) => w.length > 2) };
}

function formalityAllows(p: Product, formality: string) {
  if (p.category !== 'fashion') return true;
  if (p.formality === formality) return true;
  if (formality === 'semi-formal' && p.formality === 'formal')
    return p.kind.includes('blazer');
  if (formality === 'casual') return ['shirt', 'coat', 'knitwear'].includes(p.kind);
  return false;
}

function scoreOne(
  p: Product,
  intent: CosmoIntent,
  parsed: Parsed,
  applyColor: boolean,
): ScoredProduct | null {
  // Hard gates — a product failing any of these is never surfaced.
  if (p.category !== intent.category) return null;
  if (p.price > intent.budget) return null;
  if (p.stock <= 0) return null;
  if (!formalityAllows(p, intent.formality)) return null;
  if (parsed.kindFilter && !parsed.kindFilter.some((k) => p.kind.includes(k)))
    return null;
  if (applyColor && parsed.colorFilter) {
    const text = [p.color, ...p.colors].join(' ').toLowerCase();
    if (!parsed.colorFilter.some((c) => text.includes(c))) return null;
  }

  const reasons: string[] = [`Within your $${intent.budget} budget`];
  let score = 60;

  if (p.price >= intent.budget * 0.6) {
    score += WEIGHTS.budgetSweet;
    reasons.push('Uses your budget well');
  }

  const corpus = [p.name, p.description, p.material, p.kind, ...p.tags]
    .join(' ')
    .toLowerCase();
  const matched = [...new Set(parsed.keywords.filter((k) => corpus.includes(k)))];
  if (matched.length) {
    score += Math.min(3, matched.length) * WEIGHTS.tagMatch;
    reasons.push(`Matches: ${matched.slice(0, 3).join(', ')}`);
  }

  if (intent.colors.includes(p.color)) {
    score += WEIGHTS.paletteMatch;
    reasons.push('Matches your selected palette');
  }

  const votes = intent.votes[p.id] || 0;
  if (votes) {
    score += Math.min(WEIGHTS.socialCap, votes * WEIGHTS.socialVote);
    reasons.push(`${votes} circle ${votes === 1 ? 'vote' : 'votes'}`);
  } else {
    reasons.push(`${intent.location}: sample availability`);
  }

  if (intent.style === 'explore' && !['Midnight', 'Charcoal', 'Black'].includes(p.color))
    score += 6;
  if (p.ar) score += WEIGHTS.arBonus;

  return { product: p, score: Math.min(99, score), reasons: reasons.slice(0, 4) };
}

export function recommendationAgent(intent: CosmoIntent): RecommendationResult {
  const parsed = parseQuery(intent.query);

  const rank = (applyColor: boolean) =>
    products
      .map((p) => scoreOne(p, intent, parsed, applyColor))
      .filter((s): s is ScoredProduct => s !== null)
      .sort(
        (a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id),
      );

  // Relax the colour gate before giving up, but never the budget, category,
  // stock or formality gates.
  let scored = rank(true);
  let relaxed = false;
  if (scored.length === 0 && parsed.colorFilter) {
    scored = rank(false);
    relaxed = scored.length > 0;
  }

  const rationale = scored.length
    ? relaxed
      ? `No exact colour match, so these are the closest ${intent.category} options under $${intent.budget}.`
      : `Found ${scored.length} ${intent.category} ${scored.length === 1 ? 'option' : 'options'} under $${intent.budget}.`
    : `Nothing in ${intent.category} clears your $${intent.budget} budget and constraints.`;

  return { agentId: 'recommendation', scored: scored.slice(0, 3), rationale };
}
