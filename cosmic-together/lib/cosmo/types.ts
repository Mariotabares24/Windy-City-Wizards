import type { Category, Product } from '../catalog';

// Normalized input every Cosmo agent receives. Derived once from the validated
// ShoppingRequest so agents never re-parse raw user text.
export type CosmoIntent = {
  query: string;
  category: Category;
  budget: number;
  formality: string;
  style?: 'familiar' | 'explore';
  location: string;
  colors: string[];
  votes: Record<string, number>;
};

export type ScoredProduct = {
  product: Product;
  score: number;
  reasons: string[];
};

export type RecommendationResult = {
  agentId: 'recommendation';
  scored: ScoredProduct[];
  rationale: string;
};

export type TrendResult = {
  agentId: 'trends';
  season: string;
  occasion: string;
  trending: string[];
  score: number;
};

export type LocalizationResult = {
  agentId: 'localization';
  currency: string;
  symbol: string;
  rate: number;
  region: string;
  shippingEstimate: string;
};

export type StylistResult = {
  agentId: 'stylist';
  advice: string;
  outfitTips: string[];
  palette: string[];
};

export type StockResult = {
  productId: string;
  inStock: boolean;
  quantity: number;
};

export type BudgetResult = {
  approved: boolean;
  message: string;
  savings?: number;
  bestValue?: string;
};

export type ReviewSummary = {
  productId: string;
  rating: number;
  reviewCount: number;
  summary: string;
};

export type SizeHint = {
  productId: string;
  size: string;
};
