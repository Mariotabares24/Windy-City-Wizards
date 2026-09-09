import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
export const shoppers = sqliteTable('shoppers', {
  id: text('id').primaryKey(),
  preferences: text('preferences').notNull(),
  createdAt: integer('created_at').notNull(),
});
export const cart = sqliteTable(
  'cart',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    productId: text('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    color: text('color').notNull(),
    size: text('size').notNull(),
    rationale: text('rationale').notNull(),
    confirmed: integer('confirmed').notNull().default(0),
  },
  (t) => [index('cart_owner').on(t.owner)],
);
export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  goal: text('goal').notNull(),
  products: text('products').notNull(),
  constraints: text('constraints').notNull().default('{}'),
  status: text('status').notNull().default('active'),
  version: integer('version').notNull().default(1),
  createdAt: integer('created_at').notNull(),
});
export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    circleId: text('circle_id').notNull(),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    demo: integer('demo').notNull().default(0),
    removed: integer('removed').notNull().default(0),
    lastSeen: integer('last_seen').notNull(),
  },
  (t) => [uniqueIndex('members_circle_owner_unique').on(t.circleId, t.owner)],
);
export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    circleId: text('circle_id').notNull(),
    name: text('name').notNull(),
    text: text('text').notNull(),
    type: text('type').notNull().default('chat'),
    productId: text('product_id'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('messages_circle_time').on(t.circleId, t.createdAt)],
);
export const votes = sqliteTable(
  'votes',
  {
    circleId: text('circle_id').notNull(),
    memberId: text('member_id').notNull(),
    productId: text('product_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.memberId, t.productId] })],
);
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('events_owner').on(t.owner)],
);
export const cartVersions = sqliteTable('cart_versions', {
  owner: text('owner').primaryKey(),
  version: integer('version').notNull().default(0),
});
