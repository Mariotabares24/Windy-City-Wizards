export async function api<T>(
  url: string,
  body?: unknown,
  method = body ? 'POST' : 'GET',
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    ...(body && method !== 'GET' && method !== 'HEAD' ? {body: JSON.stringify(body)} : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Please try again.');
  return data as T;
}
export const circlePath = (id: string) =>
  '/api/circles/' + encodeURIComponent(id);
