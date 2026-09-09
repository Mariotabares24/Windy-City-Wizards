import { env } from 'cloudflare:workers';
import { database } from '@/db';
export async function eraseCircle(id: string) {
  const db = await database();
  const snapshots = await db
    .prepare("SELECT id FROM messages WHERE circle_id=? AND type='snapshot'")
    .bind(id)
    .all<{ id: string }>();
  if (snapshots.results.length && env.SNAPSHOTS)
    await env.SNAPSHOTS.delete(
      snapshots.results.map((m) => id + '/' + m.id + '.jpg'),
    );
  await db.batch([
    db.prepare('DELETE FROM votes WHERE circle_id=?').bind(id),
    db.prepare('DELETE FROM messages WHERE circle_id=?').bind(id),
    db.prepare('DELETE FROM members WHERE circle_id=?').bind(id),
    db.prepare('DELETE FROM circles WHERE id=?').bind(id),
  ]);
}
export async function cleanupExpired() {
  const rows = await (await database())
    .prepare('SELECT id FROM circles WHERE created_at < ? LIMIT 10')
    .bind(Date.now() - 86400000)
    .all<{ id: string }>();
  for (const c of rows.results) await eraseCircle(c.id);
}
