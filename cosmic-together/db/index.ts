import { env } from 'cloudflare:workers';

// Idempotent schema, mirrored from drizzle/*.sql and db/schema.ts. The vite
// Cloudflare plugin spins up a fresh local D1 without running migrations, so we
// bootstrap the tables on first access. `CREATE TABLE IF NOT EXISTS` keeps this
// safe against an already-migrated database (local persistence or production).
// The manual path remains `wrangler d1 migrations apply DB --local`.
const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS shoppers (
    id text PRIMARY KEY NOT NULL,
    preferences text NOT NULL,
    created_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cart (
    id text PRIMARY KEY NOT NULL,
    owner text NOT NULL,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    color text NOT NULL,
    size text NOT NULL,
    rationale text NOT NULL,
    confirmed integer DEFAULT 0 NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS cart_owner ON cart (owner)`,
  `CREATE TABLE IF NOT EXISTS circles (
    id text PRIMARY KEY NOT NULL,
    owner text NOT NULL,
    goal text NOT NULL,
    products text NOT NULL,
    constraints text DEFAULT '{}' NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id text PRIMARY KEY NOT NULL,
    circle_id text NOT NULL,
    owner text NOT NULL,
    name text NOT NULL,
    demo integer DEFAULT 0 NOT NULL,
    removed integer DEFAULT 0 NOT NULL,
    last_seen integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS members_circle_owner_unique ON members (circle_id, owner)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id text PRIMARY KEY NOT NULL,
    circle_id text NOT NULL,
    name text NOT NULL,
    text text NOT NULL,
    type text DEFAULT 'chat' NOT NULL,
    product_id text,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS messages_circle_time ON messages (circle_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS votes (
    circle_id text NOT NULL,
    member_id text NOT NULL,
    product_id text NOT NULL,
    PRIMARY KEY(circle_id, member_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key text PRIMARY KEY NOT NULL,
    count integer NOT NULL,
    expires_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id text PRIMARY KEY NOT NULL,
    owner text NOT NULL,
    name text NOT NULL,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS events_owner ON events (owner)`,
  `CREATE TABLE IF NOT EXISTS cart_versions (
    owner text PRIMARY KEY NOT NULL,
    version integer DEFAULT 0 NOT NULL
  )`,
];

let ready: Promise<D1Database> | null = null;

async function bootstrap(db: D1Database): Promise<D1Database> {
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  return db;
}

// Returns the D1 binding, ensuring the schema exists exactly once per worker.
export function database(): Promise<D1Database> {
  const db = env.DB;
  if (!db)
    return Promise.reject(
      new Error('Storage is temporarily unavailable. Please try again.'),
    );
  if (!ready)
    ready = bootstrap(db).catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}
