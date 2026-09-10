import type { CosmoIntent, StylistResult, TrendResult } from './types';

// Deterministic stylist. The cosmos-agent branch had this agent call the
// Anthropic API; that path is deliberately not wired up yet, so this is the
// branch's fallback logic, made responsive to the resolved intent. Swapping in
// a real model later means replacing this function body only — the orchestrator
// and the response shape do not change.
const PALETTES: Record<string, string[]> = {
  'black tie': ['midnight', 'silver', 'ivory'],
  formal: ['charcoal', 'ivory', 'oxblood'],
  'semi-formal': ['camel', 'ivory', 'sage'],
  casual: ['stone', 'washed indigo', 'ecru'],
  everyday: ['oatmeal', 'sage', 'terracotta'],
};

export function stylistAgent(
  intent: CosmoIntent,
  trends: TrendResult,
): StylistResult {
  const palette = PALETTES[intent.formality] || PALETTES.everyday;
  const lead = trends.trending[0] || 'quiet luxury';

  const advice =
    intent.category === 'fashion'
      ? `For ${trends.occasion} in ${intent.location}, ${lead} is the easiest way to look considered. Put your budget into one piece that holds the outfit together and keep the rest quiet.`
      : `For ${intent.category} in ${intent.location}, ${lead} reads warmer than it sounds — pick one piece with texture and let the rest of the room stay calm.`;

  const outfitTips =
    intent.category === 'fashion'
      ? [
          'Choose a hero piece and let everything else support it',
          'Hold the look to three colours so it reads intentional',
          `${intent.formality === 'casual' ? 'A better shoe' : 'One good accessory'} lifts the whole outfit`,
        ]
      : [
          'Anchor the room with one larger piece, then layer smaller ones',
          'Repeat a material at least twice so the space feels deliberate',
          'Leave breathing room — negative space is part of the styling',
        ];

  return { agentId: 'stylist', advice, outfitTips, palette };
}
