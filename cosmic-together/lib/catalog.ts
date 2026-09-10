export type Category = 'fashion' | 'home' | 'gadgets';
export type Product = {
  id: string;
  retired?: boolean;
  kind: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  color: string;
  colors: string[];
  material: string;
  description: string;
  tags: string[];
  specs: Record<string, string>;
  stock: number;
  ar: boolean;
  model: 'garment' | 'lamp' | 'chair' | 'headphones' | 'speaker';
  formality: string;
};
type Row = [string, number, string, string, string, string?];
const fashion: Row[] = [
  [
    'The October Blazer',
    149,
    'Midnight',
    'Wool blend',
    'Tailored, without trying too hard. A versatile layer for fall celebrations.',
    'formal',
  ],
  [
    'After Hours Blazer',
    179,
    'Charcoal',
    'Wool blend',
    'A deeper tone and a structured shoulder for dressed-up evenings.',
    'formal',
  ],
  [
    'Modern Heritage Blazer',
    129,
    'Camel',
    'Cotton twill',
    'Warm texture, easy movement, and a relaxed take on occasion dressing.',
    'semi-formal',
  ],
  [
    'Everyday Oxford Shirt',
    59,
    'Ivory',
    'Organic cotton',
    'A breathable foundation that goes from a wedding to the weekend.',
    'semi-formal',
  ],
  [
    'The Dinner Shirt',
    79,
    'Black',
    'Cotton sateen',
    'A smooth finish for evenings that call for a sharper look.',
    'formal',
  ],
  [
    'Weekend Oxford',
    49,
    'Sky',
    'Organic cotton',
    'An easy, breathable layer for a more casual invitation.',
    'casual',
  ],
  [
    'City Layer Blazer',
    159,
    'Forest',
    'Wool blend',
    'A subtle color shift for someone ready to try a little more.',
    'semi-formal',
  ],
  [
    'Evening Tux Blazer',
    249,
    'Black',
    'Wool satin',
    'Satin lapels and a structured silhouette for black-tie occasions.',
    'black tie',
  ],
  [
    'Classic Tux Blazer',
    229,
    'Midnight',
    'Wool satin',
    'A timeless tuxedo layer with a deep midnight finish.',
    'black tie',
  ],
  [
    'Velvet Dinner Blazer',
    239,
    'Burgundy',
    'Cotton velvet',
    'Soft velvet adds texture to a formal evening.',
    'black tie',
  ],
  [
    'Autumn Wool Coat',
    189,
    'Camel',
    'Recycled wool blend',
    'An insulating outer layer for cool evenings.',
    'casual',
  ],
  [
    'The City Coat',
    199,
    'Charcoal',
    'Wool blend',
    'A clean silhouette for crisp mornings and late nights.',
    'casual',
  ],
  [
    'Soft Structure Blazer',
    119,
    'Sand',
    'Linen blend',
    'A light, unstructured layer with a less formal feel.',
    'semi-formal',
  ],
  [
    'Sunday Oxford',
    69,
    'Sage',
    'Cotton',
    'An understated green, made for easy everyday styling.',
    'casual',
  ],
];
const home: Row[] = [
  [
    'Arc Floor Lamp',
    129,
    'Ivory',
    'Steel & linen',
    'Warm light for the corner you keep coming back to.',
  ],
  [
    'Halo Floor Lamp',
    159,
    'Charcoal',
    'Steel & linen',
    'Focused ambient light with a clean, quiet profile.',
  ],
  [
    'Linen Glow Lamp',
    99,
    'Sand',
    'Oak & linen',
    'A softer glow and a natural finish for slower evenings.',
  ],
  [
    'The Reading Chair',
    229,
    'Ivory',
    'Bouclé & oak',
    'A generous seat that makes staying in a little more inviting.',
  ],
  [
    'Studio Accent Chair',
    199,
    'Charcoal',
    'Woven fabric & steel',
    'A compact seat with an architectural frame.',
  ],
  [
    'Sunday Accent Chair',
    249,
    'Sand',
    'Linen & oak',
    'An easy, warm-toned anchor for your reading corner.',
  ],
  [
    'Orbit Floor Lamp',
    179,
    'Brass',
    'Brass & linen',
    'A warm metallic accent with soft, diffused lighting.',
  ],
  [
    'Nook Floor Lamp',
    89,
    'Forest',
    'Steel',
    'Small-footprint lighting for a compact space.',
  ],
  [
    'Evening Glow Lamp',
    119,
    'Terracotta',
    'Steel & linen',
    'A little warmth, even before you turn it on.',
  ],
  [
    'Cloud Accent Chair',
    279,
    'Ivory',
    'Bouclé & oak',
    'A soft silhouette and a relaxed seat.',
  ],
  [
    'Form Accent Chair',
    219,
    'Forest',
    'Velvet & oak',
    'A rich green that brings a room together.',
  ],
  [
    'Quiet Corner Lamp',
    139,
    'Black',
    'Steel & linen',
    'A slim profile that fits neatly beside a chair.',
  ],
];
const gadgets: Row[] = [
  [
    'Orbit Studio Headphones',
    179,
    'Charcoal',
    'Aluminum & memory foam',
    'Your favorite soundtrack, with a little more space around it.',
  ],
  [
    'Orbit Everyday Headphones',
    99,
    'Ivory',
    'Polymer & memory foam',
    'Light, comfortable listening for the daily routine.',
  ],
  [
    'Orbit Pro Headphones',
    249,
    'Black',
    'Aluminum & memory foam',
    'Long listening sessions, tactile controls, and active noise cancellation.',
  ],
  [
    'Orbit Mini Speaker',
    69,
    'Charcoal',
    'Fabric & polymer',
    'Room-filling sound from a small, tactile speaker.',
  ],
  [
    'Orbit Home Speaker',
    129,
    'Ivory',
    'Fabric & aluminum',
    'A warm, balanced sound for wherever you unwind.',
  ],
  [
    'Orbit Move Speaker',
    89,
    'Forest',
    'Fabric & polymer',
    'A portable soundtrack for changing plans.',
  ],
  [
    'Orbit Focus Headphones',
    149,
    'Sand',
    'Polymer & memory foam',
    'An over-ear escape from everyday distractions.',
  ],
  [
    'Orbit Air Headphones',
    119,
    'Sky',
    'Polymer & memory foam',
    'A lightweight pair for long playlists.',
  ],
  [
    'Orbit Max Speaker',
    199,
    'Black',
    'Fabric & aluminum',
    'Fuller sound for a larger room.',
  ],
  [
    'Orbit Go Speaker',
    49,
    'Terracotta',
    'Fabric & polymer',
    'A compact companion for your next small adventure.',
  ],
];
function create(rows: Row[], category: Category, prefix: string): Product[] {
  return rows.map((r, i): Product => {
    const shirt = r[0].includes('Shirt') || r[0].includes('Oxford');
    const model =
      category === 'fashion'
        ? 'garment'
        : category === 'home'
          ? r[0].includes('Chair')
            ? 'chair'
            : 'lamp'
          : r[0].includes('Speaker')
            ? 'speaker'
            : 'headphones';
    return {
      id: prefix + String(i + 1).padStart(2, '0'),
      kind:
        category === 'fashion'
          ? shirt
            ? 'shirt'
            : r[0].includes('Coat')
              ? 'coat'
              : 'blazer'
          : model,
      name: r[0],
      price: r[1],
      color: r[2],
      colors: [
        r[2],
        r[2] === 'Ivory' ? 'Charcoal' : 'Ivory',
        r[2] === 'Forest' ? 'Sand' : 'Forest',
      ],
      material: r[3],
      description: r[4],
      formality: r[5] || 'everyday',
      category,
      image:
        category === 'fashion'
          ? shirt
            ? '/images/shirt.jpg'
            : r[0].includes('Coat')
              ? '/images/fashion.jpg'
              : r[2] === 'Camel' || r[2] === 'Sand'
                ? '/images/blazer-brown.jpg'
                : r[2] === 'Charcoal'
                  ? '/images/blazer-grey.jpg'
                  : '/images/blazer-black.jpg'
          : model === 'lamp'
            ? '/images/lamp.jpg'
            : model === 'chair'
              ? '/images/chair.jpg'
              : model === 'speaker'
                ? '/images/speaker.jpg'
                : '/images/gadgets.jpg',
      tags:
        category === 'fashion'
          ? [r[5] || 'everyday', 'Fall-ready']
          : category === 'home'
            ? ['Warm minimalism', 'Small-space friendly']
            : ['Everyday essential', 'Tactile controls'],
      specs:
        category === 'fashion'
          ? {
              Material: r[3],
              Formality: r[5] || 'Everyday',
              Fit: 'Regular / relaxed',
              Care: 'Follow garment care label',
              Sizes: 'XS, S, M, L, XL',
            }
          : category === 'home'
            ? {
                Material: r[3],
                Dimensions:
                  model === 'lamp' ? '38 × 38 × 158 cm' : '72 × 74 × 80 cm',
                Weight: model === 'lamp' ? '4.2 kg' : '12 kg',
                Lighting:
                  model === 'lamp' ? '2700 K, dimmable LED' : 'Not applicable',
              }
            : {
                Battery: model === 'speaker' ? '12 hours' : '30 hours',
                Weight: model === 'speaker' ? '580 g' : '245 g',
                Controls:
                  model === 'speaker'
                    ? 'Top touch panel'
                    : 'Right earcup buttons',
                Compatibility: 'Bluetooth 5.3',
                Charging: 'USB-C',
              },
      stock: i === rows.length - 1 ? 0 : 4 + (i % 7),
      ar: i < 3 || category !== 'fashion',
      model,
    };
  });
}
const legacyCatalog: Product[] = [
  ...create(fashion, 'fashion', 'f'),
  ...create(home, 'home', 'h'),
  ...create(gadgets, 'gadgets', 'g'),
];
const activeIds = new Set(['f01', 'f04', 'f11', 'h01', 'h04', 'g01', 'g04']);

