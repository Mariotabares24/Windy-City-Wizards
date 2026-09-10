import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
const CATALOG = [
  { id:"item-001", name:"Linen Wrap Dress", category:"dress", price:89, tags:["casual","summer","wedding","brunch","feminine"], imageUrl:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400", sizes:["XS","S","M","L","XL"], colors:["ivory","sage","blush"], brand:"Reformation" },
  { id:"item-002", name:"Tailored Blazer", category:"top", price:145, tags:["formal","office","cocktail","structured","classic"], imageUrl:"https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400", sizes:["XS","S","M","L"], colors:["black","camel","navy"], brand:"Aritzia" },
  { id:"item-003", name:"High-Rise Wide Leg Trousers", category:"pants", price:78, tags:["office","formal","casual","minimalist","versatile"], imageUrl:"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400", sizes:["XS","S","M","L","XL","XXL"], colors:["cream","charcoal","terracotta"], brand:"& Other Stories" },
  { id:"item-004", name:"Slip Midi Skirt", category:"skirt", price:62, tags:["casual","date","brunch","feminine","effortless"], imageUrl:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400", sizes:["XS","S","M","L"], colors:["gold","chocolate","dusty rose"], brand:"ZARA" },
  { id:"item-005", name:"Structured Mini Dress", category:"dress", price:118, tags:["cocktail","date","wedding","party","chic"], imageUrl:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400", sizes:["XS","S","M","L"], colors:["cobalt","emerald","champagne"], brand:"Club Monaco" },
  { id:"item-006", name:"Cashmere Ribbed Sweater", category:"top", price:195, tags:["casual","cozy","autumn","winter","luxe"], imageUrl:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400", sizes:["XS","S","M","L","XL"], colors:["oatmeal","stone","midnight"], brand:"Everlane" },
];
const INVENTORY = { "item-001":{inStock:true,quantity:24,sizes:["XS","S","M","L"]},"item-002":{inStock:true,quantity:8,sizes:["S","M","L"]},"item-003":{inStock:true,quantity:31,sizes:["XS","S","M","L","XL","XXL"]},"item-004":{inStock:false,quantity:0,sizes:[]},"item-005":{inStock:true,quantity:5,sizes:["XS","S","M"]},"item-006":{inStock:true,quantity:12,sizes:["S","M","L","XL"]} };
const TRENDS_DATA = { season:"Summer 2026", byOccasion:{ wedding:["floral midi","pastel sets","satin slip","lace detail"], office:["power suiting","loafers","minimal accessories","trench coat"], casual:["denim on denim","cargo pants","oversized tees","platform sneakers"], date:["cut-out details","sheer tops","statement earrings","heeled boots"], brunch:["linen sets","woven bags","espadrilles","printed scarves"], cocktail:["sequin details","structured mini","block heels","bold lip"] }, byStyle:{ minimalist:["clean lines","neutral palette","structured silhouettes","quality basics"], bohemian:["flowy fabrics","earth tones","embroidery","layered jewelry"], classic:["timeless cuts","navy and white","pearl accessories","loafers"], edgy:["leather accents","asymmetric cuts","hardware details","bold prints"], romantic:["ruffles","floral prints","pastel hues","delicate lace"], sporty:["athleisure","color blocking","sneakers","functional pockets"] }, global:["quiet luxury","linen everything","ballet flats revival","sheer layers","coastal grandmother","dopamine dressing"] };
const MOCK_REVIEWS = { "item-001":{rating:4.7,summary:"Shoppers love the breathable linen fabric and flattering wrap cut. Runs slightly large.",count:284},"item-002":{rating:4.5,summary:"Praised for sharp tailoring and versatility. Some say sizing runs small in shoulders.",count:193},"item-003":{rating:4.6,summary:"Customers rave about the comfort and timeless silhouette. Great for office and weekend.",count:412},"item-004":{rating:4.3,summary:"Loved for the effortless slip style, but limited size availability noted by reviewers.",count:157},"item-005":{rating:4.8,summary:"A crowd favourite for events. Excellent structure and striking colour options.",count:328},"item-006":{rating:4.9,summary:"Considered worth every penny. Softness and durability praised across all reviews.",count:521} };
const MOCK_VOTES = { "item-001":18,"item-002":11,"item-003":7,"item-004":4,"item-005":22,"item-006":9 };
const REGION_MAP = { "new york":{currency:"USD",rate:1.0,region:"Northeast US",weather:"warm & humid"},"london":{currency:"GBP",rate:0.79,region:"UK",weather:"mild & overcast"},"paris":{currency:"EUR",rate:0.92,region:"Western Europe",weather:"warm & sunny"},"tokyo":{currency:"JPY",rate:149.5,region:"East Asia",weather:"hot & humid"},"sydney":{currency:"AUD",rate:1.52,region:"Australia",weather:"cool & dry"},"los angeles":{currency:"USD",rate:1.0,region:"West Coast US",weather:"warm & sunny"} };

const OCCASIONS = ["Wedding","Office","Casual","Date","Brunch","Cocktail"];
const STYLES = ["Minimalist","Bohemian","Classic","Edgy","Romantic","Sporty"];

const AGENTS = [
  { id:"recommendation", label:"Recommendation", icon:"🎯" },
  { id:"trends",         label:"Trend Analysis", icon:"📈" },
  { id:"localization",   label:"Localization",   icon:"🌍" },
  { id:"friendInfluence",label:"Friend Room",    icon:"👯" },
  { id:"stylist",        label:"Virtual Stylist",icon:"✦" },
];

// ─── Deterministic agent implementations ─────────────────────────────────────
function scoreItem(item, intent) {
  let score = 0;
  if (item.price <= intent.budget) { score += 30; if (item.price >= intent.budget * 0.7) score += 10; }
  const occ = intent.occasion.toLowerCase();
  score += item.tags.filter(t => occ.includes(t) || t.includes(occ)).length * 15;
  const sty = intent.style.toLowerCase();
  score += item.tags.filter(t => sty.includes(t) || t.includes(sty)).length * 10;
  return score;
}

async function runRecommendationAgent(intent) {
  await new Promise(r => setTimeout(r, 450 + Math.random()*200));
  const scored = [...CATALOG].map(item => ({ item, score: scoreItem(item, intent) })).sort((a,b)=>b.score-a.score).slice(0,4).map(s=>s.item);
  return { agentId:"recommendation", items:scored, rationale:`Matched ${scored.length} items for "${intent.occasion}" under $${intent.budget}.` };
}

async function runTrendAgent(intent) {
  await new Promise(r => setTimeout(r, 320 + Math.random()*200));
  const occ = TRENDS_DATA.byOccasion[intent.occasion.toLowerCase()] || TRENDS_DATA.global.slice(0,4);
  const sty = TRENDS_DATA.byStyle[intent.style.toLowerCase()] || [];
  const merged = [...new Set([...occ, ...sty])].slice(0,6);
  return { agentId:"trends", trending:merged, score:78+Math.floor(Math.random()*15), season:TRENDS_DATA.season };
}

async function runLocalizationAgent(intent) {
  await new Promise(r => setTimeout(r, 260 + Math.random()*150));
  const key = intent.location.toLowerCase().trim();
  const regionInfo = REGION_MAP[key] || REGION_MAP[Object.keys(REGION_MAP).find(k=>key.includes(k))||""] || {currency:"USD",rate:1.0,region:"Global",weather:"varies by season"};
  const localPrices = {};
  CATALOG.forEach(item => { localPrices[item.id] = Math.round(item.price * regionInfo.rate * 100)/100; });
  return { agentId:"localization", currency:regionInfo.currency, region:regionInfo.region, localPrices, weatherContext:regionInfo.weather };
}

async function runFriendAgent(intent) {
  await new Promise(r => setTimeout(r, 380 + Math.random()*200));
  const weighted = {};
  CATALOG.forEach(item => { weighted[item.id] = (MOCK_VOTES[item.id]||0) + (item.tags.some(t=>intent.occasion.toLowerCase().includes(t)) ? Math.floor(Math.random()*8):0); });
  const topId = Object.entries(weighted).sort((a,b)=>b[1]-a[1])[0][0];
  return { agentId:"friendInfluence", votes:weighted, topPick:CATALOG.find(i=>i.id===topId)?.name||"", friendCount:8+Math.floor(Math.random()*5) };
}

async function runStylistAgent(intent) {
  const systemPrompt = `You are Cosmo's Virtual Stylist — an expert fashion advisor. Respond ONLY in valid JSON:
{"advice":"2-3 sentence personalised styling advice","outfitTips":["tip1","tip2","tip3"],"colorPalette":["color1","color2","color3"]}
No preamble, no markdown, just the JSON.`;
  const userPrompt = `Occasion: ${intent.occasion}\nBudget: $${intent.budget}\nLocation: ${intent.location}\nStyle: ${intent.style}\n\nGive personalised styling advice.`;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, system:systemPrompt, messages:[{role:"user",content:userPrompt}] })
    });
    if (!resp.ok) throw new Error("API error");
    const data = await resp.json();
    const raw = data.content?.[0]?.text||"{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
    return { agentId:"stylist", advice:parsed.advice||"", outfitTips:parsed.outfitTips||[], colorPalette:parsed.colorPalette||[] };
  } catch {
    return { agentId:"stylist", advice:`For a ${intent.occasion} in ${intent.location}, lean into ${intent.style} silhouettes. Stay within budget with one statement piece and classic basics.`, outfitTips:["Let one hero piece lead, keep the rest quiet","Stick to a 3-colour palette for cohesion","The right accessory transforms any outfit"], colorPalette:["ivory","sage","cognac"] };
  }
}

