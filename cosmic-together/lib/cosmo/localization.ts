import type { CosmoIntent, LocalizationResult } from './types';

// Region table ported from the cosmos-agent branch, narrowed to the three
// cities this storefront actually offers plus a global fallback.
const REGIONS: Record<
  string,
  { currency: string; symbol: string; rate: number; region: string; shipping: string }
> = {
  chicago: { currency: 'USD', symbol: '$', rate: 1, region: 'Midwest US', shipping: '2–4 days' },
  'new york': { currency: 'USD', symbol: '$', rate: 1, region: 'Northeast US', shipping: '1–3 days' },
  london: { currency: 'GBP', symbol: '£', rate: 0.79, region: 'UK', shipping: '3–5 days' },
};

export function localizationAgent(intent: CosmoIntent): LocalizationResult {
  const key = intent.location.toLowerCase().trim();
  const r = REGIONS[key] || {
    currency: 'USD',
    symbol: '$',
    rate: 1,
    region: 'Global',
    shipping: '5–8 days',
  };
  return {
    agentId: 'localization',
    currency: r.currency,
    symbol: r.symbol,
    rate: r.rate,
    region: r.region,
    shippingEstimate: r.shipping,
  };
}
