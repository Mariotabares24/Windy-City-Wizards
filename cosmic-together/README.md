# Cosmic Together

A deployed social-shopping prototype for the Cosmic Mart / Accenture APEX scenario. The app connects a curated catalog, a constrained shopping concierge, shared circles, product visualization, and a human-confirmed bag.

## Run locally

Requires Node.js 22.13+ and pnpm. Dependencies and native install-script approvals are pinned in the lockfile and workspace configuration.

```sh
pnpm install
pnpm exec wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
pnpm dev
```

Open the local URL printed by the server. `/demo` starts the wedding journey. Use another browser profile or private window to join an invitation as another shopper.

```sh
pnpm test
pnpm test:integration
pnpm typecheck
pnpm lint
pnpm build
```

The integration suite needs the local server and migrated database. It creates disposable shopper sessions and removes its circles and private test data. Set `TEST_BASE_URL` to run it against the deployed app.

## Included

- 36 fictional products across Fashion, Home & living, and Gadgets; search, product pages, variants, and three-product comparison.
- A validated, deterministic concierge with intent parsing, hard budget/formality/category filtering, catalog research, selected palette matching, sample market availability, social ranking, and evidence summaries.
- Database-backed invite circles: anonymous guest joins, 2.5-second polling, presence, chat, contextual `@cosmic` answers, repeat-safe voting, shared shortlists, host removal/end controls, and explicitly labeled demo friend.
- Durable private preferences and carts; quantity validation across variants; review-version checks prevent another tab’s changes from being silently confirmed.
- Shoulder-landmark fashion preview using locally bundled MediaPipe; damped garment alignment; camera permission/error/recovery states.
- Physically shaded 3D garment, lamp, chair, headphones, and speaker prototypes; home rotation/placement and fixed model scale; three captioned gadget tutorials with articulated translucent hand.
- Optional local camera overlays; private JPEG capture/download; separately confirmed circle snapshot sharing through private R2 storage.
- Responsive layout, keyboard controls, focus states, modal primitives, alternative text, reduced motion handling, and camera-free fallbacks.

## Honest boundaries

This is a working hackathon prototype, not a real retail transaction system. Prices, inventory, product specifications, matches, and photography are illustrative. No payments or real orders are submitted. No production Cosmic Mart backend is connected.

The concierge currently uses deterministic catalog rules, **not a live generative model**. This keeps the demo independent of API keys and external model outages. Connecting live GenAI requires an approved provider account/key, a server-side model adapter, schema validation with retry/fallback, and evaluations. Do not label current catalog guidance as live GenAI.

Fashion uses real body landmarks but approximate prototype geometry; it does not measure bodies, simulate cloth, guarantee sizing, or provide production-quality photorealism. Home camera placement is manual and approximate; no surface detection or spatial measurement is claimed. Gadget instructions are authored for fictional product designs. Catalog photo colors may differ from the editable prototype model; this is disclosed in-product.

Camera hardware, real body tracking, mobile Safari, and WebGL rendering need hands-on acceptance on presentation devices. Automated validation covers type/lint checks, recommendation logic, deployed HTTP routes, and real multi-session service behavior; it does not establish device-specific AR performance or visual fidelity.

## Storage and security

Cloudflare D1 holds private shopper preferences, cart/version rows, circles, memberships, messages, votes, ephemeral rate counters, and minimal conversion events. R2 holds only snapshots deliberately shared by their owner. The hosting platform provisions logical `DB` and `SNAPSHOTS` bindings.

Anonymous ownership uses a cryptographically random HttpOnly, SameSite=Lax cookie, with Secure enabled in production. Treat this as guest-session security, not verified identity. Clearing cookies creates a new shopper; possession of a still-valid invitation allows a new join. There is no account recovery or cross-device private-cart sync.

All SQL uses bound parameters. Writes check same-origin requests, validate inputs and products, and rate-limit sessions plus the platform-provided network address. Circle writes enforce membership and host privileges. Snapshot reads require an active member. Video never leaves the device.

Circle invitations expire after 24 hours. End-circle deletes its rows and snapshots immediately. Expired records are removed opportunistically on access or new-circle creation (bounded batches), not by a scheduled retention worker. Clearing private data removes preferences, cart, analytics, and owned circles; previously shared messages can remain in others’ circles until expiry. A production service should add scheduled retention, verified identity, infrastructure-level abuse protection, request idempotency, observability, and legal review.

## Deployment

App navigation deliberately uses native anchors. The pinned Vinext production
client router threw on link clicks (`e is not a function`) and prefetch, despite
successful direct HTTP requests. Full document navigation avoids that broken
path and gives each category/query fresh state. The corresponding Next-only
anchor lint rule is disabled; browser click-through verification is required
before changing this decision. Do not replace these anchors with `next/link`
without testing the production bundle in a browser.

`pnpm build` emits a Cloudflare Worker and static assets. `.openai/hosting.json` describes the Sites project and logical bindings. `drizzle/` contains schema-only migrations; already applied migrations must remain immutable. Only this application directory is published. The supplied internal reference PDFs and brainstorming notes stay outside it.

See `docs/BLUEPRINT.md`, `docs/DEMO.md`, and `docs/ASSETS.md` for architecture, presentation flow, and asset attribution.
