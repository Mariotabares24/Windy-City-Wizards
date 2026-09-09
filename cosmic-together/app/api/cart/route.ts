import { z } from 'zod';
import { database } from '@/db';
import { productById, selectionAvailable } from '@/lib/catalog';
import {
  identity,
  json,
  failure,
  protect,
  parseBody,
  ApiError,
  event,
} from '@/lib/server';
const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    productId: z.string().max(10),
    color: z.string().max(24),
    size: z.string().max(12),
    rationale: z.string().max(500).default('Selected by you.'),
  }),
  z.object({
    action: z.literal('quantity'),
    id: z.string().max(80),
    quantity: z.number().int().min(0).max(10),
  }),
  z.object({ action: z.literal('confirm'), version: z.number().int().min(0) }),
]);
export async function GET() {
  try {
    const owner = await identity();
    const db = database();
    const rows = await db.batch([
      db
        .prepare(
          'SELECT id,product_id AS productId,quantity,color,size,rationale,confirmed FROM cart WHERE owner=? ORDER BY id',
        )
        .bind(owner),
      db.prepare('SELECT version FROM cart_versions WHERE owner=?').bind(owner),
    ]);
    return json({
      items: rows[0].results,
      version: (rows[1].results[0] as { version?: number })?.version || 0,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const owner = await identity();
    await protect(req, owner);
    const b = schema.parse(await parseBody(req));
    const db = database();
    const versionUpdate = db
      .prepare(
        'INSERT INTO cart_versions (owner,version) VALUES (?,1) ON CONFLICT(owner) DO UPDATE SET version=version+1',
      )
      .bind(owner);
    const reset = db
      .prepare('UPDATE cart SET confirmed=0 WHERE owner=?')
      .bind(owner);
    if (b.action === 'add') {
      const p = productById(b.productId);
      if (!p)
        throw new ApiError('This product is no longer in the catalog.', 404);
      if (p.stock < 1) throw new ApiError('This item is unavailable.');
      if (!p.colors.includes(b.color))
        throw new ApiError('Choose an available color.');
      if (
        p.category === 'fashion' &&
        !['XS', 'S', 'M', 'L', 'XL'].includes(b.size)
      )
        throw new ApiError('Choose an available size.');
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode([owner, p.id, b.color, b.size].join(':')),
      );
      const itemId = Array.from(new Uint8Array(hash), (x) =>
        x.toString(16).padStart(2, '0'),
      ).join('');
      const rows = await db.batch([
        db
          .prepare(
            'INSERT INTO cart (id,owner,product_id,quantity,color,size,rationale,confirmed) SELECT ?,?,?,1,?,?,?,0 WHERE (SELECT COALESCE(SUM(quantity),0) FROM cart WHERE owner=? AND product_id=?) < ? ON CONFLICT(id) DO UPDATE SET quantity=quantity+1,confirmed=0',
          )
          .bind(
            itemId,
            owner,
            p.id,
            b.color,
            b.size,
            b.rationale,
            owner,
            p.id,
            Math.min(p.stock, 10),
          ),
        versionUpdate,
        reset,
      ]);
      if (!rows[0].meta.changes)
        throw new ApiError(
          'Your bag already contains the available quantity across all variants.',
        );
      await event(owner, 'cart_added');
    } else if (b.action === 'quantity') {
      const row = await db
        .prepare(
          'SELECT product_id AS productId FROM cart WHERE id=? AND owner=?',
        )
        .bind(b.id, owner)
        .first<{ productId: string }>();
      if (!row) throw new ApiError('Cart item not found.', 404);
      const stock = productById(row.productId)?.stock || 0;
      const operation =
        b.quantity === 0
          ? db
              .prepare('DELETE FROM cart WHERE id=? AND owner=?')
              .bind(b.id, owner)
          : db
              .prepare(
                'UPDATE cart SET quantity=?,confirmed=0 WHERE id=? AND owner=? AND ? + (SELECT COALESCE(SUM(quantity),0) FROM cart WHERE owner=? AND product_id=? AND id!=?) <= ?',
              )
              .bind(
                b.quantity,
                b.id,
                owner,
                b.quantity,
                owner,
                row.productId,
                b.id,
                Math.min(stock, 10),
              );
      const rows = await db.batch([operation, versionUpdate, reset]);
      if (!rows[0].meta.changes)
        throw new ApiError(
          'That quantity is unavailable across the variants in your bag.',
        );
    } else {
      const { results: selection } = await db
        .prepare(
          'SELECT product_id AS productId,SUM(quantity) AS quantity FROM cart WHERE owner=? GROUP BY product_id',
        )
        .bind(owner)
        .all<{ productId: string; quantity: number }>();
      if (!selection.length)
        throw new ApiError('Add an available item before confirming.');
      if (!selectionAvailable(selection))
        throw new ApiError(
          'Your bag contains an unavailable item. Remove it and review your selection again.',
          409,
        );
      const rows = await db.batch([
        db
          .prepare(
            'UPDATE cart SET confirmed=1 WHERE owner=? AND (SELECT version FROM cart_versions WHERE owner=?)=?',
          )
          .bind(owner, owner, b.version),
        db
          .prepare(
            'UPDATE cart_versions SET version=version+1 WHERE owner=? AND version=?',
          )
          .bind(owner, b.version),
      ]);
      if (!rows[0].meta.changes)
        throw new ApiError(
          'Your bag changed in another tab. Refresh it and review the updated selection.',
          409,
        );
      await event(owner, 'selection_confirmed');
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
