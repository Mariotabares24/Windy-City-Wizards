// ─── Shopper Intent ───────────────────────────────────────────────────────────
export interface ShopperIntent {
  query: string;       // free-text: "best headphones for commuting under $200"
  budget: number;
  location: string;
  useCase: string;     // replaces "occasion" — e.g. "gaming", "commute", "gift"
  userId?: string;
}

// ─── Product Catalog ──────────────────────────────────────────────────────────
export interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  category: string;        // specific type: "dress" | "skirt" | "blazer" | "bedding" | etc.
  categoryGroup: string;   // broad group: "fashion" | "home" | "lifestyle"
  price: number;
  rating: number;          // 1–5
  reviewCount: number;
  colors: string[];        // actual colours of this item e.g. ["blue", "navy", "cobalt"]
  tags: string[];          // searchable keywords — must include category and colours
  features: string[];      // bullet-point specs shown in UI
  imageUrl: string;
  inStock: boolean;
  stockQty: number;
}

// ─── Agent Results ────────────────────────────────────────────────────────────
export interface RecommendationResult {
  agentId: "recommendation";
  items: CatalogItem[];
  topPick: CatalogItem;
  rationale: string;
  scoreBreakdown: { itemId: string; score: number; reasons: string[] }[];
}

export interface TrendResult {
  agentId: "trends";
  trending: string[];
  hotCategories: { name: string; growth: string }[];
  score: number;
  period: string;
}

export interface LocalizationResult {
  agentId: "localization";
  currency: string;
  region: string;
  localPrices: Record<string, number>;
  shippingEstimate: string;
}

export interface FriendInfluenceResult {
  agentId: "friendInfluence";
  votes: Record<string, number>;
  topPick: string;
  friendCount: number;
  roomId: string;
}

export interface StylistResult {
  agentId: "stylist";
  advice: string;
  accessories: string[];
  alternatives: { name: string; reason: string }[];
  matchScore: number;
}

// ─── Utility Service Results ──────────────────────────────────────────────────
export interface StockResult {
  itemId: string;
  inStock: boolean;
  quantity: number;
  restockEta?: string;
}

export interface BudgetResult {
  approved: boolean;
  message: string;
  savings?: number;
  bestValue?: string;
}

export interface ReviewSummary {
  itemId: string;
  rating: number;
  summary: string;
  reviewCount: number;
  pros: string[];
  cons: string[];
}

// ─── Orchestrator Output ──────────────────────────────────────────────────────
export interface CosmoResponse {
  sessionId: string;
  intent: ShopperIntent;
  recommendations: RecommendationResult;
  trends: TrendResult;
  localization: LocalizationResult;
  friendInfluence: FriendInfluenceResult;
  stylistAdvice: StylistResult;
  stock: StockResult[];
  budgetCheck: BudgetResult;
  reviews: ReviewSummary[];
  generatedAt: string;
}

// ─── Agent Status (for UI) ────────────────────────────────────────────────────
export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentState {
  id: string;
  label: string;
  icon: string;
  status: AgentStatus;
  durationMs?: number;
}
