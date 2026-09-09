import { cleanupExpired } from '@/lib/retention';
import { z } from 'zod';
import { circleConstraintsSchema } from '@/lib/contracts';
import { database } from '@/db';
import { availableProduct } from '@/lib/catalog';
import {
  identity,
  json,
  failure,
  protect,
  parseBody,
  uid,
  ApiError,
  event,
} from '@/lib/server';
import { systemMessage } from '@/lib/circles';
const schema = z.object({
  goal: z.string().trim().min(1).max(500),
  name: z.string().trim().min(1).max(30),
  productIds: z.array(z.string()).min(1).max(3),
  constraints: circleConstraintsSchema,
});
export async function POST(req: Request) {
  try {
    const owner = await identity();
    await protect(req, owner);
    await cleanupExpired();
    const b = schema.parse(await parseBody(req));
    if (
      new Set(b.productIds).size !== b.productIds.length ||
      b.productIds.some((id) => !availableProduct(id))
    )
      throw new ApiError('Choose products from this catalog.');
    const id = uid();
    const db = await database();
    await db.batch([
      db
        .prepare(
          "INSERT INTO circles (id,owner,goal,products,constraints,status,version,created_at) VALUES (?,?,?,?,?,'active',1,?)",
        )
        .bind(
          id,
          owner,
          b.goal,
          JSON.stringify(b.productIds),
          JSON.stringify(b.constraints),
          Date.now(),
        ),
      db
        .prepare(
          'INSERT INTO members (id,circle_id,owner,name,demo,removed,last_seen) VALUES (?,?,?,?,0,0,?)',
        )
        .bind(uid(), id, owner, b.name, Date.now()),
    ]);
    await systemMessage(id, `${b.name} started a shopping circle.`);
    await event(owner, 'party_created');
    return json({ id }, 201);
  } catch (e) {
    return failure(e);
  }
}
