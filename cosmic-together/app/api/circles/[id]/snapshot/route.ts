import { env } from 'cloudflare:workers';
import { database } from '@/db';
import { findCircle, findMember } from '@/lib/circles';
import { identity, protect, json, failure, ApiError, uid } from '@/lib/server';
import { availableProduct } from '@/lib/catalog';
type Context = { params: Promise<{ id: string }> };
export async function POST(req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const owner = await identity();
    await protect(req, owner);
    await findCircle(id);
    const m = await findMember(id, owner);
    if (!m || m.removed)
      throw new ApiError('Join this circle before sharing.', 403);
    if (Number(req.headers.get('content-length') || 0) > 1600000)
      throw new ApiError('Choose a smaller snapshot.', 413);
    const form = await req.formData();
    const file = form.get('image');
    const productId = form.get('productId');
    const pid = typeof productId === 'string' ? productId : '';
    if (
      !(file instanceof File) ||
      file.type !== 'image/jpeg' ||
      file.size > 1500000
    )
      throw new ApiError('Share a JPEG snapshot smaller than 1.5 MB.');
    if (!availableProduct(pid)) throw new ApiError('Product not found.');
    const bytes = await file.arrayBuffer();
    const header = new Uint8Array(bytes);
    if (header[0] !== 255 || header[1] !== 216 || header[2] !== 255)
      throw new ApiError('Invalid JPEG image.');
    const db = database();
    const count = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM messages WHERE circle_id=? AND type='snapshot'",
      )
      .bind(id)
      .first<{ n: number }>();
    if ((count?.n || 0) >= 20)
      throw new ApiError('This circle has reached its snapshot limit.');
    const mid = uid();
    await env.SNAPSHOTS.put(id + '/' + mid + '.jpg', bytes, {
      httpMetadata: { contentType: 'image/jpeg' },
    });
    await db
      .prepare(
        "INSERT INTO messages (id,circle_id,name,text,type,product_id,created_at) VALUES (?,?,?,?,'snapshot',?,?)",
      )
      .bind(
        mid,
        id,
        m.name,
        'Shared a snapshot with the circle.',
        pid,
        Date.now(),
      )
      .run();
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const owner = await identity();
    await findCircle(id);
    const m = await findMember(id, owner);
    if (!m || m.removed)
      throw new ApiError('This snapshot belongs to a private circle.', 403);
    const mid = new URL(req.url).searchParams.get('message');
    if (!mid || !/^[a-f0-9-]{36}$/.test(mid))
      throw new ApiError('Snapshot not found.', 404);
    const row = await database()
      .prepare(
        "SELECT id FROM messages WHERE id=? AND circle_id=? AND type='snapshot'",
      )
      .bind(mid, id)
      .first();
    if (!row) throw new ApiError('Snapshot not found.', 404);
    const object = await env.SNAPSHOTS.get(id + '/' + mid + '.jpg');
    if (!object) throw new ApiError('Snapshot no longer available.', 404);
    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    return failure(e);
  }
}
