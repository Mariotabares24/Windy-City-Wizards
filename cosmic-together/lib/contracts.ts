import { z } from 'zod';
import type { Category } from './catalog';
export const circleConstraintsSchema=z.object({budget:z.number().min(1).max(10000).optional(),category:z.enum(['fashion','home','gadgets']).optional(),formality:z.enum(['casual','semi-formal','formal','black tie']).optional()}).default({});
export const categorySchema = z.enum(['fashion', 'home', 'gadgets']);
export const requestSchema = z.object({
  intent: z.string().trim().min(1).max(1000),
  category: categorySchema.default('fashion'),
  budget: z.number().min(1).max(10000).optional(),
  formality: z
    .enum(['casual', 'semi-formal', 'formal', 'black tie'])
    .optional(),
  style: z.enum(['familiar', 'explore']).optional(),
  location: z.enum(['Chicago', 'New York', 'London']).default('Chicago'),
  colors: z.array(z.string().max(24)).max(5).default([]),
  votes: z.record(z.string(), z.number().min(0).max(20)).default({}),
  demo: z.boolean().default(false),
});
export type ShoppingRequest = z.infer<typeof requestSchema>;
export const recommendationSchema = z.object({
  productId: z.string(),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()).min(1).max(4),
  tradeoffs: z.array(z.string()).max(3),
});
// Cosmo agent outputs. Optional because a blocked or malformed request is
// answered before any agent runs.
export const trendsSchema = z.object({
  season: z.string(),
  occasion: z.string(),
  trending: z.array(z.string()),
  score: z.number(),
});
export const localizationSchema = z.object({
  currency: z.string(),
  symbol: z.string(),
  region: z.string(),
  shippingEstimate: z.string(),
});
export const stylistSchema = z.object({
  advice: z.string(),
  outfitTips: z.array(z.string()),
  palette: z.array(z.string()),
});
export const budgetSchema = z.object({
  approved: z.boolean(),
  message: z.string(),
  savings: z.number().optional(),
  bestValue: z.string().optional(),
});
export const resultSchema = z.object({
  summary: z.string(),
  recommendations: z.array(recommendationSchema).max(3),
  steps: z.array(
    z.object({ agent: z.string(), label: z.string(), evidence: z.string() }),
  ),
  mode: z.enum(['catalog', 'live']),
  constraints: z.object({
    budget: z.number(),
    category: categorySchema,
    formality: z.string(),
  }),
  blocked: z.boolean().optional(),
  trends: trendsSchema.optional(),
  localization: localizationSchema.optional(),
  stylist: stylistSchema.optional(),
  budgetCheck: budgetSchema.optional(),
  reviews: z
    .array(
      z.object({
        productId: z.string(),
        rating: z.number(),
        reviewCount: z.number(),
        summary: z.string(),
      }),
    )
    .optional(),
  sizes: z
    .array(z.object({ productId: z.string(), size: z.string() }))
    .optional(),
  timings: z
    .array(z.object({ id: z.string(), label: z.string(), ms: z.number() }))
    .optional(),
});
export type ShoppingResult = z.infer<typeof resultSchema>;
export type Preferences = {
  name: string;
  mode: 'solo' | 'personalized';
  history: boolean;
  location: 'Chicago' | 'New York' | 'London';
  colors: string[];
};
export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  color: string;
  size: string;
  rationale: string;
  confirmed: boolean;
};
export type CircleMember = {
  id: string;
  name: string;
  demo: boolean;
  lastSeen: number;
  online: boolean;
};
export type CircleMessage = {
  id: string;
  name: string;
  text: string;
  createdAt: number;
  type: 'chat' | 'system' | 'preview' | 'snapshot';
  productId?: string;
};
export type CircleState = {
  constraints: {budget?:number;category?:Category;formality?:'casual'|'semi-formal'|'formal'|'black tie'};
  id: string;
  goal: string;
  host: boolean;
  memberId: string;
  members: CircleMember[];
  productIds: string[];
  votes: Record<string, number>;
  myVotes: string[];
  messages: CircleMessage[];
  status: string;
  version: number;
};
