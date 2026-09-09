# Seven-product catalog regression proposal

Research only. These are proposed assertions and fixture snippets; no application source or tests were changed or executed. The application owner should adapt the snippets to the final implementation.

## Proposed behavior under test

- `products` contains exactly seven canonical products. `productById` can also resolve the 29 retired IDs for historical display, retaining their original ID, name, and price, with `stock: 0`.
- Current browsing, recommendations, and new circle shortlist writes use only active products. Persisted cart/circle/message references keep their original IDs; no silent alias substitution occurs.
- Retired cart lines remain visible, unavailable, and removable. They cannot receive a positive quantity or be confirmed. Unknown persisted IDs receive an unavailable fallback row instead of disappearing.
- A formal blazer is compatible with a semi-formal occasion; a semi-formal shirt is also a valid separate item. Generic wedding/outfit requests may return both. Explicit `blazer`, `shirt`/`oxford`, or `coat` nouns constrain the item type. If the owner intentionally keeps generic wedding requests blazer-only, change that one assertion to `['f01']`, while keeping the explicit blazer and strict black-tie tests.
- Existing circle votes/messages remain historical. New votes on retired products are rejected; withdrawing an existing vote remains possible. New demo votes select an active shortlist item, or add no vote when there is none. The host can replace a historical shortlist with active products.

## Current route gaps found before implementation

| Route / consumer | Existing behavior | Required regression |
|---|---|---|
| `app/api/cart/route.ts` add | Checks lookup and `stock < 1` | A retired lookup with zero stock is rejected; unknown ID stays 404 |
| Cart positive quantity | Uses lookup stock, defaulting missing to zero | Retired/unknown positive quantity fails; zero still removes |
| Cart confirm | Checks only cart version | Revalidate every item and aggregate stock; reject retired/unknown/overstock before confirming anything |
| Cart GET and `components/cart.tsx` | Raw stored IDs; unknown lookup silently omitted by UI | Preserve line identity; show unavailable fallback and removal action; do not report a fully confirmed bag with unavailable items |
| `app/api/circles/route.ts` create | Lookup existence only; duplicate IDs allowed | Reject retired IDs and duplicated IDs for new shortlists |
| Circle sync | Lookup existence only; duplicate IDs allowed | Reject retired IDs; maintain existing shortlist and version on rejected sync; accept one active item |
| Circle vote | Stored shortlist membership only | Reject selecting a retired item, but allow withdrawing its prior vote |
| Circle demo | Votes for the first raw stored ID | Prefer the first active item; no invalid vote when all items are retired |
| `@cosmic` cheapest/compare | Includes all lookup products | Do not present retired products as current shopping choices; all-retired response is nonempty and explains unavailability |
| Circle preview / snapshot POST | Lookup existence only | If new promotion of retired products is disallowed, reject them here too; preserve authorized reads of historical messages/snapshots |

The stock update routes batch the cart mutation, version increment, and confirmation reset, then inspect whether the mutation changed a row. Currently a rejected stock update still increments the version and resets confirmation. This predates catalog reduction; avoid assuming a failed mutation leaves the version untouched unless fixing that behavior too. Failed **confirmation** and failed **circle sync** should leave data untouched.

## Unit snippets for `tests/agents.test.ts`

These snippets use the existing exports and Node test runner. They avoid assuming a particular new `kind`/`retired` field name.

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orchestrate, inferIntent } from '../lib/agents';
import { products, productById, type Category } from '../lib/catalog';

const current = [
  { id: 'f01', category: 'fashion', price: 149, type: /blazer/i },
  { id: 'f04', category: 'fashion', price: 59, type: /shirt|oxford/i },
  { id: 'f11', category: 'fashion', price: 189, type: /coat/i },
  { id: 'h01', category: 'home', price: 129, type: /lamp/i },
  { id: 'h04', category: 'home', price: 229, type: /chair/i },
  { id: 'g01', category: 'gadgets', price: 179, type: /headphones/i },
  { id: 'g04', category: 'gadgets', price: 69, type: /speaker/i },
] as const;

