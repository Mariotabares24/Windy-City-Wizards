import { ShopperIntent, StockResult, BudgetResult, ReviewSummary, CatalogItem } from "../types";
import inventoryRaw from "../data/inventory.json";

const inventory = inventoryRaw as Record<string, { inStock: boolean; quantity: number; restockEta?: string }>;

// ─── Stock Checker ─────────────────────────────────────────────────────────────
export async function stockChecker(itemIds: string[]): Promise<StockResult[]> {
  await new Promise((r) => setTimeout(r, 80));
  return itemIds.map((id) => {
    const inv = inventory[id] || { inStock: false, quantity: 0 };
    return {
      itemId: id,
      inStock: inv.inStock,
      quantity: inv.quantity,
      restockEta: inv.restockEta,
    };
  });
}

// ─── Budget Checker ────────────────────────────────────────────────────────────
export async function budgetChecker(
  items: CatalogItem[],
  intent: ShopperIntent
): Promise<BudgetResult> {
  await new Promise((r) => setTimeout(r, 60));
  if (items.length === 0) {
    return { approved: false, message: `No products found under $${intent.budget}.` };
  }
  const cheapest  = Math.min(...items.map((i) => i.price));
  const bestValue = items.reduce((best, item) =>
    item.rating / item.price > best.rating / best.price ? item : best
  );
  if (cheapest <= intent.budget) {
    return {
      approved:  true,
      message:   `Found options from $${cheapest}${cheapest < intent.budget ? `, saving you $${intent.budget - cheapest}` : ""}.`,
      savings:   intent.budget - cheapest,
      bestValue: bestValue.name,
    };
  }
  return {
    approved: false,
    message:  `Cheapest match is $${cheapest}, which is $${cheapest - intent.budget} over budget.`,
  };
}

