import { type Product } from './catalog';
import { cosmoOrchestrator } from './cosmo';
import {
  requestSchema,
  resultSchema,
  type ShoppingRequest,
  type ShoppingResult,
} from './contracts';
export function inferIntent(
  text: string,
  category: ShoppingRequest['category'] = 'fashion',
) {
  const low = text.toLowerCase();
  const amount =
    low.match(
      /(?:under|below|less than|budget(?:\s+of)?|up to|maximum|max)\s*\$?\s*(\d+(?:\.\d{1,2})?)/,
    ) || low.match(/\$(\d+(?:\.\d{1,2})?)/);
  return {
    category: /\b(headphones?|speakers?|gadgets?|audio)\b/.test(low)
      ? ('gadgets' as const)
      : /\b(blazer|shirt|oxford|outfit|coat|wedding)\b/.test(low)
        ? ('fashion' as const)
        : /\b(lamp|chair|furniture|sofa|corner)\b/.test(low)
          ? ('home' as const)
          : category,
    budget: amount ? Number(amount[1]) : undefined,
    formality: low.includes('black tie')
      ? ('black tie' as const)
      : low.includes('semi-formal') || low.includes('semiformal')
        ? ('semi-formal' as const)
        : low.includes('formal')
          ? ('formal' as const)
          : low.includes('casual') || /\bcoat\b/.test(low)
            ? ('casual' as const)
            : undefined,
  };
}
export function safeShoppingText(text: string) {
  return !/(ignore (all |previous |your )?instructions|system prompt|reveal.{0,20}(key|secret|profile)|steal|credit card numbers|kill myself|suicide|sexual.{0,20}(child|minor)|buy.{0,15}(cocaine|illegal|weapon))/i.test(
    text,
  );
}
function tradeoff(p: Product) {
  if (p.category === 'fashion')
    return p.material.includes('Wool')
      ? 'Wool blend may feel warm indoors.'
      : `A ${p.material.toLowerCase()} finish — check the care label before you commit.`;
  if (p.category === 'home')
    return p.ar
      ? 'Room placement is an approximate visual preview.'
      : 'No 3D preview for this one yet — photography only.';
  return 'Battery figures are sample catalog specifications.';
}
export async function orchestrate(input: unknown): Promise<ShoppingResult> {
  const r = requestSchema.parse(input);
  const inferred = inferIntent(r.intent, r.category);
  const budget = r.budget ?? inferred.budget ?? 250;
  const category = r.category;
  const formality = r.formality ?? inferred.formality ?? 'semi-formal';
  if (!safeShoppingText(r.intent))
    return resultSchema.parse({
      summary:
        'I can help you find and compare fashion, home products, or gadgets. Tell me what you would like to shop for.',
      recommendations: [],
      steps: [],
      mode: 'catalog',
      constraints: { budget, category, formality },
      blocked: true,
    });

  const cosmo = await cosmoOrchestrator({
    query: r.intent,
    category,
    budget,
    formality,
    style: r.style,
    styleProfile: r.styleProfile,
    location: r.location,
    colors: r.colors,
    votes: r.votes,
  });

  const ranked = cosmo.recommendations.scored.map((s) => ({
    productId: s.product.id,
    score: s.score,
    reasons: s.reasons,
    tradeoffs: [tradeoff(s.product)],
  }));

  const summary =
    ranked.length === 0
      ? `No in-stock ${category} matches meet all your constraints. Try a higher budget or a different style.`
      : ranked.length < 3
        ? `I found ${ranked.length} ${ranked.length === 1 ? 'match' : 'matches'} within your constraints. I kept your budget intact.`
        : `Three directions, one good decision. ${Object.keys(r.votes).length ? 'Your circle’s votes are reflected in the order.' : 'Each meets your budget, with a different feel.'}`;

  return resultSchema.parse({
    summary,
    recommendations: ranked,
    mode: 'catalog',
    constraints: { budget, category, formality },
    steps: [
      {
        agent: 'Cosmo',
        label: 'Understanding your occasion',
        evidence: `${category}; budget $${budget}${category === 'fashion' ? '; ' + formality : ''}`,
      },
      {
        agent: 'Trends',
        label: 'Reading the season',
        evidence: cosmo.trends.trending.slice(0, 3).join(', ') || cosmo.trends.season,
      },
      {
        agent: 'Localization',
        label: 'Checking your region',
        evidence: `${cosmo.localization.region}; ships in ${cosmo.localization.shippingEstimate}`,
      },
      {
        agent: 'Product Research',
        label: 'Searching the catalog',
        evidence: cosmo.recommendations.rationale,
      },
      {
        agent: 'Friend influence',
        label: 'Tallying circle votes',
        evidence: cosmo.friends.friendCount
          ? `${cosmo.friends.friendCount} ${cosmo.friends.friendCount === 1 ? 'vote' : 'votes'}${cosmo.friends.topPick ? `; leading: ${cosmo.friends.topPick}` : ''}`
          : 'No circle votes yet',
      },
      {
        agent: 'Stylist',
        label: 'Styling the shortlist',
        evidence: cosmo.stylist.palette.join(', '),
      },
    ],
    trends: {
      season: cosmo.trends.season,
      occasion: cosmo.trends.occasion,
      trending: cosmo.trends.trending,
      score: cosmo.trends.score,
    },
    localization: {
      currency: cosmo.localization.currency,
      symbol: cosmo.localization.symbol,
      rate: cosmo.localization.rate,
      region: cosmo.localization.region,
      shippingEstimate: cosmo.localization.shippingEstimate,
    },
    stylist: cosmo.stylist,
    friends: cosmo.friends,
    budgetCheck: cosmo.budget,
    reviews: cosmo.reviews,
    sizes: cosmo.sizes,
    timings: cosmo.timings,
  });
}
