import { products, type Product } from '../catalog';
import type { CategoryGroup, ColorFamily, Occasion, Season } from './keywords';

export type Enriched = Product & {
  categoryGroup: CategoryGroup;
  cosmoCategory: string;
  colorFamilies: ColorFamily[];
  occasions: Occasion[];
  seasons: Season[];
  rating: number;
  reviewCount: number;
  popularity: number;
  shipsInDays: number;
  emoji: string;
};

const meta: Record<
  string,
  {
    group: CategoryGroup;
    cat: string;
    colors: ColorFamily[];
    occasions: Occasion[];
    seasons: Season[];
    rating: number;
    reviewCount: number;
    popularity: number;
    shipsInDays: number;
    emoji: string;
  }
> = {
  'f-black-suit': {
    group: 'Fashion', cat: 'suit', colors: ['black'],
    occasions: ['wedding', 'formal', 'party'], seasons: ['fall', 'winter', 'spring'],
    rating: 4.7, reviewCount: 214, popularity: 88, shipsInDays: 3, emoji: '🖤',
  },
  'f-gray-suit': {
    group: 'Fashion', cat: 'suit', colors: ['grey', 'neutral'],
    occasions: ['work', 'wedding', 'formal'], seasons: ['spring', 'fall', 'winter'],
    rating: 4.5, reviewCount: 168, popularity: 74, shipsInDays: 3, emoji: '🩶',
  },
  'f-white-dress': {
    group: 'Fashion', cat: 'dress', colors: ['neutral'],
    occasions: ['wedding', 'party', 'formal'], seasons: ['spring', 'summer'],
    rating: 4.6, reviewCount: 132, popularity: 82, shipsInDays: 4, emoji: '👗',
  },
  'f-blue-dress': {
    group: 'Fashion', cat: 'dress', colors: ['blue'],
    occasions: ['wedding', 'party', 'formal'], seasons: ['spring', 'summer', 'fall'],
    rating: 4.8, reviewCount: 201, popularity: 91, shipsInDays: 4, emoji: '💙',
  },
  'h-creme-chair': {
    group: 'Home', cat: 'chair', colors: ['neutral'],
    occasions: ['everyday', 'gift'], seasons: ['spring', 'summer', 'fall', 'winter'],
    rating: 4.6, reviewCount: 87, popularity: 78, shipsInDays: 6, emoji: '🪑',
  },
  'h-black-chair': {
    group: 'Home', cat: 'chair', colors: ['black'],
    occasions: ['everyday'], seasons: ['spring', 'summer', 'fall', 'winter'],
    rating: 4.5, reviewCount: 63, popularity: 71, shipsInDays: 6, emoji: '🪑',
  },
  'g-headset': {
    group: 'Lifestyle', cat: 'headphones', colors: ['black', 'grey'],
    occasions: ['gift', 'work', 'everyday'], seasons: ['spring', 'summer', 'fall', 'winter'],
    rating: 4.7, reviewCount: 342, popularity: 90, shipsInDays: 2, emoji: '🎧',
  },
  'g-watch': {
    group: 'Lifestyle', cat: 'watch', colors: ['grey', 'brown'],
    occasions: ['gift', 'work', 'everyday', 'formal'], seasons: ['spring', 'summer', 'fall', 'winter'],
    rating: 4.8, reviewCount: 276, popularity: 85, shipsInDays: 2, emoji: '⌚',
  },
};

export const enriched: Enriched[] = products.map((p) => {
  const m = meta[p.id];
  if (!m) throw new Error(`Missing Cosmo metadata for ${p.id}`);
  return {
    ...p,
    categoryGroup: m.group,
    cosmoCategory: m.cat,
    colorFamilies: m.colors,
    occasions: m.occasions,
    seasons: m.seasons,
    rating: m.rating,
    reviewCount: m.reviewCount,
    popularity: m.popularity,
    shipsInDays: m.shipsInDays,
    emoji: m.emoji,
  };
});

export const enrichedById = (id: string) => enriched.find((p) => p.id === id);