const retiredIds = [
  'f02', 'f03', 'f05', 'f06', 'f07', 'f08', 'f09', 'f10', 'f12', 'f13', 'f14',
  'h02', 'h03', 'h05', 'h06', 'h07', 'h08', 'h09', 'h10', 'h11', 'h12',
  'g02', 'g03', 'g05', 'g06', 'g07', 'g08', 'g09', 'g10',
];
const ids = (result: ReturnType<typeof orchestrate>) =>
  result.recommendations.map((r) => r.productId);
const sortedIds = (result: ReturnType<typeof orchestrate>) => ids(result).sort();

test('catalog exposes one stable product and price per item type', () => {
  assert.deepEqual(products.map((p) => p.id).sort(), current.map((p) => p.id).sort());
  assert.equal(new Set(products.map((p) => p.id)).size, 7);
  for (const expected of current) {
    const p = productById(expected.id);
    assert(p, expected.id);
    assert.equal(p.id, expected.id);
    assert.equal(p.category, expected.category);
    assert.equal(p.price, expected.price);
    assert.match(p.name, expected.type);
    assert(p.stock > 0, `${p.id} must remain available after reducing rows`);
    assert(p.colors.includes(p.color));
    assert(p.image.startsWith('/images/'));
  }
  assert.deepEqual(
    ['fashion', 'home', 'gadgets'].map((c) => products.filter((p) => p.category === c).length),
    [3, 2, 2],
  );
});

test('historical lookup preserves retired identities without exposing them for sale', () => {
  for (const id of retiredIds) {
    const p = productById(id);
    assert(p, `Retain ${id} for existing saved references`);
    assert.equal(p.id, id, 'Do not alias stored IDs to different products');
    assert.equal(p.stock, 0);
    assert(!products.some((active) => active.id === id));
  }
  for (const [id, name, price] of [
    ['f02', 'After Hours Blazer', 179],
    ['h02', 'Halo Floor Lamp', 159],
    ['g02', 'Orbit Everyday Headphones', 99],
  ] as const) {
    assert.equal(productById(id)?.name, name);
    assert.equal(productById(id)?.price, price);
  }
  assert.equal(productById('not-real'), undefined);
});

test('semi-formal wedding has available compatible items without filling a three-item quota', () => {
  const r = orchestrate({
    intent: 'An outfit for a fall wedding', category: 'fashion',
    budget: 200, formality: 'semi-formal',
  });
  assert.deepEqual(sortedIds(r), ['f01', 'f04']);
  assert.equal(r.steps.length, 5);
  assert.equal(r.constraints.formality, 'semi-formal');
  assert(!ids(r).includes('f11'), 'A casual coat must not fill an arbitrary quota');
  assert.doesNotMatch(r.summary, /three directions/i);
});

test('explicit item types return one matching canonical product', () => {
  const cases: Array<[Category, string, string]> = [
    ['fashion', 'A blazer', 'f01'],
    ['fashion', 'An Oxford', 'f04'],
    ['fashion', 'A shirt', 'f04'],
    ['fashion', 'A coat', 'f11'],
    ['home', 'A floor lamp', 'h01'],
    ['home', 'A reading chair', 'h04'],
    ['gadgets', 'Headphones for working from home', 'g01'],
    ['gadgets', 'A speaker', 'g04'],
  ];
  for (const [category, intent, expected] of cases) {
    assert.deepEqual(ids(orchestrate({ intent, category, budget: 300 })), [expected], intent);
  }
  assert.deepEqual(ids(orchestrate({
    intent: 'A blazer for a semi-formal wedding', category: 'fashion', budget: 200,
  })), ['f01']);
  assert.equal(inferIntent('An Oxford for the office').category, 'fashion');
});

