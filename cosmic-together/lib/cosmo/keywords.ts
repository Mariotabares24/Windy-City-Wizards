export type CategoryGroup = 'Fashion' | 'Home' | 'Lifestyle';
export type ColorFamily =
  | 'neutral'
  | 'black'
  | 'grey'
  | 'blue'
  | 'teal'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'red'
  | 'purple'
  | 'brown'
  | 'multicolor';
export type Occasion = 'wedding' | 'party' | 'work' | 'gift' | 'formal' | 'everyday';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export const CATEGORY_KEYWORDS: Record<string, { group: CategoryGroup; words: string[] }> = {
  suit: { group: 'Fashion', words: ['suit', 'blazer', 'jacket', 'tuxedo'] },
  dress: { group: 'Fashion', words: ['dress', 'gown', 'frock'] },
  chair: { group: 'Home', words: ['chair', 'seat', 'armchair', 'accent chair', 'reading chair'] },
  headphones: { group: 'Lifestyle', words: ['headphones', 'headset', 'earphones', 'audio'] },
  watch: { group: 'Lifestyle', words: ['watch', 'timepiece', 'wristwatch'] },
};

export const GROUP_KEYWORDS: Record<CategoryGroup, string[]> = {
  Fashion: ['fashion', 'clothes', 'clothing', 'outfit', 'apparel', 'wear'],
  Home: ['home', 'furniture', 'living room', 'decor', 'interior'],
  Lifestyle: ['lifestyle', 'gadget', 'gadgets', 'accessory', 'accessories'],
};

export const COLOR_FAMILIES: Record<ColorFamily, string[]> = {
  neutral: ['neutral', 'beige', 'cream', 'creme', 'ivory', 'off white', 'off-white', 'taupe', 'sand', 'nude'],
  black: ['black', 'onyx', 'charcoal', 'jet'],
  grey: ['grey', 'gray', 'slate', 'silver', 'graphite'],
  blue: ['blue', 'sapphire', 'navy', 'cobalt', 'denim', 'indigo'],
  teal: ['teal', 'turquoise', 'aqua', 'cyan'],
  green: ['green', 'olive', 'emerald', 'sage', 'mint'],
  yellow: ['yellow', 'mustard', 'gold', 'brass', 'amber'],
  orange: ['orange', 'rust', 'terracotta', 'coral'],
  pink: ['pink', 'rose', 'blush', 'salmon'],
  red: ['red', 'crimson', 'burgundy', 'wine'],
  purple: ['purple', 'violet', 'lavender', 'lilac', 'plum'],
  brown: ['brown', 'chocolate', 'coffee', 'walnut', 'tan', 'khaki'],
  multicolor: ['multicolor', 'multi color', 'pattern', 'print', 'floral'],
};

export const OCCASION_KEYWORDS: Record<Occasion, string[]> = {
  wedding: ['wedding', 'marriage', 'bride', 'groom'],
  party: ['party', 'celebration', 'birthday', 'nightlife', 'club'],
  work: ['work', 'office', 'business', 'meeting', 'interview'],
  gift: ['gift', 'present', 'giftable'],
  formal: ['formal', 'black tie', 'gala', 'evening'],
  everyday: ['everyday', 'daily', 'casual', 'weekend'],
};

export const OUT_OF_CATALOG_TERMS = [
  'headphones','laptop','phone','smartphone','iphone','android','tv','television',
  'gaming console','playstation','xbox','camera','monitor','keyboard','mouse',
  'tablet','ipad','smartwatch','apple watch','speaker','drone','car','vehicle',
  'groceries','grocery','food','snack','medicine','drug','pharmacy',
];

export const HARMFUL_TERMS = [
  'hate','don\'t like you','dont like you','shut up','stupid','idiot','useless',
  'kill yourself','screw you','fuck you','you suck','worthless',
];

export function resolveColorFamilies(text: string): ColorFamily[] {
  const low = text.toLowerCase();
  const hits: ColorFamily[] = [];
  for (const [fam, words] of Object.entries(COLOR_FAMILIES) as [ColorFamily, string[]][]) {
    if (words.some((w) => low.includes(w))) hits.push(fam);
  }
  return hits;
}

export function resolveCategory(
  text: string,
): { category: keyof typeof CATEGORY_KEYWORDS | null; group: CategoryGroup | null } {
  const low = text.toLowerCase();
  for (const [cat, def] of Object.entries(CATEGORY_KEYWORDS)) {
    if (def.words.some((w) => low.includes(w)))
      return { category: cat as keyof typeof CATEGORY_KEYWORDS, group: def.group };
  }
  for (const [group, words] of Object.entries(GROUP_KEYWORDS) as [CategoryGroup, string[]][]) {
    if (words.some((w) => low.includes(w))) return { category: null, group };
  }
  return { category: null, group: null };
}

export function resolveOccasion(text: string): Occasion | null {
  const low = text.toLowerCase();
  for (const [occ, words] of Object.entries(OCCASION_KEYWORDS) as [Occasion, string[]][]) {
    if (words.some((w) => low.includes(w))) return occ;
  }
  return null;
}

export function currentSeason(now = new Date()): Season {
  const m = now.getMonth();
  if (m <= 1 || m === 11) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'fall';
}

export function resolveSeason(text: string): Season | null {
  const low = text.toLowerCase();
  if (/\bspring\b/.test(low)) return 'spring';
  if (/\bsummer\b/.test(low)) return 'summer';
  if (/\bfall\b|\bautumn\b/.test(low)) return 'fall';
  if (/\bwinter\b/.test(low)) return 'winter';
  return null;
}

export function isHarmful(text: string) {
  const low = text.toLowerCase();
  return HARMFUL_TERMS.some((t) => low.includes(t));
}

export function isOutOfCatalog(text: string) {
  const low = text.toLowerCase();
  const cat = resolveCategory(text);
  if (cat.category || cat.group) return false;
  return OUT_OF_CATALOG_TERMS.some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(low));
}

export function isInviteIntent(text: string) {
  const low = text.toLowerCase();
  return /\binvite\b/.test(low) && /(friend|advice|call|room)/.test(low);
}

export function isAffirmative(text: string) {
  const low = text.trim().toLowerCase();
  return low === 'yes' || low.startsWith('yes') || low.includes('add it') || low.includes('add to cart');
}
