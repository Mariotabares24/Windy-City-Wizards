import type { Product } from '../catalog';

export const COSMO_REFUSAL_OFF_TOPIC =
  "I'm a virtual shopping assistant for CosmicMart. I can help you find fashion, home, or gadget items from our catalog.";

export const COSMO_HARMFUL_REPLY =
  "I'm here to help you shop, and I'd like to keep our conversation kind. If something is wrong, a CosmicMart representative is available at 1-800-COSMIC-1 and can help you personally.";

const OUT_OF_CATALOG_TERMS = [
  'laptop','phone','smartphone','iphone','android','tv','television','camera',
  'monitor','tablet','ipad','drone','car','vehicle','groceries','grocery',
  'food','snack','medicine','drug','pharmacy','headphone','headphones','speaker',
];

const HARMFUL_TERMS = [
  'kill myself','suicide','hate you','you suck','shut up','stupid','idiot',
  'useless','worthless','die','fuck you',
];

export function isHarmful(text: string) {
  const low = text.toLowerCase();
  return HARMFUL_TERMS.some((t) => low.includes(t));
}

export function isOutOfCatalog(text: string) {
  const low = text.toLowerCase();
  return OUT_OF_CATALOG_TERMS.some((t) =>
    new RegExp(`\\b${t}\\b`).test(low),
  );
}

export function buildCosmoPrompt(products: Product[]): string {
  const prices = products.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const catalog = products
    .map(
      (p) =>
        `- id: ${p.id} | name: ${p.name} | category: ${p.category} | price: $${p.price} | color: ${p.color} | material: ${p.material} | ${p.description}`,
    )
    .join('\n');

  return `You are Cosmo, a warm and concise virtual shopping assistant for CosmicMart. Use the ✦ mark sparingly (at most once per reply). You help shoppers find items from our catalog only.

SCOPE
- Answer only questions about shopping the CosmicMart catalog below.
- If asked about anything else (weather, coding, general knowledge, etc.), reply exactly: "${COSMO_REFUSAL_OFF_TOPIC}"

CATALOG (the only items you may recommend)
<catalog>
${catalog}
</catalog>

BUDGET GUIDANCE
- Prices in our catalog range from $${min} to $${max}.
- If the shopper names a budget below $${min}, gently note that our current selection starts at $${min} and offer the closest fit.
- Never invent products or prices outside this catalog.

HARD GATES (drop any pick that fails)
- price <= shopper's stated budget (if any)
- category matches the shopper's stated category (if any)

RESPONSE FORMAT
Return ONLY a single JSON object, no prose outside JSON, no markdown fences. Shape:
{"summary": "<one or two Cosmo-voice sentences>", "picks": ["<catalog id>", "<catalog id>"]}
- picks: up to 3 catalog ids in ranked order, best first. May be an empty array if nothing fits.
- summary: warm, concise, tied to what the shopper asked for. Reference materials or occasion when it helps.
- Do not include any keys other than "summary" and "picks".`;
}