test('one product price remains a hard boundary, even under strong votes', () => {
  const nouns: Record<string, string> = {
    f01: 'blazer', f04: 'shirt', f11: 'coat', h01: 'lamp',
    h04: 'chair', g01: 'headphones', g04: 'speaker',
  };
  for (const p of current) {
    const input = { intent: nouns[p.id], category: p.category, votes: { [p.id]: 20 } };
    assert.deepEqual(ids(orchestrate({ ...input, budget: p.price })), [p.id]);
    assert.deepEqual(ids(orchestrate({ ...input, budget: p.price - 1 })), []);
  }
});

test('black tie stays a hard constraint when no current product qualifies', () => {
  const r = orchestrate({
    intent: 'A black tie wedding', category: 'fashion', budget: 300,
    formality: 'black tie', votes: { f08: 20, f01: 20 },
  });
  assert.deepEqual(ids(r), []);
  assert.match(r.summary, /no.*match/i);
});

test('edited budget overrides text without introducing retired bargain variants', () => {
  const r = orchestrate({
    intent: 'A blazer for a wedding under $200', category: 'fashion',
    budget: 100, formality: 'semi-formal', votes: { f13: 20 },
  });
  assert.equal(r.constraints.budget, 100);
  assert.deepEqual(ids(r), []);
});

test('social votes reorder two valid item types, never retired alternatives', () => {
  const input = { intent: 'Find something good', category: 'home' as const, budget: 300 };
  const first = orchestrate(input);
  assert.equal(first.recommendations.length, 2);
  const favorite = first.recommendations[1].productId;
  const voted = orchestrate({ ...input, votes: { [favorite]: 3, h02: 20 } });
  assert.equal(voted.recommendations[0].productId, favorite);
  assert.deepEqual(sortedIds(voted), ['h01', 'h04']);
});

test('generic category recommendations have no duplicate types or retired IDs', () => {
  for (const category of ['fashion', 'home', 'gadgets'] as const) {
    const r = orchestrate({
      intent: 'Find something good', category, budget: 300,
      votes: Object.fromEntries(retiredIds.map((id) => [id, 20])),
    });
    assert.deepEqual(sortedIds(r), current.filter((p) => p.category === category).map((p) => p.id).sort());
    assert.equal(new Set(ids(r)).size, ids(r).length);
  }
});
```

Keep the existing guardrail, malformed-input, explicit-category inference, and hard-constraint tests. Change the old wedding social-vote test to the two-candidate home test above; do not weaken it to merely check a favorite remains somewhere in the result.

## HTTP integration changes that need no historical fixture

Use the existing `Client` from `tests/integration.ts`. The snippet is intended to replace the result-count and third-item assumptions, then add retired-write checks.

```ts
const result = await host.request('/api/concierge', {
  intent: 'A fall wedding outfit under $200', category: 'fashion',
  budget: 200, formality: 'semi-formal',
});
assert.deepEqual(result.recommendations.map((r: any) => r.productId).sort(), ['f01', 'f04']);
const ids = result.recommendations.map((r: any) => r.productId);
const favorite = ids.at(-1)!;
// After the existing create/join flow:
await guest.request(path, { action: 'vote', productId: favorite, selected: true });
await guest.request(path, { action: 'vote', productId: favorite, selected: true });
let state = await host.request(path);
assert.equal(state.votes[favorite], 1);
await guest.request(path, { action: 'message', text: 'I like this option. @cosmic compare' });

await host.request('/api/cart', {
  action: 'add', productId: 'f02', color: 'Charcoal', size: 'M',
}, 'POST', 400);
assert(!(await host.request('/api/cart')).items.some((i: any) => i.productId === 'f02'));

await host.request('/api/circles', {
  goal: 'Retired choice', name: 'Test Host', productIds: ['f02'],
}, 'POST', 400);

