import { ShopperIntent, RecommendationResult, CatalogItem } from "../../types";
import rawCatalog from "../../data/catalog.json";

const CATALOG = rawCatalog as CatalogItem[];

// ─── Scoring weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  budgetSweet:    12,  // item is in 60–100% of budget (not suspiciously cheap)
  tagMatch:       18,  // each keyword from the query that matches a tag
  ratingBonus:     8,  // per star above 4.0
  popularityBonus: 6,  // log-scaled review count
  inStockBonus:   15,  // in-stock items surface higher
};

// ─── Category keyword map ─────────────────────────────────────────────────────
// Maps query words → the `category` values they should match.
// A query for "dress" must only return items where category is in DRESS_CATS.
const CATEGORY_MAP: Record<string, string[]> = {
  dress:     ["dress"],
  dresses:   ["dress"],
  skirt:     ["skirt"],
  blazer:    ["blazer"],
  jacket:    ["blazer"],
  jumper:    ["knitwear"],
  sweater:   ["knitwear"],
  knitwear:  ["knitwear"],
  bedding:   ["bedding"],
  duvet:     ["bedding"],
  furniture: ["furniture"],
  chair:     ["furniture"],
  sofa:      ["furniture"],
  decor:     ["decor"],
  vase:      ["decor"],
  candle:    ["candle"],
  yoga:      ["wellness"],
  mat:       ["wellness"],
};

// ─── Colour keyword map ───────────────────────────────────────────────────────
// Maps colour words a customer might say → what to look for in item.colors
const COLOR_MAP: Record<string, string[]> = {
  blue:     ["blue", "cobalt", "navy", "sapphire", "azure", "midnight", "powder blue", "sky blue", "french blue", "royal blue"],
  navy:     ["navy", "midnight", "french blue"],
  cobalt:   ["cobalt", "blue"],
  red:      ["red", "crimson", "scarlet"],
  burgundy: ["burgundy", "wine", "red"],
  green:    ["green", "sage", "olive", "emerald", "forest"],
  black:    ["black"],
  white:    ["white", "ivory", "cream", "off-white"],
  pink:     ["pink", "blush", "rose", "dusty rose"],
  yellow:   ["yellow", "mustard"],
  purple:   ["purple", "lilac", "violet", "plum"],
  orange:   ["orange", "rust", "terracotta"],
  brown:    ["brown", "camel", "tan", "chocolate"],
  grey:     ["grey", "gray", "stone", "charcoal"],
  gray:     ["grey", "gray", "stone", "charcoal"],
};

// ─── Parse intent for hard-filter values ──────────────────────────────────────
interface ParsedIntent {
  categoryFilter: string[] | null;  // null = no category filter
  colorFilter: string[] | null;     // null = no colour filter
  keywords: string[];
}

function parseIntent(intent: ShopperIntent): ParsedIntent {
  const stopWords = new Set([
    "a","an","the","for","with","and","or","best","good","great",
    "some","any","get","want","need","looking","show","find","me",
    "my","i","give","please","under","around","about",
  ]);

  const raw = `${intent.query} ${intent.useCase}`.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  const words = raw.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  // Detect category hard filter
  let categoryFilter: string[] | null = null;
  for (const word of words) {
    if (CATEGORY_MAP[word]) {
      categoryFilter = CATEGORY_MAP[word];
      break;
    }
  }

  // Detect colour hard filter
  let colorFilter: string[] | null = null;
  for (const word of words) {
    if (COLOR_MAP[word]) {
      colorFilter = COLOR_MAP[word];
      break;
    }
  }

  // Remaining words become general keyword matches
  const keywords = words.filter(w => w.length > 2);

  return { categoryFilter, colorFilter, keywords };
}

