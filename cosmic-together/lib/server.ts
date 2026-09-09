import { cookies } from 'next/headers';
import { database } from '@/db';
import { z } from 'zod';
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function identity() {
  const c = await cookies();
  let token = c.get('cosmic_session')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    c.set('cosmic_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return token;
}
export async function parseBody(request: Request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > 8192) throw new ApiError('This request is too large.', 413);
  const text = await request.text();
  if (text.length > 8192) throw new ApiError('This request is too large.', 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('Please send valid JSON.');
  }
}
async function limit(key: string, max: number) {
  const row = await (await database())
    .prepare(
      'INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',
    )
    .bind(key, Date.now() + 120000)
    .first<{ count: number }>();
  if ((row?.count || 0) > max)
    throw new ApiError('Please pause a moment and try again.', 429);
}
export async function protect(request: Request, owner: string, read = false) {
  const origin = request.headers.get('origin');
  if (!read && origin && origin !== new URL(request.url).origin)
    throw new ApiError('This request came from another site.', 403);
  const window = Math.floor(Date.now() / 60000);
  await limit(`${read ? 'read' : 'write'}:${owner}:${window}`, read ? 120 : 90);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ip + ':' + window),
    );
    const key = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    await limit('network:' + key, read ? 1200 : 600);
  }
  if (Math.random() < 0.02)
    await (await database())
      .prepare('DELETE FROM rate_limits WHERE expires_at < ?')
      .bind(Date.now())
      .run();
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof ApiError)
    return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json({ error: 'Please check the values you entered.' }, 400);
  console.error(
    'Cosmic request failed',
    error instanceof Error ? error.message : 'Unknown error',
  );
  return json({ error: 'Something did not save. Please try again.' }, 503);
}
export const uid = () => crypto.randomUUID();
export async function event(owner: string, name: string) {
  try {
    await (await database())
      .prepare('INSERT INTO events (id,owner,name,created_at) VALUES (?,?,?,?)')
      .bind(uid(), owner, name, Date.now())
      .run();
  } catch {
    console.warn('Optional analytics unavailable.');
  }
}
