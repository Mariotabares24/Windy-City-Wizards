import type { Product } from '../catalog';
import type { CosmoIntent, FriendInfluenceResult } from './types';

// Friend influence. The cosmos-agent branch simulated votes with a mock table;
// this reads the real circle tally instead, so the number a shopper sees is one
// their friends actually cast. Outside a circle it reports honestly that there
// are no votes yet rather than inventing a crowd.
export function friendAgent(
  intent: CosmoIntent,
  items: Product[],
): FriendInfluenceResult {
  const votes: Record<string, number> = {};
  for (const p of items) {
    const n = intent.votes[p.id] || 0;
    if (n > 0) votes[p.id] = n;
  }
  const entries = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const topId = entries[0]?.[0];
  return {
    agentId: 'friendInfluence',
    votes,
    friendCount: entries.reduce((sum, [, n]) => sum + n, 0),
    topPick: topId ? items.find((p) => p.id === topId)?.name : undefined,
  };
}
