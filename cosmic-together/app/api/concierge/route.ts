import { orchestrate } from '@/lib/agents';
import {
  identity,
  json,
  failure,
  protect,
  parseBody,
  event,
} from '@/lib/server';
export async function POST(req: Request) {
  try {
    const id = await identity();
    await protect(req, id);
    const body = await parseBody(req);
    const result = orchestrate(body);
    await event(id, 'recommendations_generated');
    return json(result);
  } catch (e) {
    return failure(e);
  }
}
