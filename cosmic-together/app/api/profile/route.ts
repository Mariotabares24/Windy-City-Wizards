import { eraseCircle } from '@/lib/retention';
import { z } from 'zod';
import { database } from '@/db';
import { identity, json, failure, protect, parseBody } from '@/lib/server';
const defaults = {
  name: 'Mario',
  mode: 'personalized',
  history: true,
  location: 'Chicago',
  colors: [],
};
const schema = z.object({
  name: z.string().trim().min(1).max(30),
  mode: z.enum(['solo', 'personalized']),
  history: z.boolean(),
  location: z.enum(['Chicago', 'New York', 'London']),
  colors: z.array(z.string().max(24)).max(5),
});
export async function GET() {
  try {
    const id = await identity();
    const row = await (await database())
      .prepare('SELECT preferences FROM shoppers WHERE id=?')
      .bind(id)
      .first<{ preferences: string }>();
    return json({ preferences: row ? JSON.parse(row.preferences) : defaults });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const id = await identity();
    await protect(req, id);
    const p = schema.parse(await parseBody(req));
    await (await database())
      .prepare(
        'INSERT INTO shoppers (id,preferences,created_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET preferences=excluded.preferences',
      )
      .bind(
        id,
        JSON.stringify({ ...p, colors: p.history ? p.colors : [] }),
        Date.now(),
      )
      .run();
    return json({ preferences: p });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    const id = await identity();
    await protect(req, id);
    const db = await database();
    const owned = await db
      .prepare('SELECT id FROM circles WHERE owner=?')
      .bind(id)
      .all<{ id: string }>();
    for (const c of owned.results) await eraseCircle(c.id);
    await db.batch([
      db.prepare('DELETE FROM shoppers WHERE id=?').bind(id),
      db.prepare('DELETE FROM cart WHERE owner=?').bind(id),
      db.prepare('DELETE FROM events WHERE owner=?').bind(id),
      db.prepare('DELETE FROM cart_versions WHERE owner=?').bind(id),
      db.prepare("UPDATE circles SET status='ended' WHERE owner=?").bind(id),
      db
        .prepare(
          'DELETE FROM votes WHERE member_id IN (SELECT id FROM members WHERE owner=?)',
        )
        .bind(id),
      db
        .prepare('UPDATE members SET removed=1,name=? WHERE owner=?')
        .bind('Former member', id),
    ]);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
