# Cosmo — AI Shopping Orchestrator

Hackathon-ready MVP implementing the **service orchestrator pattern** for an AI shopping assistant.

---

## Architecture

```
ShopperIntent
     │
     ▼
┌──────────────────────────────────────────┐
│          cosmo.service.ts                │
│          ORCHESTRATOR                    │
│                                          │
│  Promise.all([                           │
│    recommendationAgent(intent),  ──→ 🎯  │
│    trendAgent(intent),           ──→ 📈  │
│    localizationAgent(intent),    ──→ 🌍  │
│    friendAgent(intent),          ──→ 👯  │
│    stylistAgent(intent),         ──→ ✦   │
│  ])                                      │
└──────────────────────────────────────────┘
     │
     ▼
Utility Services (sequential, on results)
  stockChecker → budgetChecker → reviewSummarizer → sizePredictor
     │
     ▼
   CosmoResponse
```

---

## File Structure

```
cosmo/
├── CosmoApp.jsx                    ← Self-contained React demo (drop into Claude)
├── package.json
├── README.md
└── src/
    ├── types/
    │   └── index.ts                ← All TypeScript interfaces
    ├── data/
    │   ├── catalog.json            ← Mock product catalog
    │   ├── inventory.json          ← Stock levels
    │   └── trends.json             ← Trend data by occasion/style
    ├── agents/
    │   ├── recommendation/
    │   │   └── recommendation.service.ts   ← Deterministic scoring
    │   ├── trends/
    │   │   └── trends.service.ts           ← Occasion + style trend merge
    │   ├── localization/
    │   │   └── localization.service.ts     ← Currency + weather context
    │   ├── friendInfluence/
    │   │   └── friend.service.ts           ← Social voting simulation
    │   ├── stylist/
    │   │   └── stylist.service.ts          ← ✦ ONLY LLM-powered agent
    │   └── utils.services.ts               ← Stock, budget, reviews, size
    ├── orchestrator/
    │   └── cosmo.service.ts                ← Promise.all fan-out
    └── components/
        ├── CosmoInput.tsx
        ├── LoadingAgents.tsx
        ├── RecommendationCard.tsx
        ├── StylistPanel.tsx
        └── FriendRoom.tsx
```

---

## Agent Design

| Agent | Type | Description |
|-------|------|-------------|
| Recommendation | Deterministic | Scores catalog items by budget fit, occasion, and style tags |
| Trends | Deterministic | Merges occasion + style trend tables, computes overlap score |
| Localization | Deterministic | Maps city → currency/exchange rate/weather context |
| Friend Influence | Deterministic | Social vote weighting with occasion bonuses |
| **Virtual Stylist** | **LLM (Claude)** | Only agent calling Anthropic API — structured JSON output |

### Utility Services (synchronous)

- **StockChecker** — maps item IDs to inventory levels
- **BudgetChecker** — validates cheapest item vs intent budget  
- **ReviewSummarizer** — returns mock review summaries + ratings
- **SizePredictor** — deterministic size recommendation by category

---

## Orchestration Flow

```typescript
// Phase 1: All specialist agents run in parallel
const [recommendations, trends, localization, friendInfluence, stylistAdvice] =
  await Promise.all([
    recommendationAgent(intent),
    trendAgent(intent),
    localizationAgent(intent),
    friendAgent(intent),
    stylistAgent(intent),   // ← only this calls the LLM
  ]);

// Phase 2: Utility services run against phase 1 results
const [stock, budgetCheck, reviews, sizePredictions] = await Promise.all([
  stockChecker(recommendedIds),
  budgetChecker(recommendations.items, intent),
  reviewSummarizer(recommendedIds),
  sizePredictor(recommendedIds, intent),
]);
```

---

## Migration Path to Real Agents

Each service module has an interface contract (`ShopperIntent` in → typed result out). To migrate any agent to a real AI agent:

1. Replace the function body with an actual API call (product API, social graph API, ML model)
2. Keep the same TypeScript interface — the orchestrator doesn't change
3. Add retry logic and timeouts around each `Promise.all` entry

The orchestrator is the only component that needs to know *that* agents exist. Agents never talk to each other.

---

## Quick Start

```bash
npm install
npm run dev
```

Set your `ANTHROPIC_API_KEY` in environment or configure a backend proxy for the Virtual Stylist agent (`src/agents/stylist/stylist.service.ts`).
