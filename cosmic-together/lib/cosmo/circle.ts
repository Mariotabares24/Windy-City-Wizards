import type { Category, Product } from '../catalog';
import { stylistAgent } from './stylist';
import { trendAgent } from './trends';
import { budgetChecker, reviewSummarizer, stockChecker } from './utils';
import type { CosmoIntent } from './types';

export type CircleConstraints = {
  budget?: number;
  category?: Category;
  formality?: string;
};

// Cosmo's voice inside a shopping circle. This deliberately does not run the
// full orchestrator: the circle already has a shortlist the host built, and a
// chat question is about *those* items. Re-searching the catalog here could
// answer with products nobody in the circle is looking at. So the specialist
// agents are reused, but every answer is grounded in the products passed in.
export function circleReply(
  question: string,
  items: Product[],
  constraints: CircleConstraints,
  votes: Record<string, number> = {},
  goal = '',
): string {
  if (items.length === 0)
    return 'These items are no longer available. Ask your host to update the shortlist.';

  const intent: CosmoIntent = {
    // Occasion lives in the circle's goal ("a fall wedding outfit"), not in the
    // chat message ("what's trending?"), so agents read both.
    query: `${goal} ${question}`.trim(),
    category: constraints.category || items[0].category,
    budget: constraints.budget || Math.max(...items.map((i) => i.price)),
    formality: constraints.formality || 'semi-formal',
    // Circle members are anonymous guests with no stored location, so nothing
    // here may claim a region. Localization stays out of circle answers.
    location: '',
    colors: [],
    votes,
  };
  const low = question.toLowerCase();

  if (/cheap|budget|price|afford|cost/.test(low)) {
    const check = budgetChecker(items, intent);
    const cheapest = [...items].sort((a, b) => a.price - b.price)[0];
    return `${cheapest.name} is the lowest here at $${cheapest.price}. ${check.message} Prices are from our sample catalog.`;
  }

  if (/compare|difference|versus|vs\b|which/.test(low)) {
    const reviews = reviewSummarizer(items);
    const lines = items.map((p) => {
      const r = reviews.find((x) => x.productId === p.id);
      // Labelled as a sample rating: it is derived from the catalog, not real
      // review data, and should not read as though it were.
      return `${p.name}: $${p.price}, ${p.material.toLowerCase()}${r ? `, sample rating ${r.rating}` : ''}.`;
    });
    return lines.join(' ');
  }

  if (/style|wear|match|outfit|pair|look/.test(low)) {
    const trends = trendAgent(intent);
    const stylist = stylistAgent(intent, trends);
    // The stylist's own advice line names a location, which a circle cannot
    // know, so the tips are used instead.
    return `For ${trends.occasion}, lean into ${trends.trending[0]}. ${stylist.outfitTips[0]}. ${stylist.outfitTips[1]}.`;
  }

  if (/trend|season|in style|popular/.test(low)) {
    const trends = trendAgent(intent);
    return `For ${trends.occasion} this ${trends.season.toLowerCase()}: ${trends.trending.slice(0, 3).join(', ')}. Your shortlist already leans that way.`;
  }

  if (/stock|available|left|sold out/.test(low)) {
    const stock = stockChecker(items);
    const low_ = stock.filter((s) => s.inStock && s.quantity <= 5);
    return low_.length
      ? `Running low: ${low_.map((s) => items.find((i) => i.id === s.productId)!.name).join(', ')}. Everything else on the list is comfortably in stock.`
      : 'Everything on this shortlist is in stock right now.';
  }

  if (/try|visual|ar\b|preview|see it/.test(low)) {
    const withAr = items.filter((p) => p.ar);
    const names = withAr.map((p) => p.name);
    const list =
      names.length > 1
        ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
        : names[0];
    return withAr.length
      ? `${list} open in “Try it in your world.” Camera access is optional and stays on your device.`
      : 'These pieces are photography-only for now — open a product for the full preview.';
  }

  const check = budgetChecker(items, intent);
  const voted = Object.keys(votes).filter((id) => items.some((i) => i.id === id));
  return voted.length
    ? `${check.message} Your circle has votes in — ask your host to refine the shortlist when you are ready.`
    : `${check.message} Vote for a favorite, then ask your host to refine the shortlist. Your budget always comes first.`;
}