// ─── Scoring function ─────────────────────────────────────────────────────────
function scoreItem(
  item: CatalogItem,
  intent: ShopperIntent,
  parsed: ParsedIntent
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  // ── Hard gate 1: Budget ──────────────────────────────────────────────────
  if (item.price > intent.budget) {
    return { score: -1, reasons: ["Over budget"] };
  }

  // ── Hard gate 2: Category ────────────────────────────────────────────────
  // If the customer said "dress", only items with category "dress" pass.
  // A duvet (category: "bedding") is eliminated here, full stop.
  if (parsed.categoryFilter && !parsed.categoryFilter.includes(item.category)) {
    return { score: -1, reasons: ["Wrong category"] };
  }

  // ── Hard gate 3: Colour ──────────────────────────────────────────────────
  // If the customer said "blue", the item's colors array must contain
  // at least one blue-family word. A white/sage duvet fails this.
  if (parsed.colorFilter) {
    const itemColorText = item.colors.join(" ").toLowerCase();
    const hasColor = parsed.colorFilter.some(c => itemColorText.includes(c));
    if (!hasColor) {
      return { score: -1, reasons: ["Colour mismatch"] };
    }
  }

  // ── Passed all hard gates — score by relevance ───────────────────────────
  let score = 30; // base for passing all gates

  if (item.price >= intent.budget * 0.6) {
    score += WEIGHTS.budgetSweet;
    reasons.push("Great value for budget");
  }

  // Tag keyword matching
  const matchedTags: string[] = [];
  for (const kw of parsed.keywords) {
    if (item.tags.some(t => t.includes(kw) || kw.includes(t)) ||
        item.name.toLowerCase().includes(kw) ||
        item.brand.toLowerCase().includes(kw)) {
      score += WEIGHTS.tagMatch;
      matchedTags.push(kw);
    }
  }
  if (matchedTags.length > 0) {
    reasons.push(`Matches: ${[...new Set(matchedTags)].slice(0, 3).join(", ")}`);
  }

  // Rating bonus
  if (item.rating >= 4.0) {
    score += Math.floor((item.rating - 4.0) * 10) * WEIGHTS.ratingBonus;
    if (item.rating >= 4.7) reasons.push(`${item.rating}★ rated`);
  }

  // Popularity bonus
  score += Math.floor(Math.log10(Math.max(item.reviewCount, 1)) * WEIGHTS.popularityBonus);
  if (item.reviewCount > 5000) reasons.push("Best-seller");

  // Stock bonus
  if (item.inStock) {
    score += WEIGHTS.inStockBonus;
  } else {
    reasons.push("Out of stock");
  }

  return { score, reasons };
}

// ─── Recommendation Agent ─────────────────────────────────────────────────────
export async function recommendationAgent(
  intent: ShopperIntent
): Promise<RecommendationResult> {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

  const parsed = parseIntent(intent);

  const scored = CATALOG
    .map(item => {
      const { score, reasons } = scoreItem(item, intent, parsed);
      return { item, score, reasons };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  // If hard filters eliminate everything, fall back gracefully:
  // relax the colour filter first, then the category filter
  const pool = scored.length > 0 ? scored : (() => {
    const relaxColor = CATALOG
      .map(item => {
        const relaxed = scoreItem(item, intent, { ...parsed, colorFilter: null });
        return { item, score: relaxed.score, reasons: relaxed.reasons };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    return relaxColor;
  })();

  const top5 = pool.slice(0, 5);
  const items = top5.map(s => s.item);
  const topPick = items[0];

  // Build human-readable rationale
  const colorStr = parsed.colorFilter
    ? `${intent.query.match(/\b(blue|red|green|black|white|pink|navy|cobalt|purple|grey|gray|yellow|orange|brown)\b/i)?.[1] || ""} `
    : "";
  const catStr = parsed.categoryFilter?.[0] || "item";
  const rationale = items.length > 0
    ? `Found ${items.length} ${colorStr}${catStr}${items.length !== 1 ? "s" : ""} under $${intent.budget}.`
    : `No exact matches — showing closest alternatives under $${intent.budget}.`;

  return {
    agentId: "recommendation",
    items,
    topPick,
    rationale,
    scoreBreakdown: top5.map(({ item, score, reasons }) => ({
      itemId: item.id,
      score,
      reasons,
    })),
  };
}