const beforeSync = await host.request(path);
await host.request(path, { action: 'sync', productIds: ['f02'] }, 'POST', 400);
const afterSync = await host.request(path);
assert.deepEqual(afterSync.productIds, beforeSync.productIds);
assert.equal(afterSync.version, beforeSync.version);

await host.request(path, { action: 'sync', productIds: ['f01'] });
assert.deepEqual((await guest.request(path)).productIds, ['f01']);
await guest.request(path, { action: 'vote', productId: 'f01', selected: true });
assert((await host.request(path)).votes.f01 >= 1);

await host.request('/api/circles', {
  goal: 'Duplicate choice', name: 'Test Host', productIds: ['f01', 'f01'],
}, 'POST', 400);
```

Retain the active f01 stock test: its stock remains 4, so two Midnight/M units plus one Ivory/L unit must reject changing Midnight/M to 4. Re-read the bag and assert the total quantity is still 3 after the rejection. This catches aggregate-stock regressions independently of the seven-item count.

## Historical persistence requires a fixture

New API validation deliberately cannot create retired records, so calling the new add/create routes is not a valid test of old saved data. Seed a dedicated local test D1 database through an existing test harness/fixture connection. Do not add a production fixture endpoint. The proposed `fixtureDb` below is a test-provided D1 connection to the same isolated local database as the integration server; it is not an existing application export.

The owner is the test client's already-issued 64-character anonymous session token. Keep it in memory; do not print it. `Client.cookie` currently has the shape `cosmic_session=<token>`.

```ts
const legacy = new Client();
await legacy.request('/api/profile');
const owner = legacy.cookie.slice('cosmic_session='.length);
assert.match(owner, /^[a-f0-9]{64}$/);
const legacyLineId = 'legacy-catalog-regression';
await fixtureDb.batch([
  fixtureDb.prepare(
    'INSERT INTO cart (id,owner,product_id,quantity,color,size,rationale,confirmed) VALUES (?,?,?,?,?,?,?,0)',
  ).bind(legacyLineId, owner, 'f02', 1, 'Charcoal', 'M', 'Saved before catalog simplification.'),
  fixtureDb.prepare('INSERT INTO cart_versions (owner,version) VALUES (?,1)').bind(owner),
]);

const originalBag = await legacy.request('/api/cart');
assert.equal(originalBag.items.length, 1);
assert.equal(originalBag.items[0].id, legacyLineId);
assert.equal(originalBag.items[0].productId, 'f02');
assert.equal(originalBag.items[0].quantity, 1);
await legacy.request('/api/cart', {
  action: 'quantity', id: legacyLineId, quantity: 2,
}, 'POST', 400);
const beforeConfirm = await legacy.request('/api/cart');
await legacy.request('/api/cart', {
  action: 'confirm', version: beforeConfirm.version,
}, 'POST', 400); // An unavailable selection is invalid, not a stale-version conflict.
const afterConfirm = await legacy.request('/api/cart');
assert.equal(afterConfirm.version, beforeConfirm.version);
assert(afterConfirm.items.every((i: any) => !i.confirmed));
await legacy.request('/api/cart', { action: 'quantity', id: legacyLineId, quantity: 0 });
assert.equal((await legacy.request('/api/cart')).items.length, 0);

