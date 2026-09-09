import { env } from 'cloudflare:workers';
export function database(): D1Database {
  if (!env.DB)
    throw new Error('Storage is temporarily unavailable. Please try again.');
  return env.DB;
}