// Cosmo catalog. Merged in from the cosmos-agent branch, remapped onto this
// Product shape: local imagery instead of remote URLs, and lifestyle folded
// into home since the storefront only browses fashion / home / gadgets.
// `ar` is false where no faithful 3D model exists, so the UI offers a flat
// preview rather than promising a try-on it cannot render.
type CosmoRow = {
  id: string;
  kind: string;
  name: string;
  category: Category;
  price: number;
  color: string;
  colors: string[];
  material: string;
  description: string;
  tags: string[];
  stock: number;
  formality: string;
  model: Product['model'];
  ar: boolean;
  image: string;
};
const cosmoRows: CosmoRow[] = [
  { id: 'c-f01', kind: 'wrap dress', name: 'Linen Wrap Dress', category: 'fashion', price: 145, color: 'Blue', colors: ['Blue', 'Sage', 'Blush', 'Ivory'], material: 'European linen', description: 'An easy wrap silhouette in breathable linen, cut for warm-weather celebrations.', tags: ['dress', 'blue', 'wedding', 'summer', 'wrap', 'brunch'], stock: 24, formality: 'semi-formal', model: 'garment', ar: true, image: '/images/fashion.jpg' },
  { id: 'c-f02', kind: 'midi dress', name: 'Sapphire Midi Dress', category: 'fashion', price: 218, color: 'Cobalt', colors: ['Cobalt', 'Navy', 'Midnight'], material: 'Italian crepe', description: 'A structured bodice and midi length for evenings that call for a sharper line.', tags: ['dress', 'blue', 'cobalt', 'navy', 'wedding', 'cocktail'], stock: 12, formality: 'formal', model: 'garment', ar: true, image: '/images/fashion.jpg' },
  { id: 'c-f03', kind: 'slip dress', name: 'Cobalt Silk Slip Dress', category: 'fashion', price: 89, color: 'Cobalt', colors: ['Cobalt', 'Blue', 'Dusty blue'], material: 'Silk satin', description: 'Bias-cut silk that moves easily, dressed up or down by what you layer over it.', tags: ['dress', 'blue', 'cobalt', 'date', 'brunch', 'silk'], stock: 18, formality: 'casual', model: 'garment', ar: true, image: '/images/fashion.jpg' },
  { id: 'c-f04', kind: 'blazer dress', name: 'Navy Blazer Dress', category: 'fashion', price: 195, color: 'Navy', colors: ['Navy', 'Blue', 'French blue'], material: 'Italian wool blend', description: 'A button-front blazer dress with a belt, tailored for the office and after.', tags: ['dress', 'blue', 'navy', 'office', 'structured', 'work'], stock: 9, formality: 'formal', model: 'garment', ar: true, image: '/images/blazer-black.jpg' },
  { id: 'c-f05', kind: 'maxi dress', name: 'Powder Blue Maxi Dress', category: 'fashion', price: 79, color: 'Powder blue', colors: ['Powder blue', 'Sky blue', 'Blue'], material: 'Cotton voile', description: 'A soft, full-length cotton dress made for slow, hot afternoons.', tags: ['dress', 'blue', 'casual', 'vacation', 'summer', 'maxi'], stock: 0, formality: 'casual', model: 'garment', ar: true, image: '/images/fashion.jpg' },
  { id: 'c-f06', kind: 'tailored blazer', name: 'Tailored Blazer', category: 'fashion', price: 210, color: 'Black', colors: ['Black', 'Camel', 'Navy'], material: 'Wool blend', description: 'A clean-shouldered blazer that anchors both suiting and denim.', tags: ['blazer', 'jacket', 'office', 'cocktail', 'structured', 'work'], stock: 15, formality: 'formal', model: 'garment', ar: true, image: '/images/blazer-grey.jpg' },
  { id: 'c-f07', kind: 'midi skirt', name: 'Silk Midi Skirt', category: 'fashion', price: 89, color: 'Burgundy', colors: ['Burgundy', 'Gold', 'Dusty rose'], material: 'Silk', description: 'A fluid midi skirt with enough weight to hold its shape as you move.', tags: ['skirt', 'date', 'brunch', 'elegant', 'midi', 'silk'], stock: 22, formality: 'semi-formal', model: 'garment', ar: true, image: '/images/fashion.jpg' },
  { id: 'c-f08', kind: 'knitwear', name: 'Cashmere Crew Neck', category: 'fashion', price: 175, color: 'Camel', colors: ['Camel', 'Ivory', 'Stone', 'Midnight'], material: 'Cashmere', description: 'A everyday crew neck in cashmere, warm without the bulk.', tags: ['knitwear', 'sweater', 'jumper', 'casual', 'office', 'autumn'], stock: 31, formality: 'casual', model: 'garment', ar: true, image: '/images/shirt.jpg' },
  { id: 'c-h01', kind: 'bedding', name: 'Linen Duvet Cover Set', category: 'home', price: 189, color: 'Oatmeal', colors: ['Oatmeal', 'White', 'Sage', 'Stone'], material: 'Washed linen', description: 'Stonewashed linen bedding that softens with every wash.', tags: ['bedding', 'duvet', 'bedroom', 'linen', 'sleep'], stock: 45, formality: 'everyday', model: 'lamp', ar: false, image: '/images/home.jpg' },
  { id: 'c-h02', kind: 'accent chair', name: 'Bouclé Accent Chair', category: 'home', price: 649, color: 'Ivory', colors: ['Ivory', 'Cream'], material: 'Bouclé & oak', description: 'A rounded bouclé shell on oak legs — a corner chair you actually sit in.', tags: ['furniture', 'chair', 'living room', 'statement'], stock: 8, formality: 'everyday', model: 'chair', ar: true, image: '/images/chair.jpg' },
  { id: 'c-h03', kind: 'vase set', name: 'Ceramic Vase Set', category: 'home', price: 79, color: 'Sage', colors: ['Sage', 'Terracotta', 'Off-white'], material: 'Glazed ceramic', description: 'Three hand-glazed vases in graduated heights, made to be grouped.', tags: ['decor', 'vase', 'living room', 'minimal', 'ceramic'], stock: 33, formality: 'everyday', model: 'lamp', ar: false, image: '/images/home.jpg' },
  { id: 'c-h04', kind: 'candle', name: 'Ylang & Sandalwood Candle', category: 'home', price: 68, color: 'Amber', colors: ['Amber', 'Ivory'], material: 'Soy wax blend', description: 'A warm, resinous burn with ylang on top — 60 hours in a reusable vessel.', tags: ['candle', 'fragrance', 'gift', 'relaxation', 'wellness'], stock: 60, formality: 'everyday', model: 'lamp', ar: false, image: '/images/home.jpg' },
  { id: 'c-h05', kind: 'yoga mat', name: 'Cork Yoga Mat', category: 'home', price: 98, color: 'Natural cork', colors: ['Natural cork', 'Charcoal'], material: 'Cork & natural rubber', description: 'A cork surface that grips better as you sweat, on a recycled rubber base.', tags: ['yoga', 'wellness', 'fitness', 'sustainable', 'gift'], stock: 27, formality: 'everyday', model: 'lamp', ar: false, image: '/images/home.jpg' },
];
const cosmoCatalog: Product[] = cosmoRows.map((r) => {
  const specs: Record<string, string> =
    r.category === 'fashion'
      ? {
          Material: r.material,
          Formality: r.formality,
          Fit: 'Regular / relaxed',
          Care: 'Follow garment care label',
          Sizes: 'XS, S, M, L, XL',
        }
      : { Material: r.material, Care: 'Wipe clean' };
  return { ...r, specs };
});
export const products: Product[] = [
  ...legacyCatalog
    .filter((p) => activeIds.has(p.id))
    .map((p) => ({
      ...p,
      ar: true,
      ...(p.id === 'h04'
        ? {
            material: 'Velvet & wood',
            specs: { ...p.specs, Material: 'Velvet & wood' },
          }
        : {}),
    })),
  ...cosmoCatalog,
];
const retiredProducts = legacyCatalog
  .filter((p) => !activeIds.has(p.id))
  .map((p) => ({ ...p, stock: 0, retired: true }));
// Historical bags and circles keep their original identity and price, but cannot buy retired items.
export const productById = (id: string) =>
  products.find((p) => p.id === id) || retiredProducts.find((p) => p.id === id);
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
export const colorHex: Record<string, string> = {
  Midnight: '#263147',
  Charcoal: '#41414b',
  Camel: '#b18a61',
  Ivory: '#e6dfd1',
  Black: '#232329',
  Sky: '#91acb9',
  Forest: '#465b48',
  Burgundy: '#6c3441',
  Sand: '#b6a38b',
  Sage: '#899680',
  Brass: '#b4945d',
  Terracotta: '#b06952',
};
