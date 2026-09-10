import { eraseCircle } from '@/lib/retention';
import { z } from 'zod';
import { circleConstraintsSchema } from '@/lib/contracts';
import { database } from '@/db';
import { availableProduct } from '@/lib/catalog';
import { safeShoppingText } from '@/lib/agents';
import {
  identity,
  json,
  failure,
  protect,
  parseBody,
  uid,
  ApiError,
} from '@/lib/server';
import { findCircle, findMember, state, systemMessage } from '@/lib/circles';
const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('join'),
    name: z.string().trim().min(1).max(30),
  }),
  z.object({
    action: z.literal('message'),
    text: z.string().trim().min(1).max(1000),
  }),
  z.object({
    action: z.literal('vote'),
    productId: z.string(),
    selected: z.boolean(),
  }),
  z.object({
    action: z.literal('sync'),
    productIds: z.array(z.string()).min(1).max(3),
    constraints: circleConstraintsSchema,
  }),
  z.object({ action: z.literal('demo') }),
  z.object({ action: z.literal('end') }),
  z.object({ action: z.literal('leave') }),
  z.object({ action: z.literal('remove'), memberId: z.uuid() }),
  z.object({
    action: z.literal('preview'),
    productId: z.string(),
    text: z.string().trim().max(200),
  }),
]);
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const owner = await identity();
    await protect(_req, owner, true);
    const c = await findCircle(id);
    const m = await findMember(id, owner);
    if (m?.removed)
      throw new ApiError('You no longer have access to this circle.', 403);
    if (!m) return json({ invitation: true, id, goal: c.goal });
    await (await database())
      .prepare('UPDATE members SET last_seen=? WHERE id=? AND last_seen < ?')
      .bind(Date.now(), m.id, Date.now() - 10000)
      .run();
    return json(await state(c, m));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const owner = await identity();
    await protect(req, owner);
    const c = await findCircle(id);
    const b = schema.parse(await parseBody(req));
    const db = await database();
    const m = await findMember(id, owner);
    if (m?.removed)
      throw new ApiError('You no longer have access to this circle.', 403);
    if (b.action === 'join') {
      if (!m) {
        const count = await db
          .prepare(
            'SELECT COUNT(*) AS n FROM members WHERE circle_id=? AND removed=0',
          )
          .bind(id)
          .first<{ n: number }>();
        if ((count?.n || 0) >= 8) throw new ApiError('This circle is full.');
        const mid = uid();
        const inserted = await db
          .prepare(
            'INSERT OR IGNORE INTO members (id,circle_id,owner,name,demo,removed,last_seen) SELECT ?,?,?,?,0,0,? WHERE (SELECT COUNT(*) FROM members WHERE circle_id=? AND removed=0)<8',
          )
          .bind(mid, id, owner, b.name, Date.now(), id)
          .run();
        if (!inserted.meta.changes) {
          if (await findMember(id, owner)) return json({ ok: true });
          throw new ApiError('This circle is full.');
        }
        await systemMessage(id, `${b.name} joined your shopping circle.`);
      }
      return json({ ok: true });
    }
    if (!m) throw new ApiError('Join this circle first.', 403);
    const host = c.owner === owner;
    if (['sync', 'demo', 'end', 'remove'].includes(b.action) && !host)
      throw new ApiError('Only the host can do that.', 403);
    if (b.action === 'message') {
      if (!safeShoppingText(b.text))
        throw new ApiError(
          'Keep this circle focused on helpful shopping advice.',
        );
      await db
        .prepare(
          "INSERT INTO messages (id,circle_id,name,text,type,created_at) VALUES (?,?,?,?,'chat',?)",
        )
        .bind(uid(), id, m.name, b.text, Date.now())
        .run();
      if (/@cosmo/i.test(b.text)) {
        const ps = (JSON.parse(c.products) as string[])
          .map(availableProduct)
          .filter(Boolean);
        let answer =
          'Vote for a favorite, then ask your host to refine the shortlist. Your budget always comes first.';
        if (/cheap|budget|price/i.test(b.text)) {
          const cheapest = ps.sort((a, b) => a!.price - b!.price)[0];
          answer = cheapest
            ? `${cheapest.name} is the lowest-priced choice here at $${cheapest.price}. Prices are from our sample catalog.`
            : answer;
        } else if (/compare|difference/i.test(b.text)) {
          answer =
            ps
              .map(
                (p) =>
                  `${p!.name}: $${p!.price}, ${p!.material.toLowerCase()}.`,
              )
              .join(' ') ||
            'These items are no longer available. Ask your host to update the shortlist.';
        } else if (/try|visual|ar/i.test(b.text))
          answer =
            'Open a product and choose “Try it in your world.” Camera access is optional and stays on your device.';
        await systemMessage(id, answer);
      }
    } else if (b.action === 'vote') {
      if (b.selected && !availableProduct(b.productId))
        throw new ApiError(
          'This item is no longer available. Ask the host to update the shortlist.',
        );
      if (!(JSON.parse(c.products) as string[]).includes(b.productId))
        throw new ApiError('That product is not on this shortlist.');
      if (b.selected)
        await db
          .prepare(
            'INSERT OR IGNORE INTO votes (circle_id,member_id,product_id) VALUES (?,?,?)',
          )
          .bind(id, m.id, b.productId)
          .run();
      else
        await db
          .prepare(
            'DELETE FROM votes WHERE circle_id=? AND member_id=? AND product_id=?',
          )
          .bind(id, m.id, b.productId)
          .run();
    } else if (b.action === 'sync') {
      if (
        new Set(b.productIds).size !== b.productIds.length ||
        b.productIds.some((p) => !availableProduct(p))
      )
        throw new ApiError('Unknown product.');
      await db
        .prepare('UPDATE circles SET products=?,constraints=? WHERE id=?')
        .bind(JSON.stringify(b.productIds), JSON.stringify(b.constraints), id)
        .run();
      await systemMessage(
        id,
        'The host updated the shortlist with your feedback.',
      );
    } else if (b.action === 'demo') {
      const found = await db
        .prepare(
          'SELECT id FROM members WHERE circle_id=? AND demo=1 AND removed=0',
        )
        .bind(id)
        .first();
      if (!found) {
        const mid = uid();
        const favorite = (JSON.parse(c.products) as string[]).find((pid) =>
          availableProduct(pid),
        );
        if (!favorite)
          throw new ApiError(
            'Update this circle with available products before adding a demo friend.',
          );
        await db.batch([
          db
            .prepare(
              'INSERT INTO members (id,circle_id,owner,name,demo,removed,last_seen) VALUES (?,?,?,?,1,0,?)',
            )
            .bind(mid, id, 'demo:' + uid(), 'Kass · demo', Date.now()),
          db
            .prepare(
              'INSERT INTO votes (circle_id,member_id,product_id) VALUES (?,?,?)',
            )
            .bind(id, mid, favorite),
          db
            .prepare(
              "INSERT INTO messages (id,circle_id,name,text,type,created_at) VALUES (?,?,?,?,'chat',?)",
            )
            .bind(
              uid(),
              id,
              'Kass · demo',
              'I’m leaning toward the first one. Let’s see it in the preview!',
              Date.now(),
            ),
        ]);
        await systemMessage(id, 'Kass joined as a simulated demo friend.');
      }
    } else if (b.action === 'end') {
      await eraseCircle(id);
      return json({ ok: true });
    } else if (b.action === 'leave' || b.action === 'remove') {
      const memberId = b.action === 'leave' ? m.id : b.memberId;
      const target = await db
        .prepare(
          'SELECT id,owner,name FROM members WHERE id=? AND circle_id=? AND removed=0',
        )
        .bind(memberId, id)
        .first<{ id: string; owner: string; name: string }>();
      if (!target) throw new ApiError('Member not found.', 404);
      if (target.owner === c.owner)
        throw new ApiError('End your circle to leave as host.');
      await db
        .prepare('UPDATE members SET removed=1 WHERE id=? AND circle_id=?')
        .bind(memberId, id)
        .run();
      await systemMessage(id, `${target.name} left the circle.`);
    } else if (b.action === 'preview') {
      if (!availableProduct(b.productId))
        throw new ApiError('Product not found.');
      await db
        .prepare(
          "INSERT INTO messages (id,circle_id,name,text,type,product_id,created_at) VALUES (?,?,?,?,'preview',?,?)",
        )
        .bind(
          uid(),
          id,
          m.name,
          b.text || 'Take a look at this product preview.',
          b.productId,
          Date.now(),
        )
        .run();
    }
    await db
      .prepare('UPDATE circles SET version=version+1 WHERE id=?')
      .bind(id)
      .run();
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
