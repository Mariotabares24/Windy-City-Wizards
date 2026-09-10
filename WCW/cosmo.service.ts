import { ShopperIntent, CosmoResponse } from "../types";
import { recommendationAgent } from "../agents/recommendation/recommendation.service";
import { trendAgent }          from "../agents/trends/trends.service";
import { localizationAgent }   from "../agents/localization/localization.service";
import { friendAgent }         from "../agents/friendInfluence/friend.service";
import { stylistAgent }        from "../agents/stylist/stylist.service";
import { stockChecker, budgetChecker, reviewSummarizer } from "../agents/utils.services";

// ─── Cosmo Orchestrator ───────────────────────────────────────────────────────
// Single controller — fans out to all specialist agents in parallel,
// then combines results into one unified CosmoResponse.
export async function cosmoOrchestrator(intent: ShopperIntent): Promise<CosmoResponse> {
  const sessionId = `cosmo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // ── Phase 1: all specialist agents run in parallel ─────────────────────────
  const [recommendations, trends, localization, friendInfluence, stylistAdvice] =
    await Promise.all([
      recommendationAgent(intent),
      trendAgent(intent),
      localizationAgent(intent),
      friendAgent(intent),
      stylistAgent(intent),
    ]);

  // ── Phase 2: utility services run against the recommended item IDs ─────────
  const recommendedIds = recommendations.items.map((i) => i.id);

  const [stock, budgetCheck, reviews] = await Promise.all([
    stockChecker(recommendedIds),
    budgetChecker(recommendations.items, intent),
    reviewSummarizer(recommendedIds),
  ]);

  return {
    sessionId,
    intent,
    recommendations,
    trends,
    localization,
    friendInfluence,
    stylistAdvice,
    stock,
    budgetCheck,
    reviews,
    generatedAt: new Date().toISOString(),
  };
}