// Add one valid product after removing the retired line and prove normal recovery.
await legacy.request('/api/cart', { action: 'add', productId: 'f01', color: 'Midnight', size: 'M' });
const recovered = await legacy.request('/api/cart');
await legacy.request('/api/cart', { action: 'confirm', version: recovered.version });
assert((await legacy.request('/api/cart')).items.every((i: any) => i.confirmed));
```

Repeat the same sequence with a seeded unknown ID `deleted-id`, checking GET preserves the line and removal still succeeds. Seed a **mixed cart** containing active f01 and retired f02 and verify rejecting confirmation does not confirm the active row partially. Also seed a previously `confirmed=1` retired row: the UI must not claim it is a currently valid fully confirmed bag, although preserving the historical database flag is acceptable if availability separately determines the UI state.

For stock revalidation, seed active f01 variants with quantities 3 and 2. Confirm must reject the aggregate 5 against stock 4 even though each individual row is within stock. The same validation should reject a stored color/size that is no longer supported if the owner adds full cart revalidation.

## Historical circle fixture and assertions

First create a circle normally with `productIds: ['f01']`; join a guest and obtain its `memberId`. Then simulate pre-change persisted data in the isolated test database:

```ts
await fixtureDb.batch([
  fixtureDb.prepare('UPDATE circles SET products=? WHERE id=?')
    .bind(JSON.stringify(['f02', 'f01']), oldCircleId),
  fixtureDb.prepare('INSERT INTO votes (circle_id,member_id,product_id) VALUES (?,?,?)')
    .bind(oldCircleId, guestMemberId, 'f02'),
  fixtureDb.prepare(
    "INSERT INTO messages (id,circle_id,name,text,type,product_id,created_at) VALUES (?,?,?,?,'preview',?,?)",
  ).bind(crypto.randomUUID(), oldCircleId, 'Test Guest', 'An earlier saved preview.', 'f02', Date.now()),
]);
const oldPath = '/api/circles/' + oldCircleId;
const historical = await guest.request(oldPath);
assert.deepEqual(historical.productIds, ['f02', 'f01']);
assert.equal(historical.votes.f02, 1);
assert(historical.myVotes.includes('f02'));
assert(historical.messages.some((m: any) => m.productId === 'f02'));
assert(!historical.votes.f01, 'Do not transfer a historical vote to a different product');

await guest.request(oldPath, { action: 'vote', productId: 'f02', selected: true }, 'POST', 400);
await guest.request(oldPath, { action: 'vote', productId: 'f02', selected: false });
const withdrew = await guest.request(oldPath);
assert(!withdrew.myVotes.includes('f02'));
assert.equal(withdrew.votes.f02 ?? 0, 0);

await host.request(oldPath, { action: 'demo' });
const demoState = await host.request(oldPath);
assert.equal(demoState.votes.f02 ?? 0, 0);
assert.equal(demoState.votes.f01, 1);
await host.request(oldPath, { action: 'sync', productIds: ['f01', 'f04'] });
assert.deepEqual((await guest.request(oldPath)).productIds, ['f01', 'f04']);
```

Test a separate all-retired circle (`['f02']`) as well. `@cosmic compare` and `@cosmic cheapest` must give a nonempty unavailable/refine response, not recommend the retired item as available or append an empty system message. A demo action must not add an f02 vote. Preserve history without treating old votes as votes for f01.

For snapshot history, create a valid snapshot before replacing its stored message `product_id` with f02 in the fixture; existing authorized snapshot GET should remain 200 and outsider GET remain 403. If new retired snapshot POST is disallowed, assert its 400 leaves both snapshot-message count and object storage unchanged.

## Targeted browser regression observations

No new browser framework is needed for these reversible visual checks. Use the existing browser QA workflow once the implementation is running:

1. Fashion/home/gadgets category coverflow shows 3/2/2 distinct products, one price per type; changing categories cannot expose retired products.
2. Explicit lamp/headphones/coat queries each show one matching item; the shorter shortlist has working details, AR, circle, and add-to-bag actions.
3. A seeded retired bag line shows its original name and historical price, an unavailable label, disabled increase/review, and a working removal button. A seeded unknown line shows an unavailable fallback and removal instead of a blank cart panel.
4. A mixed active/retired bag cannot claim the whole selection is confirmed; removing the retired line restores normal review/confirmation.
5. Historical circle cards/messages remain intelligible and carry unavailable state; current shopping actions cannot promote retired choices. A previously selected historical vote can be withdrawn.

These browser checks complement service assertions; source snapshots or string searches would not prove the user can recover a saved cart.
