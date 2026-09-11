import { type Enriched, enriched } from './enriched';
import type { CategoryGroup, ColorFamily, Occasion } from './keywords';

export type Intake = {
  category: string | null;
  categoryGroup: CategoryGroup | null;
  colors: ColorFamily[];
  occasion: Occasion | null;
  budget: number | null; // null === No limit
  size: string | null;
  season: string | null;
  roomCode: string;
};

export type Scored = {
  product: Enriched;
  budgetScore: number;
  occasionScore: number;
  ratingScore: number;
  popularityScore: number;
  recScore: number;
  trendScore: number;
  friendInfluenceScore: number;
  finalScore: number;
  topPick: boolean;
  friendVotes: { up: string[]; total: number };
};

function budgetScore(price: number, budget: number | null) {
  if (budget === null) return 80;
  const diff = Math.abs(budget - price);
  const closeness = Math.max(0, 100 - (diff / budget) * 100);
  return Math.round(closeness);
}

function occasionScore(product: Enriched, occasion: Occasion | null) {
  if (!occasion) return 60;
  return product.occasions.includes(occasion) ? 100 : 40;
}

function trendScore(product: Enriched, season: string | null) {
  const seasonHit = season && product.seasons.includes(season as never) ? 100 : 60;
  return Math.round(seasonHit * 0.6 + product.popularity * 0.4);
}

// Deterministic friend votes seeded by product id.
const FRIENDS = ['Elizabeth', 'Mario', 'Maya', 'Priya', 'Leo'];
function seed(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function friendVotes(product: Enriched) {
  const rand = seed(product.id);
  const bias = 0.35 + (product.popularity / 100) * 0.5 + (product.rating - 4) * 0.15;
  const up: string[] = [];
  for (const name of FRIENDS) if (rand() < bias) up.push(name);
  return { up, total: FRIENDS.length };
}
function friendInfluenceScore(product: Enriched) {
  const v = friendVotes(product);
  return Math.round((v.up.length / v.total) * 100);
}

export function passesGates(product: Enriched, intake: Intake): boolean {
  if (intake.budget !== null && product.price > intake.budget) return false;
  // Category gate is strict: a specific category never widens to its group.
  if (intake.category) {
    if (product.cosmoCategory !== intake.category) return false;
  } else if (intake.categoryGroup) {
    if (product.categoryGroup !== intake.categoryGroup) return false;
  }
  if (intake.colors.length > 0) {
    const overlap = product.colorFamilies.some((c) => intake.colors.includes(c));
    if (!overlap) return false;
  }
  return true;
}

export function runGatesAndScore(intake: Intake): Scored[] {
  const passed = enriched.filter((p) => passesGates(p, intake));
  const scored: Scored[] = passed.map((p) => {
    const bs = budgetScore(p.price, intake.budget);
    const os = occasionScore(p, intake.occasion);
    const rs = Math.round((p.rating / 5) * 100);
    const ps = p.popularity;
    const rec = bs * 0.35 + os * 0.25 + rs * 0.25 + ps * 0.15;
    const trend = trendScore(p, intake.season);
    const fi = friendInfluenceScore(p);
    const outOfStock = p.stock <= 0;
    const finalScore = rec * 0.6 + trend * 0.2 + fi * 0.2 - (outOfStock ? 10 : 0);
    return {
      product: p,
      budgetScore: bs,
      occasionScore: os,
      ratingScore: rs,
      popularityScore: ps,
      recScore: rec,
      trendScore: trend,
      friendInfluenceScore: fi,
      finalScore,
      topPick: false,
      friendVotes: friendVotes(p),
    };
  });
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const topIdx = scored.findIndex((s) => s.product.stock > 0);
  if (scored.length > 0) scored[topIdx >= 0 ? topIdx : 0].topPick = true;
  return scored;
}

export function runGatesWithFallback(intake: Intake): {
  scored: Scored[];
  relaxed: ('colors' | 'occasion' | 'budget' | 'category')[];
} {
  const relaxed: ('colors' | 'occasion' | 'budget' | 'category')[] = [];
  let scored = runGatesAndScore(intake);
  if (scored.length > 0) return { scored, relaxed };
  if (intake.colors.length > 0) {
    relaxed.push('colors');
    scored = runGatesAndScore({ ...intake, colors: [] });
    if (scored.length > 0) return { scored, relaxed };
  }
  if (intake.budget !== null) {
    relaxed.push('budget');
    scored = runGatesAndScore({ ...intake, colors: [], budget: null });
    if (scored.length > 0) return { scored, relaxed };
  }
  // Never widen beyond the requested category. If a specific category was
  // asked and nothing fit at all, return an empty list so the UI can say so —
  // matching "I asked for dresses, don't show me suits". If only a group was
  // asked, we already stayed inside it above.
  return { scored: [], relaxed };
}

const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newRoomCode(): string {
  let out = 'CV-';
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  for (let i = 0; i < 5; i++) out += ROOM_CHARS[bytes[i] % ROOM_CHARS.length];
  return out;
}