// ─── Review Summariser ─────────────────────────────────────────────────────────
// Hardcoded review summaries keyed by product ID — swap for a real reviews API.
const MOCK_REVIEWS: Record<string, { rating: number; summary: string; count: number; pros: string[]; cons: string[] }> = {
  p001: { rating:4.9, count:8421,  summary:"Best ANC headphones money can buy in 2026.", pros:["Unmatched noise cancellation","Incredibly comfortable for all-day wear","Multi-device pairing works flawlessly"], cons:["Premium price","Case is bulky"] },
  p002: { rating:4.8, count:12340, summary:"The gold standard for wireless earbuds if you're in the Apple ecosystem.", pros:["Seamless Apple integration","ANC is class-leading for earbuds","Compact case"], cons:["Expensive","Average for Android users"] },
  p003: { rating:4.7, count:3210,  summary:"The best headset for serious remote workers.", pros:["Call quality is exceptional","Battery lasts all week","Teams/Zoom certified"], cons:["Bulky for commuting","High price"] },
  p004: { rating:4.6, count:5670,  summary:"Excellent for Android users who want AirPods-style convenience.", pros:["Great ANC for the price","IP57 waterproofing","Comfortable fit"], cons:["Galaxy-first features","Shorter battery than rivals"] },
  p005: { rating:4.8, count:4120,  summary:"Immersive Audio mode is genuinely stunning for music lovers.", pros:["Exceptional sound quality","Immersive Audio feels magical","Best-in-class comfort"], cons:["Battery shorter than Sony","No multipoint on Immersive mode"] },
  p006: { rating:4.7, count:2890,  summary:"60 hours of battery is almost unbelievable. Sound purists will love these.", pros:["60hr battery is class-leading","Audiophile-grade tuning","Understated design"], cons:["ANC not as strong as Sony/Bose","App could be better"] },
  p007: { rating:4.4, count:15600, summary:"Best budget ANC headphones, full stop.", pros:["Incredible value","LDAC hi-res audio","Comfortable over long sessions"], cons:["Build feels plasticky","ANC not Sony-level"] },
  p008: { rating:4.6, count:4800,  summary:"A wireless version of a studio legend. Sounds faithful to the original.", pros:["Studio-accurate sound","50hr battery","Trusted ATH-M50x tuning"], cons:["On-ear feels tight after 2hrs","No ANC"] },
  p009: { rating:4.5, count:9200,  summary:"The ideal outdoor party speaker. Sounds bigger than its size.", pros:["Genuinely waterproof","Loud and punchy bass","JBL Auracast group listening"], cons:["No speakerphone","Battery drains fast at max volume"] },
  p010: { rating:4.8, count:3100,  summary:"Spatial Audio changes how you hear music at home.", pros:["Dolby Atmos support is real","Trueplay room calibration","Elegant design"], cons:["Expensive","Needs Wi-Fi to unlock best features"] },
  p011: { rating:4.9, count:6700,  summary:"The best laptop for most people. M3 is a generational leap.", pros:["18hr real-world battery","Fanless and silent","Display is gorgeous"], cons:["No fan means throttling under sustained load","Price climbs fast with upgrades"] },
  p012: { rating:4.6, count:2400,  summary:"Premium Windows laptop with a stunning OLED display.", pros:["Best OLED display on a laptop","Compact and light","Thunderbolt 4 x2"], cons:["Only 2 ports","Fan noise under load"] },
  p013: { rating:4.7, count:1890,  summary:"Best gaming laptop display on the market. RTX 4080 is a monster.", pros:["240Hz OLED is breathtaking","RTX 4080 performance","MUX switch for max GPU output"], cons:["Currently out of stock","Heavy for a 16-inch"] },
  p014: { rating:4.8, count:11200, summary:"The mouse that makes work feel effortless. Worth every penny.", pros:["MagSpeed scroll wheel","Silent clicks won't annoy colleagues","Flows between 3 computers"], cons:["Large — not great for small hands","Dongle required for full features"] },
  p015: { rating:4.7, count:9800,  summary:"Apple Watch S10 is the thinnest and most feature-packed yet.", pros:["Sleep Apnea detection could save lives","Thinner and lighter","Biggest always-on display ever"], cons:["18hr battery is still a weak point","Requires iPhone"] },
  p016: { rating:4.8, count:3400,  summary:"The ultimate adventure smartwatch. 16-day battery is real.", pros:["16-day battery tested in the wild","Multi-band GPS is precise","Dive computer and torch built in"], cons:["Very expensive","Bulky for everyday wear"] },
  p017: { rating:4.7, count:22100, summary:"Best e-reader for most people. Wireless charging is a game changer.", pros:["12-week battery","Glare-free in sunlight","Wireless charging finally"], cons:["No colour display","Locked to Kindle ecosystem"] },
  p018: { rating:4.8, count:4200,  summary:"The best drone under 249g. 4K/100fps video is stunning.", pros:["Under 249g avoids many regulations","Omnidirectional obstacle sensing","ActiveTrack 360 is impressive"], cons:["Price adding accessories adds up","Learning curve for beginners"] },
  p019: { rating:4.7, count:6700,  summary:"A productivity upgrade that pays for itself in a week.", pros:["Hugely customisable","Plugin ecosystem is enormous","Instant muscle memory"], cons:["Software setup takes time","Niche product — not for everyone"] },
  p020: { rating:4.5, count:8900,  summary:"The cleanest 3-in-1 charger for iPhone users. Desk stays tidy.", pros:["MagSafe 15W charges iPhone fast","Folds flat for travel","Charges watch simultaneously"], cons:["Apple-only ecosystem","Slightly wobbly when extended"] },
};

export async function reviewSummarizer(itemIds: string[]): Promise<ReviewSummary[]> {
  await new Promise((r) => setTimeout(r, 100));
  return itemIds.map((id) => {
    const r = MOCK_REVIEWS[id] || {
      rating: 4.2, count: 100,
      summary: "Well-reviewed product with solid user satisfaction.",
      pros: ["Good value", "Reliable build quality"],
      cons: ["Limited availability"],
    };
    return { itemId: id, rating: r.rating, summary: r.summary, reviewCount: r.count, pros: r.pros, cons: r.cons };
  });
}