// Utility services
function stockChecker(itemIds) { return itemIds.map(id => ({ itemId:id, ...(INVENTORY[id]||{inStock:false,quantity:0,sizes:[]}) })); }
function budgetChecker(items, intent) { const min = Math.min(...items.map(i=>i.price)); return min<=intent.budget ? {approved:true,message:`Found options from $${min} — $${intent.budget-min} under budget.`,savings:intent.budget-min} : {approved:false,message:`Items start at $${min}, slightly above your $${intent.budget} budget.`}; }
function reviewSummarizer(itemIds) { return itemIds.map(id => { const r=MOCK_REVIEWS[id]||{rating:4.0,summary:"Solid choice.",count:50}; return {itemId:id,rating:r.rating,summary:r.summary,reviewCount:r.count}; }); }
function sizePredictor(itemIds) { return itemIds.map(id => { const item=CATALOG.find(i=>i.id===id); const size=item?.category==="dress"?"M":item?.category==="top"?"S":"M"; return {itemId:id,recommendedSize:size,confidence:0.78+Math.random()*0.15}; }); }

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0f11;
    --surface: #18181c;
    --surface2: #222228;
    --border: #2e2e38;
    --accent: #b8a8ff;
    --accent2: #7fd7c4;
    --gold: #f5c97a;
    --text: #e8e6f0;
    --muted: #8b879e;
    --danger: #ff6b6b;
    --success: #6bff9e;
    --radius: 14px;
    --radius-sm: 8px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  .app { max-width: 1100px; margin: 0 auto; padding: 0 20px 60px; }

  /* Header */
  .header { padding: 36px 0 28px; border-bottom: 1px solid var(--border); margin-bottom: 32px; display: flex; align-items: baseline; gap: 16px; }
  .header h1 { font-family: 'DM Serif Display', serif; font-size: 2.4rem; letter-spacing: -0.02em; color: var(--text); }
  .header h1 em { color: var(--accent); font-style: italic; }
  .header p { color: var(--muted); font-size: 0.9rem; }

  /* Input Panel */
  .cosmo-input-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; margin-bottom: 28px; }
  .input-grid { display: flex; flex-direction: column; gap: 22px; margin-bottom: 24px; }
  .field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .pill { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); border-radius: 100px; padding: 6px 14px; font-size: 0.82rem; cursor: pointer; transition: all 0.15s; font-family: inherit; }
  .pill:hover { border-color: var(--accent); color: var(--accent); }
  .pill.active { background: var(--accent); border-color: var(--accent); color: #0f0f11; font-weight: 600; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sub-field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  input[type=range] { width: 100%; accent-color: var(--accent); height: 4px; }
  .range-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); margin-top: 4px; }
  input[type=text] { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); padding: 10px 14px; font-size: 0.88rem; font-family: inherit; outline: none; transition: border-color 0.15s; }
  input[type=text]:focus { border-color: var(--accent); }
  .cosmo-submit { width: 100%; padding: 14px; background: var(--accent); color: #0f0f11; border: none; border-radius: var(--radius-sm); font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s, transform 0.1s; }
  .cosmo-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .cosmo-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0f0f11; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Agents Panel */
  .loading-agents { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 28px; }
  .agents-title { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .agents-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
  .agent-card { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; display: flex; align-items: center; gap: 10px; position: relative; overflow: hidden; transition: border-color 0.2s; }
  .agent-icon { font-size: 1.3rem; flex-shrink: 0; }
  .agent-info { flex: 1; }
  .agent-label { display: block; font-size: 0.82rem; font-weight: 500; color: var(--text); }
  .agent-status-badge { display: block; font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
  .agent-card.agent-running { border-color: var(--accent); }
  .agent-card.agent-running .agent-status-badge { color: var(--accent); }
  .agent-card.agent-done { border-color: var(--accent2); }
  .agent-card.agent-done .agent-status-badge { color: var(--accent2); }
  .agent-duration { font-size: 0.68rem; color: var(--muted); margin-left: auto; }
  .agent-pulse-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--border); }
  .pulse-fill { height: 100%; background: var(--accent); animation: pulse-anim 1.2s ease-in-out infinite; }
  @keyframes pulse-anim { 0%,100%{width:0%} 50%{width:100%} }

  /* Results layout */
  .results { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
  @media(max-width: 800px) { .results { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr; } }

  /* Recommendation Cards */
  .recs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .rec-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.2s, transform 0.15s; position: relative; }
  .rec-card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .rec-card--featured { border-color: var(--gold); }
  .rec-badge { position: absolute; top: 10px; left: 10px; background: var(--gold); color: #0f0f11; font-size: 0.68rem; font-weight: 700; padding: 3px 8px; border-radius: 100px; z-index: 2; }
  .rec-badge--friend { background: var(--accent2); left: auto; right: 10px; }
  .rec-image-wrap { position: relative; aspect-ratio: 3/4; overflow: hidden; }
  .rec-image-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  .rec-card:hover img { transform: scale(1.04); }
  .rec-sold-out { position: absolute; inset: 0; background: rgba(15,15,17,0.7); display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 600; color: var(--danger); }
  .rec-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .rec-brand { font-size: 0.68rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .rec-name { font-size: 0.9rem; font-weight: 500; line-height: 1.3; }
  .rec-price-row { display: flex; align-items: baseline; gap: 8px; }
  .rec-price { font-size: 1rem; font-weight: 600; color: var(--accent); }
  .rec-price-original { font-size: 0.78rem; color: var(--muted); text-decoration: line-through; }
  .rec-review { border-top: 1px solid var(--border); padding-top: 8px; }
  .rec-stars { color: var(--gold); font-size: 0.75rem; }
  .rec-review-count { font-size: 0.68rem; color: var(--muted); margin-left: 6px; }
  .rec-review-summary { font-size: 0.72rem; color: var(--muted); margin-top: 4px; line-height: 1.4; }
  .rec-meta { display: flex; flex-direction: column; gap: 4px; }
  .rec-size-tag { font-size: 0.72rem; color: var(--accent2); }
  .rec-size-tag em { color: var(--muted); font-style: normal; }
  .rec-votes { font-size: 0.72rem; color: var(--muted); }
  .rec-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .rec-tag { background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; font-size: 0.65rem; padding: 2px 8px; color: var(--muted); }
  .rec-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 8px; }
  .btn-primary { flex: 1; background: var(--accent); color: #0f0f11; border: none; border-radius: var(--radius-sm); padding: 9px 0; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: var(--radius-sm); padding: 9px 14px; font-size: 0.8rem; cursor: pointer; font-family: inherit; transition: border-color 0.15s; }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

  /* Right panel */
  .right-panel { display: flex; flex-direction: column; gap: 16px; }

  /* Stylist Panel */
  .stylist-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .stylist-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .stylist-avatar { width: 38px; height: 38px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
  .stylist-label { font-weight: 600; font-size: 0.88rem; }
  .stylist-sublabel { font-size: 0.68rem; color: var(--muted); }
  .stylist-advice { font-size: 0.85rem; line-height: 1.6; color: var(--text); border-left: 2px solid var(--accent); padding-left: 12px; margin-bottom: 16px; }
  .tips-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
  .stylist-tips ul { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .stylist-tips li { font-size: 0.8rem; color: var(--muted); padding-left: 14px; position: relative; line-height: 1.4; }
  .stylist-tips li::before { content: "→"; position: absolute; left: 0; color: var(--accent); }
  .palette-row { display: flex; gap: 8px; margin-bottom: 16px; }
  .palette-swatch { width: 44px; height: 44px; border-radius: var(--radius-sm); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; border: 1px solid var(--border); }
  .palette-swatch span { font-size: 0.55rem; color: rgba(0,0,0,0.7); background: rgba(255,255,255,0.4); border-radius: 3px; padding: 1px 3px; }
  .trends-section { border-top: 1px solid var(--border); padding-top: 14px; }
  .trends-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .trend-pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; font-size: 0.7rem; padding: 3px 10px; color: var(--muted); }
  .trend-score { display: flex; align-items: center; gap: 10px; }
  .trend-score-bar { height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 100px; flex-shrink: 0; }
  .trend-score span { font-size: 0.72rem; color: var(--muted); white-space: nowrap; }

  /* Friend Room */
  .friend-room { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .friend-header { margin-bottom: 14px; }
  .friend-avatars { display: flex; margin-bottom: 6px; }
  .friend-avatar { font-size: 1.2rem; margin-right: -6px; }
  .friend-count { font-size: 0.78rem; color: var(--muted); margin-top: 8px; }
  .friend-top-pick { display: flex; align-items: center; gap: 8px; background: var(--surface2); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px; font-size: 0.8rem; }
  .friend-star { color: var(--gold); font-size: 1rem; }
  .friend-votes { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .vote-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; }
  .vote-item-name { font-size: 0.75rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vote-bar-wrap { width: 80px; height: 4px; background: var(--border); border-radius: 100px; overflow: hidden; }
  .vote-bar { height: 100%; background: var(--accent2); border-radius: 100px; transition: width 0.5s ease; }
  .vote-count { font-size: 0.72rem; color: var(--muted); min-width: 20px; text-align: right; }
  .budget-badge { border-radius: var(--radius-sm); padding: 10px 12px; font-size: 0.78rem; line-height: 1.4; }
  .budget-ok { background: rgba(107,255,158,0.08); border: 1px solid rgba(107,255,158,0.25); color: var(--success); }
  .budget-warn { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25); color: var(--danger); }

  /* Misc */
  .rationale { font-size: 0.78rem; color: var(--muted); margin-bottom: 16px; font-style: italic; }
  .section-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 14px; }
`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function CosmoApp() {
  const [occasion, setOccasion] = useState("Casual");
  const [budget, setBudget] = useState(120);
  const [location, setLocation] = useState("New York");
  const [style, setStyle] = useState("Minimalist");
  const [loading, setLoading] = useState(false);
  const [agentStates, setAgentStates] = useState([]);
  const [result, setResult] = useState(null);

  const updateAgent = useCallback((id, patch) => {
    setAgentStates(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const handleSubmit = async () => {
    const intent = { occasion: occasion.toLowerCase(), budget, location, style: style.toLowerCase() };
    setLoading(true);
    setResult(null);

    // Init all agents to running
    const initStates = AGENTS.map(a => ({ ...a, status: "running" }));
    setAgentStates(initStates);

    // Run all agents in parallel, updating status as each completes
    const start = Date.now();

    const wrapAgent = (agentFn, id) => {
      const t0 = Date.now();
      return agentFn(intent).then(res => {
        updateAgent(id, { status: "done", durationMs: Date.now() - t0 });
        return res;
      }).catch(err => {
        updateAgent(id, { status: "error" });
        throw err;
      });
    };

    try {
      const [recommendations, trends, localization, friendInfluence, stylistAdvice] = await Promise.all([
        wrapAgent(runRecommendationAgent, "recommendation"),
        wrapAgent(runTrendAgent, "trends"),
        wrapAgent(runLocalizationAgent, "localization"),
        wrapAgent(runFriendAgent, "friendInfluence"),
        wrapAgent(runStylistAgent, "stylist"),
      ]);

      const recommendedIds = recommendations.items.map(i => i.id);
      const stock = stockChecker(recommendedIds);
      const budgetCheck = budgetChecker(recommendations.items, intent);
      const reviews = reviewSummarizer(recommendedIds);
      const sizePredictions = sizePredictor(recommendedIds);

      setResult({ intent, recommendations, trends, localization, friendInfluence, stylistAdvice, stock, budgetCheck, reviews, sizePredictions, sessionId: `cosmo-${Date.now()}`, generatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const stars = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <h1>Cos<em>mo</em></h1>
          <p>Your AI shopping orchestrator</p>
        </div>

        {/* Input */}
        <div className="cosmo-input-panel">
          <div className="input-grid">
            <div className="field">
              <label>Occasion</label>
              <div className="pill-row">{OCCASIONS.map(o => <button key={o} className={`pill ${occasion===o?"active":""}`} onClick={()=>setOccasion(o)}>{o}</button>)}</div>
            </div>
            <div className="field">
              <label>Style</label>
              <div className="pill-row">{STYLES.map(s => <button key={s} className={`pill ${style===s?"active":""}`} onClick={()=>setStyle(s)}>{s}</button>)}</div>
            </div>
            <div className="field field-row">
              <div className="sub-field">
                <label>Budget — ${budget}</label>
                <input type="range" min={30} max={400} step={10} value={budget} onChange={e=>setBudget(Number(e.target.value))} />
                <div className="range-labels"><span>$30</span><span>$400</span></div>
              </div>
              <div className="sub-field">
                <label>Location</label>
                <input type="text" value={location} placeholder="New York, Paris, Tokyo…" onChange={e=>setLocation(e.target.value)} />
              </div>
            </div>
          </div>
          <button className="cosmo-submit" onClick={handleSubmit} disabled={loading || !location.trim()}>
            {loading ? <span className="btn-loading"><span className="spinner" />Finding your look…</span> : "Ask Cosmo ✦"}
          </button>
        </div>

        {/* Agent Execution Panel */}
        {agentStates.length > 0 && (
          <div className="loading-agents">
            <p className="agents-title">Cosmo is consulting all agents in parallel</p>
            <div className="agents-grid">
              {agentStates.map(agent => (
                <div key={agent.id} className={`agent-card agent-${agent.status}`}>
                  <span className="agent-icon">{agent.icon}</span>
                  <div className="agent-info">
                    <span className="agent-label">{agent.label}</span>
                    <span className="agent-status-badge">{agent.status==="running"?"Running…":agent.status==="done"?"Done":agent.status==="error"?"Error":"Idle"}</span>
                  </div>
                  {agent.status==="running" && <div className="agent-pulse-bar"><div className="pulse-fill" /></div>}
                  {agent.status==="done" && agent.durationMs && <span className="agent-duration">{agent.durationMs}ms</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="results">
            {/* Left: Recommendations */}
            <div>
              <p className="section-label">Recommendations</p>
              <p className="rationale">{result.recommendations.rationale}</p>
              <div className="recs-grid">
                {result.recommendations.items.map((item, rank) => {
                  const stock = result.stock.find(s => s.itemId===item.id);
                  const review = result.reviews.find(r => r.itemId===item.id);
                  const size = result.sizePredictions.find(s => s.itemId===item.id);
                  const localPrice = result.localization.localPrices[item.id];
                  const friendVotes = result.friendInfluence.votes[item.id]||0;
                  const isTopPick = result.friendInfluence.topPick===item.name;
                  return (
                    <div key={item.id} className={`rec-card ${rank===0?"rec-card--featured":""}`}>
                      {rank===0 && <span className="rec-badge">✦ Top Pick</span>}
                      {isTopPick && rank!==0 && <span className="rec-badge rec-badge--friend">👯 Friend Fave</span>}
                      <div className="rec-image-wrap">
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                        {!stock?.inStock && <div className="rec-sold-out">Out of Stock</div>}
                      </div>
                      <div className="rec-body">
                        <div className="rec-brand">{item.brand}</div>
                        <div className="rec-name">{item.name}</div>
                        <div className="rec-price-row">
                          <span className="rec-price">{result.localization.currency} {localPrice?.toFixed(0)}</span>
                          {localPrice !== item.price && <span className="rec-price-original">${item.price}</span>}
                        </div>
                        {review && (
                          <div className="rec-review">
                            <span className="rec-stars">{stars(review.rating)}</span>
                            <span className="rec-review-count">{review.reviewCount} reviews</span>
                            <p className="rec-review-summary">{review.summary}</p>
                          </div>
                        )}
                        <div className="rec-meta">
                          {size && <span className="rec-size-tag">Size {size.recommendedSize} recommended <em>({Math.round(size.confidence*100)}% match)</em></span>}
                          <span className="rec-votes">👥 {friendVotes} friends interested</span>
                        </div>
                        <div className="rec-tags">{item.tags.slice(0,3).map(t=><span key={t} className="rec-tag">{t}</span>)}</div>
                        <div className="rec-actions">
                          <button className="btn-primary" disabled={!stock?.inStock}>{stock?.inStock?"Add to Bag":"Notify Me"}</button>
                          <button className="btn-ghost">Save</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right panel */}
            <div className="right-panel">
              {/* Virtual Stylist */}
              <div className="stylist-panel">
                <div className="stylist-header">
                  <span className="stylist-avatar">✦</span>
                  <div>
                    <p className="stylist-label">Virtual Stylist</p>
                    <p className="stylist-sublabel">Powered by Claude AI</p>
                  </div>
                </div>
                <p className="stylist-advice">{result.stylistAdvice.advice}</p>
                {result.stylistAdvice.outfitTips.length > 0 && (
                  <div className="stylist-tips">
                    <p className="tips-label">Outfit tips</p>
                    <ul>{result.stylistAdvice.outfitTips.map((tip,i)=><li key={i}>{tip}</li>)}</ul>
                  </div>
                )}
                {result.stylistAdvice.colorPalette.length > 0 && (
                  <div className="stylist-palette">
                    <p className="tips-label">Your colour palette</p>
                    <div className="palette-row">
                      {result.stylistAdvice.colorPalette.map(color=>(
                        <div key={color} className="palette-swatch" style={{background:color}}>
                          <span>{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="trends-section">
                  <p className="tips-label">Trending now — {result.trends.season}</p>
                  <div className="trends-pills">{result.trends.trending.map(t=><span key={t} className="trend-pill">{t}</span>)}</div>
                  <div className="trend-score">
                    <div className="trend-score-bar" style={{width:`${result.trends.score}%`}} />
                    <span>Trend alignment: {result.trends.score}%</span>
                  </div>
                </div>
              </div>

              {/* Friend Room */}
              <div className="friend-room">
                <div className="friend-header">
                  <div className="friend-avatars">{"🧑👩🧔👨🧕👱🧒👧".split(/(?<=.{2})/u).slice(0,result.friendInfluence.friendCount).map((a,i)=><span key={i} className="friend-avatar">{a}</span>)}</div>
                  <p className="friend-count">{result.friendInfluence.friendCount} friends shopped for the same occasion</p>
                </div>
                <div className="friend-top-pick">
                  <span className="friend-star">★</span>
                  <span>Most popular: <strong>{result.friendInfluence.topPick}</strong></span>
                </div>
                <div className="friend-votes">
                  {Object.entries(result.friendInfluence.votes).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([id,votes])=>{
                    const item = result.recommendations.items.find(i=>i.id===id);
                    if(!item) return null;
                    const max = Math.max(...Object.values(result.friendInfluence.votes));
                    return (
                      <div key={id} className="vote-row">
                        <span className="vote-item-name">{item.name}</span>
                        <div className="vote-bar-wrap"><div className="vote-bar" style={{width:`${Math.round((votes/max)*100)}%`}} /></div>
                        <span className="vote-count">{votes}</span>
                      </div>
                    );
                  })}
                </div>
                <div className={`budget-badge ${result.budgetCheck.approved?"budget-ok":"budget-warn"}`}>
                  {result.budgetCheck.approved?"✓":"!"} {result.budgetCheck.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
