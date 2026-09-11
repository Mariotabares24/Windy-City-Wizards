export type Category = 'fashion' | 'home' | 'gadgets';
export type Model = 'garment' | 'chair' | 'headphones' | 'watch';
export type Product = {
  id: string;
  retired?: boolean;
  kind: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  glb: string;
  color: string;
  colors: string[];
  material: string;
  description: string;
  tags: string[];
  specs: Record<string, string>;
  stock: number;
  ar: boolean;
  model: Model;
  formality: string;
};

type Row = {
  id: string;
  name: string;
  category: Category;
  model: Model;
  kind: string;
  price: number;
  color: string;
  material: string;
  description: string;
  tags: string[];
  formality: string;
  stock: number;
  glb: string;
  image: string;
  specs: Record<string, string>;
};

const rows: Row[] = [
  {
    id: 'f-black-suit',
    name: 'The Nightfall Suit',
    category: 'fashion',
    model: 'garment',
    kind: 'suit',
    price: 289,
    color: 'Black',
    material: 'Italian wool blend',
    description:
      'A sharp two-piece cut for evening events, with a soft shoulder that keeps it modern.',
    tags: ['suit', 'black', 'formal', 'evening', 'wedding'],
    formality: 'formal',
    stock: 12,
    glb: '/models/new/black-suit.glb',
    image: '/images/new/black-suit.png',
    specs: {
      Material: 'Italian wool blend',
      Fit: 'Regular / relaxed',
      Sizes: 'XS, S, M, L, XL',
      Care: 'Dry clean only',
    },
  },
  {
    id: 'f-gray-suit',
    name: 'The Daylight Suit',
    category: 'fashion',
    model: 'garment',
    kind: 'suit',
    price: 269,
    color: 'Slate',
    material: 'Wool blend',
    description:
      'A versatile mid-gray suit that carries through a workday and into the evening.',
    tags: ['suit', 'gray', 'work', 'wedding', 'versatile'],
    formality: 'semi-formal',
    stock: 15,
    glb: '/models/new/gray-suit.glb',
    image: '/images/new/gray-suit.png',
    specs: {
      Material: 'Wool blend',
      Fit: 'Regular / relaxed',
      Sizes: 'XS, S, M, L, XL',
      Care: 'Dry clean only',
    },
  },
  {
    id: 'f-white-dress',
    name: 'The Ivory Dress',
    category: 'fashion',
    model: 'garment',
    kind: 'dress',
    price: 219,
    color: 'Ivory',
    material: 'Silk crepe',
    description:
      'A clean, floor-adjacent silhouette that reads dressy without effort.',
    tags: ['dress', 'ivory', 'wedding', 'evening', 'silk'],
    formality: 'formal',
    stock: 9,
    glb: '/models/new/blue-dress.glb',
    image: '/images/new/white-dress.png',
    specs: {
      Material: 'Silk crepe',
      Fit: 'Regular',
      Sizes: 'XS, S, M, L, XL',
      Care: 'Dry clean only',
    },
  },
  {
    id: 'f-blue-dress',
    name: 'The Sapphire Dress',
    category: 'fashion',
    model: 'garment',
    kind: 'dress',
    price: 249,
    color: 'Sapphire',
    material: 'Silk satin',
    description:
      'A saturated blue dress with a defined waist and easy drape, made for celebrations.',
    tags: ['dress', 'blue', 'wedding', 'celebration', 'evening'],
    formality: 'formal',
    stock: 7,
    glb: '/models/new/white-dress.glb',
    image: '/images/new/blue-dress.png',
    specs: {
      Material: 'Silk satin',
      Fit: 'Regular',
      Sizes: 'XS, S, M, L, XL',
      Care: 'Dry clean only',
    },
  },
  {
    id: 'h-creme-chair',
    name: 'The Creme Reading Chair',
    category: 'home',
    model: 'chair',
    kind: 'chair',
    price: 449,
    color: 'Creme',
    material: 'Bouclé & oak',
    description:
      'A soft bouclé shell on oak legs. The corner chair you actually sit in.',
    tags: ['chair', 'creme', 'living room', 'reading corner'],
    formality: 'everyday',
    stock: 6,
    glb: '/models/new/creme-chair.glb',
    image: '/images/new/creme-chair.png',
    specs: {
      Material: 'Bouclé & oak',
      Dimensions: '72 × 74 × 80 cm',
      Weight: '12 kg',
      Care: 'Spot clean',
    },
  },
  {
    id: 'h-black-chair',
    name: 'The Onyx Accent Chair',
    category: 'home',
    model: 'chair',
    kind: 'chair',
    price: 489,
    color: 'Black',
    material: 'Woven fabric & steel',
    description:
      'A quieter silhouette in deep black, with an architectural steel frame.',
    tags: ['chair', 'black', 'living room', 'modern'],
    formality: 'everyday',
    stock: 5,
    glb: '/models/new/black-chair.glb',
    image: '/images/new/black-chair.png',
    specs: {
      Material: 'Woven fabric & steel',
      Dimensions: '70 × 72 × 78 cm',
      Weight: '11 kg',
      Care: 'Spot clean',
    },
  },
  {
    id: 'g-headset',
    name: 'The Orbit Headset',
    category: 'gadgets',
    model: 'headphones',
    kind: 'headphones',
    price: 249,
    color: 'Charcoal',
    material: 'Aluminum & memory foam',
    description:
      'Long-listening comfort, tactile controls, and active noise cancellation.',
    tags: ['headphones', 'audio', 'noise cancelling', 'travel'],
    formality: 'everyday',
    stock: 20,
    glb: '/models/new/headset.glb',
    image: '/images/new/headset.png',
    specs: {
      Battery: '30 hours',
      Weight: '245 g',
      Compatibility: 'Bluetooth 5.3',
      Charging: 'USB-C',
    },
  },
  {
    id: 'g-watch',
    name: 'The Meridian Watch',
    category: 'gadgets',
    model: 'watch',
    kind: 'watch',
    price: 349,
    color: 'Steel',
    material: 'Stainless steel & leather',
    description:
      'A quiet automatic with a stainless case and a leather strap, made to wear every day.',
    tags: ['watch', 'automatic', 'everyday', 'timepiece'],
    formality: 'everyday',
    stock: 14,
    glb: '/models/new/watch.glb',
    image: '/images/new/watch.png',
    specs: {
      Case: 'Stainless steel, 40 mm',
      Movement: 'Automatic',
      'Water resistance': '5 ATM',
      Strap: 'Leather, quick-release',
    },
  },
];

export const products: Product[] = rows.map((r) => ({
  ...r,
  colors: [r.color],
  ar: true,
}));

export const productById = (id: string) => products.find((p) => p.id === id);

export const availableProduct = (id: string) =>
  products.find((p) => p.id === id && p.stock > 0);

export const selectionAvailable = (
  selection: { productId: string; quantity: number }[],
) => {
  const quantities = new Map<string, number>();
  for (const item of selection)
    quantities.set(
      item.productId,
      (quantities.get(item.productId) || 0) + item.quantity,
    );
  return (
    selection.length > 0 &&
    [...quantities].every(([id, quantity]) => {
      const p = availableProduct(id);
      return !!p && quantity > 0 && quantity <= p.stock;
    })
  );
};

export const categoryLabel: Record<Category, string> = {
  fashion: 'Fashion',
  home: 'Home & living',
  gadgets: 'Gadgets',
};

export const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
