import type { CosmoIntent, LocalizationResult } from './types';

// Region table from the cosmos-agent branch. The Cosmo intake lets a shopper
// type any city, so this keeps the branch's full list plus Chicago, which is
// this storefront's own default, and falls back to a global rate otherwise.
const REGIONS: Record<
  string,
  {
    currency: string;
    symbol: string;
    rate: number;
    region: string;
    shipping: string;
  }
> = {
  chicago: { currency: 'USD', symbol: '$', rate: 1, region: 'Midwest US', shipping: '2–4 days' },
  'new york': { currency: 'USD', symbol: '$', rate: 1, region: 'Northeast US', shipping: '1–3 days' },
  'los angeles': { currency: 'USD', symbol: '$', rate: 1, region: 'West Coast US', shipping: '2–4 days' },
  toronto: { currency: 'CAD', symbol: 'CA$', rate: 1.36, region: 'Canada', shipping: '3–6 days' },
  london: { currency: 'GBP', symbol: '£', rate: 0.79, region: 'UK', shipping: '3–5 days' },
  paris: { currency: 'EUR', symbol: '€', rate: 0.92, region: 'Western Europe', shipping: '3–5 days' },
  berlin: { currency: 'EUR', symbol: '€', rate: 0.92, region: 'Central Europe', shipping: '3–5 days' },
  tokyo: { currency: 'JPY', symbol: '¥', rate: 149.5, region: 'East Asia', shipping: '5–8 days' },
  sydney: { currency: 'AUD', symbol: 'A$', rate: 1.52, region: 'Australia', shipping: '6–9 days' },
};

const FALLBACK = {
  currency: 'USD',
  symbol: '$',
  rate: 1,
  region: 'Global',
  shipping: '5–8 days',
};

export function localizationAgent(intent: CosmoIntent): LocalizationResult {
  const key = intent.location.toLowerCase().trim();
  // Exact match first, then a contains match so "Tokyo, Japan" still resolves.
  const r =
    REGIONS[key] ||
    REGIONS[Object.keys(REGIONS).find((k) => key.includes(k)) || ''] ||
    FALLBACK;
  return {
    agentId: 'localization',
    currency: r.currency,
    symbol: r.symbol,
    rate: r.rate,
    region: r.region,
    shippingEstimate: r.shipping,
  };
}
