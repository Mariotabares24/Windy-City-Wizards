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
              ? '/images/home.jpg'
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
export const products: Product[] = legacyCatalog
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
  }));
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
