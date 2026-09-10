import { ShopperIntent, TrendResult } from "../../types";
import trendsData from "../../data/trends.json";

export async function trendAgent(intent: ShopperIntent): Promise<TrendResult> {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

  const occasionTrends =
    trendsData.byOccasion[intent.occasion as keyof typeof trendsData.byOccasion] ||
    trendsData.global.slice(0, 4);

  const styleTrends =
    trendsData.byStyle[intent.style as keyof typeof trendsData.byStyle] ||
    [];

  // Merge and deduplicate
  const merged = [...new Set([...occasionTrends, ...styleTrends])].slice(0, 6);

  // Compute a trend score based on keyword overlap with global trends
  const globalSet = new Set(trendsData.global);
  const overlap = merged.filter((t) => globalSet.has(t)).length;
  const score = Math.round((overlap / merged.length) * 100) || 72;

  return {
    agentId: "trends",
    trending: merged,
    score,
    season: trendsData.season,
  };
}
