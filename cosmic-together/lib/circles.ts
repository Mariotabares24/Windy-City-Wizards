import { eraseCircle } from './retention';
import { database } from '@/db';
import { ApiError, uid } from './server';
export type CircleRow = {
  id: string;
  owner: string;
  goal: string;
  products: string;
  constraints: string;
  status: string;
  version: number;
  created_at: number;
};
export type MemberRow = {
  id: string;
  name: string;
  owner: string;
  demo: number;
  removed: number;
};
export async function findCircle(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new ApiError('This invitation is not valid.', 404);
  const c = await database()
    .prepare('SELECT * FROM circles WHERE id=?')
    .bind(id)
    .first<CircleRow>();
  if (!c) throw new ApiError('This circle could not be found.', 404);
  if (c.status !== 'active' || Date.now() - c.created_at > 86400000) {
    await eraseCircle(id);
    throw new ApiError(
      'This circle has ended. Start a new one to shop together.',
      410,
    );
  }
  return c;
}
export async function findMember(circleId: string, owner: string) {
  return database()
    .prepare('SELECT * FROM members WHERE circle_id=? AND owner=? AND demo=0')
    .bind(circleId, owner)
    .first<MemberRow>();
}
export async function systemMessage(circleId: string, text: string) {
  await database()
    .prepare(
      'INSERT INTO messages (id,circle_id,name,text,type,created_at) VALUES (?,?,?,?,?,?)',
    )
    .bind(uid(), circleId, 'Cosmic', text, 'system', Date.now())
    .run();
}
export async function state(c: CircleRow, member: MemberRow) {
  const db = database();
  const [members, messages, votes, myVotes] = await Promise.all([
    db
      .prepare(
        'SELECT id,name,demo,last_seen AS lastSeen FROM members WHERE circle_id=? AND removed=0 ORDER BY last_seen DESC',
      )
      .bind(c.id)
      .all(),
    db
      .prepare(
        'SELECT id,name,text,type,product_id AS productId,created_at AS createdAt FROM (SELECT * FROM messages WHERE circle_id=? ORDER BY created_at DESC LIMIT 60) ORDER BY created_at ASC',
      )
      .bind(c.id)
      .all(),
    db
      .prepare(
        'SELECT v.product_id AS productId,COUNT(*) AS count FROM votes v JOIN members m ON m.id=v.member_id WHERE v.circle_id=? AND m.removed=0 GROUP BY v.product_id',
      )
      .bind(c.id)
      .all<{ productId: string; count: number }>(),
    db
      .prepare(
        'SELECT product_id AS productId FROM votes WHERE circle_id=? AND member_id=?',
      )
      .bind(c.id, member.id)
      .all<{ productId: string }>(),
  ]);
  return {
    id: c.id,
    goal: c.goal,
    constraints: JSON.parse(c.constraints||'{}'),
    host: c.owner === member.owner,
    memberId: member.id,
    members: members.results.map(m=>({...m,online:Date.now()-Number(m.lastSeen)<15000})),
    productIds: JSON.parse(c.products),
    votes: Object.fromEntries(votes.results.map((v) => [v.productId, v.count])),
    myVotes: myVotes.results.map((v) => v.productId),
    messages: messages.results,
    status: c.status,
    version: c.version,
  };
}
