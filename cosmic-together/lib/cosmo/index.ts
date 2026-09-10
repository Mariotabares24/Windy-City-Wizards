import { friendAgent } from './friends';
import { localizationAgent } from './localization';
import { recommendationAgent } from './recommendation';
import { stylistAgent } from './stylist';
import { trendAgent } from './trends';
import {
  budgetChecker,
  reviewSummarizer,
  sizePredictor,
  stockChecker,
} from './utils';
import type {
  BudgetResult,
  FriendInfluenceResult,
  CosmoIntent,
  LocalizationResult,
  RecommendationResult,
  ReviewSummary,
  SizeHint,
  StockResult,
  StylistResult,
  TrendResult,
} from './types';

export type AgentTiming = { id: string; label: string; ms: number };

export type CosmoResult = {
  recommendations: RecommendationResult;
  trends: TrendResult;
  localization: LocalizationResult;
  friends: FriendInfluenceResult;
  stylist: StylistResult;
  stock: StockResult[];
  budget: BudgetResult;
  reviews: ReviewSummary[];
  sizes: SizeHint[];
  timings: AgentTiming[];
};

// Times a single agent so the UI can report what each one actually cost,
// rather than animating a fixed delay.
async function run<T>(
  id: string,
  label: string,
  fn: () => T | Promise<T>,
  timings: AgentTiming[],
): Promise<T> {
  const started = Date.now();
  const value = await fn();
  timings.push({ id, label, ms: Date.now() - started });
  return value;
}

// Cosmo orchestrator, following the fan-out pattern from the cosmos-agent
// branch. Phase 1 agents are independent and run together; phase 2 utilities
// depend on what phase 1 selected. Every agent is awaited through the same
// contract, so any one of them can become a network call later without the
// orchestrator changing.
export async function cosmoOrchestrator(
  intent: CosmoIntent,
): Promise<CosmoResult> {
  const timings: AgentTiming[] = [];

  const [recommendations, trends, localization] = await Promise.all([
    run('recommendation', 'Searching the catalog', () => recommendationAgent(intent), timings),
    run('trends', 'Reading the season', () => trendAgent(intent), timings),
    run('localization', 'Checking your region', () => localizationAgent(intent), timings),
  ]);

  // The stylist reads the trend result, so it follows phase 1 rather than
  // racing it.
  const stylist = await run('stylist', 'Styling the shortlist', () => stylistAgent(intent, trends), timings);

  const picked = recommendations.scored.map((s) => s.product);
  const friends = await run(
    'friends',
    'Tallying circle votes',
    () => friendAgent(intent, picked),
    timings,
  );
  const [stock, budget, reviews, sizes] = await Promise.all([
    run('stock', 'Confirming stock', () => stockChecker(picked), timings),
    run('budget', 'Validating budget', () => budgetChecker(picked, intent), timings),
    run('reviews', 'Summarizing reviews', () => reviewSummarizer(picked), timings),
    run('sizes', 'Predicting size', () => sizePredictor(picked), timings),
  ]);

  return {
    recommendations,
    trends,
    localization,
    friends,
    stylist,
    stock,
    budget,
    reviews,
    sizes,
    timings,
  };
}

export type { CosmoIntent } from './types';
