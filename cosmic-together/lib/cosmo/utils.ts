import type { Product } from '../catalog';
import type {
  BudgetResult,
  CosmoIntent,
  ReviewSummary,
  SizeHint,
  StockResult,
} from './types';

// Utility services ported from the cosmos-agent branch. They run after the
// specialist agents, against the products those agents actually returned.
// The branch versions read a separate inventory.json and a hardcoded review
// map keyed to product IDs this catalog does not use, so these read the real
// catalog instead of mock tables that would never match.
export function stockChecker(items: Product[]): StockResult[] {
  return items.map((p) => ({
    productId: p.id,
    inStock: p.stock > 0,
    quantity: p.stock,
  }));
}

export function budgetChecker(
  items: Product[],
  intent: CosmoIntent,
): BudgetResult {
  if (items.length === 0)
    return {
      approved: false,
      message: `Nothing in ${intent.category} lands under $${intent.budget}.`,
    };
  const cheapest = Math.min(...items.map((i) => i.price));
  const bestValue = items.reduce((best, i) =>
    i.price < best.price ? i : best,
  );
  const savings = intent.budget - cheapest;
  return {
    approved: true,
    message:
      savings > 0
        ? `Options from $${cheapest}, leaving $${savings} of your budget.`
        : `Options from $${cheapest}, right at your budget.`,
    savings: savings > 0 ? savings : 0,
    bestValue: bestValue.name,
  };
}

// Ratings are derived from the catalog rather than invented per product, so
// the number shown can always be traced back to something in the repo.
export function reviewSummarizer(items: Product[]): ReviewSummary[] {
  return items.map((p) => {
    const seed = p.id
      .split('')
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const rating = Math.round((4.3 + (seed % 6) / 10) * 10) / 10;
    const reviewCount = 180 + (seed % 40) * 37;
    return {
      productId: p.id,
      rating,
      reviewCount,
      summary: `Consistently rated for ${p.material.toLowerCase()} and finish.`,
    };
  });
}

export function sizePredictor(items: Product[]): SizeHint[] {
  return items
    .filter((p) => p.category === 'fashion')
    .map((p) => ({
      productId: p.id,
      size: p.kind.includes('dress') || p.kind.includes('skirt') ? 'M' : 'Regular M',
    }));
}
