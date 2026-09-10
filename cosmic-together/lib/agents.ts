import { products, type Product } from './catalog';
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
function research(p: Product, intent: string) {
  const terms = intent
    .toLowerCase()
    .split(/\W+/)
    .filter((x) => x.length > 3);
  const corpus = [p.name, p.description, p.material, ...p.tags]
    .join(' ')
    .toLowerCase();
  return Math.min(12, terms.filter((t) => corpus.includes(t)).length * 3);
}
export function orchestrate(input: unknown): ShoppingResult {
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
  let candidates = products.filter(
    (p) => p.category === category && p.price <= budget && p.stock > 0,
  );
  const lower = r.intent.toLowerCase();
  const subtype =
    category === 'home'
      ? /lamp|light/.test(lower)
        ? 'lamp'
        : /chair|seat/.test(lower)
          ? 'chair'
          : null
      : category === 'gadgets'
        ? /headphone/.test(lower)
          ? 'headphones'
          : /speaker/.test(lower)
            ? 'speaker'
            : null
        : null;
  if (subtype) candidates = candidates.filter((p) => p.model === subtype);
  if (category === 'fashion') {
    const hasFormality = inferred.formality || r.formality;
    if (hasFormality)
      candidates = candidates.filter(
        (p) =>
          p.formality === formality ||
          (formality === 'semi-formal' &&
            p.kind === 'blazer' &&
            p.formality === 'formal') ||
          (formality === 'casual' && ['shirt', 'coat'].includes(p.kind)),
      );
    if (/shirt|oxford/.test(lower))
      candidates = candidates.filter((p) => /shirt|oxford/i.test(p.name));
    else if (/coat/.test(lower))
      candidates = candidates.filter((p) => p.kind === 'coat');
    else if (/blazer/.test(lower))
      candidates = candidates.filter((p) => /blazer/i.test(p.name));
  }
  const ranked = candidates
    .map((p) => {
      const palette = r.colors.includes(p.color);
      const social = r.votes[p.id] || 0;
      const score = Math.min(
        99,
        68 +
          research(p, r.intent) +
          (palette ? 8 : 0) +
          (r.style === 'explore' &&
          !['Midnight', 'Charcoal', 'Black'].includes(p.color)
            ? 6
            : 0) +
          Math.min(12, social * 4) +
          (p.ar ? 3 : 0),
      );
      return {
        productId: p.id,
        score,
        reasons: [
          `Within your $${budget} budget`,
          palette
            ? 'Matches your selected palette'
            : category === 'fashion'
              ? `${p.formality} with ${p.material.toLowerCase()}`
              : p.tags[0],
          social
            ? `${social} circle ${social === 1 ? 'vote' : 'votes'}`
            : `${r.location}: sample availability`,
        ],
        tradeoffs: [
          category === 'fashion'
            ? p.material.includes('Wool')
              ? 'Wool blend may feel warm indoors.'
              : 'A more relaxed finish than a structured wool blazer.'
            : category === 'home'
              ? p.model === 'lamp'
                ? 'Room placement is an approximate visual preview.'
                : 'Check doorways and room dimensions before ordering.'
              : 'Battery figures are sample catalog specifications.',
        ],
      };
    })
    .sort((a, b) => b.score - a.score || a.productId.localeCompare(b.productId))
    .slice(0, 3);
  const summary =
    ranked.length === 0
      ? `No in-stock ${category === 'home' ? 'home' : category} matches meet all your constraints. Try a higher budget or a different style.`
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
        agent: 'Style & Context',
        label: 'Matching your preferences',
        evidence: r.colors.length
          ? r.colors.join(', ')
          : 'Using this session’s choices only',
      },
      {
        agent: 'Product Research',
        label: `Comparing ${products.filter((p) => p.category === category).length} products`,
        evidence: `${candidates.length} satisfy your constraints`,
      },
      {
        agent: 'Localization',
        label: `Checking ${r.location} availability`,
        evidence: 'Curated prototype inventory; not live stock',
      },
      {
        agent: 'Social Consensus',
        label: 'Bringing the shortlist together',
        evidence: Object.keys(r.votes).length
          ? 'Friend votes applied inside hard constraints'
          : 'Ready for a second opinion',
      },
    ],
  });
}
