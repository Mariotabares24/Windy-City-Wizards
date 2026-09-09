import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
class Client {
  cookie = '';
  async request(
    path: string,
    body?: unknown,
    method = body ? 'POST' : 'GET',
    expected = 200,
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const set = response.headers.getSetCookie();
    if (set.length) {
      const session = set.find((c) => c.startsWith('cosmic_session='));
      if (session) this.cookie = session.split(';')[0];
    }
    const data = (await response.json()) as any;
    assert.equal(
      response.status,
      expected,
      `${method} ${path}: ${JSON.stringify(data)}`,
    );
    return data;
  }
}
let count = 0;
function pass(label: string) {
  count++;
  console.log(`PASS ${label}`);
}
const host = new Client(),
  guest = new Client(),
  outsider = new Client();
await host.request('/api/profile');
await guest.request('/api/profile');
await outsider.request('/api/profile');
assert(host.cookie && guest.cookie && host.cookie !== guest.cookie);
pass('independent anonymous sessions');
await host.request(
  '/api/profile',
  {
    name: 'Test Host',
    mode: 'personalized',
    history: true,
    location: 'Chicago',
    colors: ['Midnight'],
  },
  'PUT',
);
const profile = await host.request('/api/profile');
assert.deepEqual(profile.preferences.colors, ['Midnight']);
pass('durable private preferences');
const result = await host.request('/api/concierge', {
  intent: 'A fall wedding outfit under $200',
  category: 'fashion',
  budget: 200,
  formality: 'semi-formal',
});
assert.equal(result.recommendations.length, 2);
pass('recommendation orchestration');
const low = await host.request('/api/concierge', {
  intent: 'A wedding outfit under $200',
  category: 'fashion',
  budget: 100,
});
assert.equal(low.constraints.budget, 100);
pass('edited hard budget');
await host.request(
  '/api/cart',
  { action: 'add', productId: 'f03', color: 'Camel', size: 'M' },
  'POST',
  400,
);
await host.request(
  '/api/circles',
  { goal: 'Retired item test', name: 'Test Host', productIds: ['f03'] },
  'POST',
  400,
);
await host.request(
  '/api/circles',
  {
    goal: 'Duplicate item test',
    name: 'Test Host',
    productIds: ['f01', 'f01'],
  },
  'POST',
  400,
);
pass('retired and duplicate products rejected');
const ids = result.recommendations.map((r: any) => r.productId);
const created = await host.request(
  '/api/circles',
  {
    goal: 'Integration test: fall wedding',
    name: 'Test Host',
    productIds: ids,
  },
  'POST',
  201,
);
const path = '/api/circles/' + created.id;
const invitation = await guest.request(path);
assert.equal(invitation.invitation, true);
assert(!('members' in invitation));
pass('invitation has no member data before join');
await Promise.all([
  guest.request(path, { action: 'join', name: 'Test Guest' }),
  guest.request(path, { action: 'join', name: 'Test Guest' }),
]);
let state = await host.request(path);
assert.equal(state.members.length, 2);
assert(!JSON.stringify(state).includes('Midnight'));
assert(!('preferences' in state));
pass('atomic duplicate join and profile isolation');
await guest.request(path, {
  action: 'vote',
  productId: ids[1],
  selected: true,
});
await guest.request(path, {
  action: 'vote',
  productId: ids[1],
  selected: true,
});
state = await host.request(path);
assert.equal(state.votes[ids[1]], 1);
pass('idempotent cross-session votes');
await guest.request(path, {
  action: 'message',
  text: 'I like the second option. @cosmic compare',
});
state = await host.request(path);
assert(
  state.messages.some(
    (m: any) => m.text === 'I like the second option. @cosmic compare',
  ),
);
assert(
  state.messages.some((m: any) => m.name === 'Cosmic' && m.text.includes('$')),
);
pass('shared chat and contextual concierge');
await guest.request(path, { action: 'end' }, 'POST', 403);
await outsider.request(
  path,
  { action: 'vote', productId: ids[0], selected: true },
  'POST',
  403,
);
pass('host controls and unauthorized write denial');
await host.request(path, { action: 'demo' });
await host.request(path, { action: 'demo' });
state = await host.request(path);
assert.equal(state.members.filter((m: any) => m.demo).length, 1);
pass('repeat-safe demo friend');
await host.request(path, { action: 'sync', productIds: [...ids].reverse() });
const guestState = await guest.request(path);
assert.deepEqual(guestState.productIds, [...ids].reverse());
pass('shared shortlist updates');
const image = await readFile(
  new URL('../public/images/home.jpg', import.meta.url),
);
const form = new FormData();
form.append('image', new Blob([image], { type: 'image/jpeg' }), 'preview.jpg');
form.append('productId', ids[0]);
const upload = await fetch(base + path + '/snapshot', {
  method: 'POST',
  headers: { Cookie: host.cookie },
  body: form,
});
assert.equal(upload.status, 200, await upload.text());
state = await guest.request(path);
const snap = state.messages.find((m: any) => m.type === 'snapshot');
assert(snap);
const photo = await fetch(base + path + '/snapshot?message=' + snap.id, {
  headers: { Cookie: guest.cookie },
});
assert.equal(photo.status, 200);
const denied = await fetch(base + path + '/snapshot?message=' + snap.id, {
  headers: { Cookie: outsider.cookie },
});
assert.equal(denied.status, 403);
pass('snapshot storage and member-only retrieval');
await host.request('/api/cart', {
  action: 'add',
  productId: 'f01',
  color: 'Midnight',
  size: 'M',
  rationale: 'Reviewed by test shopper.',
});
let bag = await host.request('/api/cart');
assert.equal(bag.items.length, 1);
assert.equal((await guest.request('/api/cart')).items.length, 0);
pass('cart persistence and isolation');
const stale = bag.version;
await host.request('/api/cart', {
  action: 'quantity',
  id: bag.items[0].id,
  quantity: 2,
});
await host.request(
  '/api/cart',
  { action: 'confirm', version: stale },
  'POST',
  409,
);
bag = await host.request('/api/cart');
await host.request('/api/cart', { action: 'confirm', version: bag.version });
assert((await host.request('/api/cart')).items.every((i: any) => i.confirmed));
pass('review version prevents stale confirmation');
await host.request('/api/cart', {
  action: 'add',
  productId: 'f01',
  color: 'Ivory',
  size: 'L',
});
bag = await host.request('/api/cart');
await host.request(
  '/api/cart',
  {
    action: 'quantity',
    id: bag.items.find((i: any) => i.color === 'Midnight').id,
    quantity: 4,
  },
  'POST',
  400,
);
pass('stock limits aggregate variants');
await host.request(
  '/api/cart',
  { action: 'add', productId: 'not-real', color: 'Black', size: 'M' },
  'POST',
  404,
);
await host.request(
  '/api/cart',
  { action: 'quantity', id: bag.items[0].id, quantity: -1 },
  'POST',
  400,
);
await guest.request(
  '/api/cart',
  { action: 'quantity', id: bag.items[0].id, quantity: 0 },
  'POST',
  404,
);
pass('invalid product, quantity, and foreign cart denied');
const guestMember = state.members.find((m: any) => m.name === 'Test Guest');
await host.request(path, { action: 'remove', memberId: guestMember.id });
await guest.request(path, undefined, 'GET', 403);
pass('removed guest loses access');
await host.request(path, { action: 'end' });
await outsider.request(path, undefined, 'GET', 404);
pass('ended circle removed');
await host.request('/api/profile', undefined, 'DELETE');
assert.equal((await host.request('/api/cart')).items.length, 0);
assert.equal((await host.request('/api/profile')).preferences.mode, 'solo');
pass('private data deletion');
await guest.request('/api/profile', undefined, 'DELETE');
await outsider.request('/api/profile', undefined, 'DELETE');
console.log(`${count} integration checks passed against ${base}`);
