import { orchestrate, inferIntent } from '@/lib/agents';
import { products, productById, type Product } from '@/lib/catalog';
import { callAnthropic } from '@/lib/anthropic';
import {
  buildCosmoPrompt,
  isHarmful,
  isOutOfCatalog,
  COSMO_HARMFUL_REPLY,
  COSMO_REFUSAL_OFF_TOPIC,
} from '@/lib/cosmo/prompt';
import { requestSchema, resultSchema } from '@/lib/contracts';
import {
  identity,
  json,
  failure,
  protect,
  parseBody,
  event,
} from '@/lib/server';

function tradeoff(p: Product) {
  if (p.category === 'fashion') return 'Check the care label before you commit.';
  if (p.category === 'home')
    return 'Room placement is an approximate visual preview.';
  return 'Battery figures are sample catalog specifications.';
}

function extractJson(text: string): { summary: string; picks: string[] } | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (
      typeof parsed?.summary === 'string' &&
      Array.isArray(parsed?.picks) &&
      parsed.picks.every((p: unknown) => typeof p === 'string')
    ) {
      return { summary: parsed.summary, picks: parsed.picks as string[] };
    }
  } catch {
    /* fall through */
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const id = await identity();
    await protect(req, id);
    const raw = await parseBody(req);
    const body = requestSchema.parse(raw);
    const inferred = inferIntent(body.intent, body.category);
    const budget = body.budget ?? inferred.budget ?? 250;
    const category = body.category;
    const formality = body.formality ?? inferred.formality ?? 'semi-formal';

    if (isHarmful(body.intent)) {
      await event(id, 'recommendations_blocked');
      return json(
        resultSchema.parse({
          summary: COSMO_HARMFUL_REPLY,
          recommendations: [],
          steps: [],
          mode: 'catalog',
          constraints: { budget, category, formality },
          blocked: true,
        }),
      );
    }

    if (isOutOfCatalog(body.intent)) {
      await event(id, 'recommendations_off_catalog');
      return json(
        resultSchema.parse({
          summary: COSMO_REFUSAL_OFF_TOPIC,
          recommendations: [],
          steps: [],
          mode: 'catalog',
          constraints: { budget, category, formality },
        }),
      );
    }

    try {
      const { text } = await callAnthropic({
        system: buildCosmoPrompt(products),
        messages: [{ role: 'user', content: body.intent }],
        signal: AbortSignal.timeout(8000),
      });
      const parsed = extractJson(text);
      if (!parsed) throw new Error('Cosmo response was not JSON.');
      const picks = parsed.picks
        .map((pid) => productById(pid))
        .filter((p): p is Product => !!p && p.stock > 0)
        .filter((p) => !body.budget || p.price <= body.budget)
        .filter((p) => p.category === category)
        .slice(0, 3);
      const recommendations = picks.map((p, i) => ({
        productId: p.id,
        score: 90 - i * 5,
        reasons: [
          `Matches your ${category} search`,
          p.price <= budget ? `Within your $${budget} budget` : `Priced at $${p.price}`,
        ],
        tradeoffs: [tradeoff(p)],
      }));
      await event(id, 'recommendations_generated');
      return json(
        resultSchema.parse({
          summary: parsed.summary,
          recommendations,
          steps: [
            {
              agent: 'Cosmo',
              label: 'Claude Haiku 4.5',
              evidence: `${category}; budget $${budget}`,
            },
          ],
          mode: 'live',
          constraints: { budget, category, formality },
        }),
      );
    } catch (e) {
      console.warn(
        'Cosmo LLM path failed, falling back to catalog orchestrator:',
        e instanceof Error ? e.message : e,
      );
      const result = await orchestrate(body);
      await event(id, 'recommendations_generated');
      return json(result);
    }
  } catch (e) {
    return failure(e);
  }
}
