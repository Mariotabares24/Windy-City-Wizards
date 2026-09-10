import { ShopperIntent, FriendInfluenceResult } from "../../types";
import catalog from "../../data/catalog.json";
import { CatalogItem } from "../../types";

// Mock social graph — in production this would call a social API
const MOCK_FRIEND_VOTES: Record<string, number> = {
  "item-001": 18,
  "item-002": 11,
  "item-003": 7,
  "item-004": 4,
  "item-005": 22,
  "item-006": 9,
};

const FRIEND_NAMES = [
  "Priya", "Sofia", "Camille", "Yuki", "Anya",
  "Leila", "Grace", "Nadia", "Emre", "Finn"
];

export async function friendAgent(
  intent: ShopperIntent
): Promise<FriendInfluenceResult> {
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 200));

  const typedCatalog = catalog as CatalogItem[];

  // Simulate occasion-based friend preference weighting
  const weighted: Record<string, number> = {};
  typedCatalog.forEach((item) => {
    const base = MOCK_FRIEND_VOTES[item.id] || 0;
    const occasionBonus = item.tags.some((t) =>
      intent.occasion.toLowerCase().includes(t)
    ) ? Math.floor(Math.random() * 8) : 0;
    weighted[item.id] = base + occasionBonus;
  });

  // Find top pick
  const topPickId = Object.entries(weighted).sort((a, b) => b[1] - a[1])[0][0];
  const topItem = typedCatalog.find((i) => i.id === topPickId);

  // Simulate a random friend count
  const friendCount = 8 + Math.floor(Math.random() * 5);

  return {
    agentId: "friendInfluence",
    votes: weighted,
    topPick: topItem?.name || "Unknown",
    friendCount,
  };
}
