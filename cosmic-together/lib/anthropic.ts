import { env } from 'cloudflare:workers';

export type Msg = { role: 'user' | 'assistant'; content: string };

type Response = { content: { type: string; text?: string }[] };

export async function callAnthropic(opts: {
  system: string;
  messages: Msg[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<{ text: string }> {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not configured.');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: opts.maxTokens ?? 800,
      temperature: opts.temperature ?? 0.4,
      system: opts.system,
      messages: opts.messages,
    }),
    signal: opts.signal ?? AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}`);
  const body = (await r.json()) as Response;
  const text = body.content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n')
    .trim();
  if (!text) throw new Error('Empty response from Anthropic.');
  return { text };
}
