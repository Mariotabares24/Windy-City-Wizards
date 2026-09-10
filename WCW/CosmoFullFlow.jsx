import { useState, useEffect, useRef, useCallback } from "react";

// ─── DATA LAYER ───────────────────────────────────────────────────────────────

const CATALOG = [
  { id:"c001", name:"Silk Wrap Dress", category:"dress", price:145, occasion:["wedding","date","cocktail"], colors:["ivory","blush","champagne"], brand:"Reformation", image:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600", rating:4.8, reviews:312 },
  { id:"c002", name:"Tailored Wool Blazer", category:"blazer", price:210, occasion:["office","cocktail","wedding"], colors:["navy","charcoal","camel"], brand:"Aritzia", image:"https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600", rating:4.6, reviews:198 },
  { id:"c003", name:"Wide-Leg Trousers", category:"pants", price:89, occasion:["office","casual","brunch"], colors:["forest green","cream","charcoal"], brand:"& Other Stories", image:"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600", rating:4.5, reviews:441 },
  { id:"c004", name:"Linen Co-ord Set", category:"set", price:165, occasion:["brunch","casual","vacation"], colors:["sage","terracotta","navy"], brand:"Mango", image:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600", rating:4.7, reviews:287 },
  { id:"c005", name:"Slip Midi Skirt", category:"skirt", price:72, occasion:["date","brunch","cocktail"], colors:["burgundy","gold","dusty rose"], brand:"ZARA", image:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600", rating:4.4, reviews:523 },
  { id:"c006", name:"Structured Mini Dress", category:"dress", price:128, occasion:["cocktail","date","wedding"], colors:["cobalt","emerald","champagne"], brand:"Club Monaco", image:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600", rating:4.9, reviews:174 },
  { id:"c007", name:"Cashmere Turtleneck", category:"top", price:195, occasion:["office","casual","date"], colors:["camel","ivory","burgundy"], brand:"Everlane", image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600", rating:4.8, reviews:362 },
  { id:"c008", name:"Pleated Midi Skirt", category:"skirt", price:95, occasion:["office","brunch","wedding"], colors:["forest green","navy","blush"], brand:"COS", image:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600", rating:4.6, reviews:219 },
];

const INVENTORY = {
  "c001": { available: true,  qty: 12, cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
  "c002": { available: true,  qty: 6,  cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
  "c003": { available: true,  qty: 24, cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
  "c004": { available: true,  qty: 9,  cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
  "c005": { available: false, qty: 0,  cities: { "New York":{eta:"Out of stock",cost:"—"}, "London":{eta:"Out of stock",cost:"—"}, "Paris":{eta:"Out of stock",cost:"—"}, "Tokyo":{eta:"Out of stock",cost:"—"}, "Sydney":{eta:"Out of stock",cost:"—"}, "Los Angeles":{eta:"Out of stock",cost:"—"} } },
  "c006": { available: true,  qty: 3,  cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
  "c007": { available: true,  qty: 18, cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
  "c008": { available: true,  qty: 7,  cities: { "New York":{eta:"2-3 days",cost:"$8"},  "London":{eta:"4-5 days",cost:"£12"}, "Paris":{eta:"3-4 days",cost:"€10"}, "Tokyo":{eta:"6-8 days",cost:"¥1,500"}, "Sydney":{eta:"7-9 days",cost:"A$18"}, "Los Angeles":{eta:"1-2 days",cost:"$6"} } },
};

const TREND_DATA = {
  colors: [
    { name:"Navy",         hex:"#1B2A4A", score:94 },
    { name:"Burgundy",     hex:"#6B1A2A", score:91 },
    { name:"Forest Green", hex:"#2D5016", score:88 },
    { name:"Camel",        hex:"#C19A6B", score:85 },
    { name:"Cobalt",       hex:"#0047AB", score:82 },
    { name:"Ivory",        hex:"#FFFFF0", score:79 },
  ],
  categories: [
    { name:"Blazers & Suiting",   score:96, delta:"+12%" },
    { name:"Midi Lengths",        score:93, delta:"+8%"  },
    { name:"Co-ord Sets",         score:89, delta:"+21%" },
    { name:"Silk & Satin",        score:87, delta:"+5%"  },
    { name:"Tailored Trousers",   score:84, delta:"+9%"  },
  ],
  season: "Autumn/Winter 2026",
  vibes: ["quiet luxury", "old money", "soft tailoring", "dopamine dressing"],
};

// ─── AGENT IMPLEMENTATIONS ────────────────────────────────────────────────────

async function runRecommendationAgent(intent) {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  const { occasion, budget } = intent;
  const occasionKey = occasion.toLowerCase();
  const filtered = CATALOG.filter(item =>
    item.price <= budget &&
    (item.occasion.some(o => occasionKey.includes(o) || o.includes(occasionKey)) || occasionKey === "")
  );
  const pool = filtered.length > 0 ? filtered : CATALOG.filter(i => i.price <= budget);
  const scored = pool.map(item => {
    let score = 0;
    if (item.price <= budget * 0.85) score += 20;
    if (item.price >= budget * 0.6)  score += 15;
    if (item.occasion.some(o => occasionKey.includes(o) || o.includes(occasionKey))) score += 30;
    score += item.rating * 5;
    score += Math.min(item.reviews / 50, 8);
    return { ...item, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

async function runTrendAgent(intent) {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
  const occasionBoost = { wedding:8, cocktail:7, office:6, date:7, brunch:5, casual:4, party:7, vacation:5 };
  const key = Object.keys(occasionBoost).find(k => intent.occasion.toLowerCase().includes(k)) || "casual";
  const baseScore = 78 + (occasionBoost[key] || 5);
  return {
    trendingColors: TREND_DATA.colors.slice(0, 4),
    trendingCategories: TREND_DATA.categories,
    popularityScore: Math.min(baseScore + Math.floor(Math.random() * 10), 99),
    season: TREND_DATA.season,
    vibes: TREND_DATA.vibes,
  };
}

async function runLocalizationAgent(intent) {
  await new Promise(r => setTimeout(r, 350 + Math.random() * 250));
  const { city } = intent;
  const cityKey = Object.keys(INVENTORY["c001"].cities).find(
    k => k.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(k.toLowerCase())
  ) || "New York";
  const availability = {};
  Object.entries(INVENTORY).forEach(([id, data]) => {
    const cityData = data.cities[cityKey] || { eta:"5-7 days", cost:"$12" };
    availability[id] = { inStock: data.available, qty: data.qty, shipping: cityData };
  });
  return { city: cityKey, availability };
}

const ROOMS = {};
async function runFriendAgent(intent) {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const votes = {};
  CATALOG.slice(0, 5).forEach((item, i) => {
    votes[item.id] = Math.floor(Math.random() * 18) + (i === 0 ? 12 : 0);
  });
  ROOMS[roomId] = { votes, members: ["Priya", "Sofia", "Yuki", "Camille"], createdAt: Date.now() };
  const topId = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  return {
    roomId, votes,
    topVotedId: topId,
    topVotedName: CATALOG.find(c => c.id === topId)?.name || "",
    members: ROOMS[roomId].members,
    totalVotes: Object.values(votes).reduce((a, b) => a + b, 0),
  };
}

async function runStylistAgent(intent, topItem) {
  const systemPrompt = `You are Cosmo's Virtual Stylist. Respond ONLY in this JSON shape, no markdown:
{"explanation":"2-sentence styling rationale","accessories":["item1","item2","item3"],"colorPairing":{"primary":"#hex","accent":"#hex","neutral":"#hex","advice":"one sentence"},"alternatives":[{"name":"name","why":"one sentence"},{"name":"name","why":"one sentence"}],"occasionFit":85,"stylistTip":"one actionable sentence"}`;
  const userMsg = `Outfit: ${topItem?.name || "Silk Wrap Dress"} by ${topItem?.brand || "Reformation"}
Occasion: ${intent.occasion}
Budget: $${intent.budget}
Location: ${intent.city}
Style: ${intent.style}
Give expert styling advice.`;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, system:systemPrompt, messages:[{role:"user",content:userMsg}] }),
    });
    if (!resp.ok) throw new Error();
    const data = await resp.json();
    return JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g,"").trim());
  } catch {
    return {
      explanation: `The ${topItem?.name || "Silk Wrap Dress"} is ideal for ${intent.occasion} — the silhouette flatters without effort and reads polished in ${intent.city}. Within $${intent.budget}, it leaves room for accessories that finish the look.`,
      accessories: ["Pointed-toe kitten heels", "Gold chain belt", "Structured mini bag"],
      colorPairing: { primary:"#1B2A4A", accent:"#C19A6B", neutral:"#F5F0E8", advice:"Navy grounds the look; camel lifts it without competing." },
      alternatives: [
        { name:"Tailored Wool Blazer", why:"Adds structure if the occasion skews formal." },
        { name:"Wide-Leg Trousers",    why:"A sharper silhouette for a more editorial take." },
      ],
      occasionFit: 91,
      stylistTip: "Keep jewellery to one statement piece — let the dress be the voice.",
    };
  }
}

// ─── CHAT CONVERSATION FLOW ───────────────────────────────────────────────────
// Steps: occasion → style → budget → city → confirm
const CHAT_STEPS = ["occasion", "style", "budget", "city"];

const COSMO_QUESTIONS = {
  occasion: "What's the occasion? Tell me in your own words — a wedding, a job interview, a first date, brunch with friends, anything.",
  style:    "Love it. How would you describe your personal style?",
  budget:   "Got it. What's your budget? You can drag the slider or type a number.",
  city:     "Almost there — which city are you shopping for? This helps me check local availability and shipping.",
};

const STYLE_OPTIONS = ["Minimalist", "Classic", "Bohemian", "Edgy", "Romantic", "Sporty"];

function cosmoGreeting() {
  return {
    id: "greeting",
    from: "cosmo",
    type: "text",
    text: "Hi, I'm Cosmo ✦ — your personal shopping assistant. I'll find your perfect look by consulting five specialist agents. Let's start with a few quick questions.",
  };
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --ink:#111118; --ink2:#3a3a48; --muted:#8a8799;
  --border:#e2e0ec; --border2:#ccc9df;
  --bg:#f7f6fa; --surface:#fff; --surface2:#f0eef8;
  --plum:#3d1a6e; --plum-light:#f0eaf8; --plum-mid:#8b5cf6;
  --sage:#2d6a4f; --sage-light:#e8f5ef;
  --gold:#9a6b00; --gold-light:#fdf3d7;
  --rose:#8b1a3a; --rose-light:#fce8ef;
  --success:#1a7a4a; --r:12px; --r-sm:8px;
  --serif:'Instrument Serif',Georgia,serif;
  --sans:'DM Sans',system-ui,sans-serif;
}

body{font-family:var(--sans);background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
.screen{min-height:100vh;display:flex;flex-direction:column}

/* ── Chat screen ── */
.chat-screen{background:var(--bg);display:flex;flex-direction:column;height:100vh}
.chat-topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0}
.chat-avatar{width:36px;height:36px;background:linear-gradient(135deg,var(--plum),var(--plum-mid));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#fff;flex-shrink:0}
.chat-title{font-weight:600;font-size:0.92rem;color:var(--ink)}
.chat-subtitle{font-size:0.72rem;color:var(--muted);margin-top:1px}
.chat-online{width:8px;height:8px;background:#4ade80;border-radius:50%;margin-left:auto;flex-shrink:0}

.chat-messages{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px;scroll-behavior:smooth}

/* Bubbles */
.msg-row{display:flex;gap:10px;align-items:flex-end}
.msg-row.user{flex-direction:row-reverse}
.bubble-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600}
.bubble-avatar.cosmo{background:linear-gradient(135deg,var(--plum),var(--plum-mid));color:#fff;font-size:0.85rem}
.bubble-avatar.user{background:var(--surface2);color:var(--plum);border:1px solid var(--border2)}
.bubble{max-width:75%;padding:11px 15px;border-radius:18px;font-size:0.88rem;line-height:1.55}
.bubble.cosmo{background:var(--surface);border:1px solid var(--border);border-bottom-left-radius:4px;color:var(--ink2)}
.bubble.user{background:var(--plum);color:#fff;border-bottom-right-radius:4px}
.bubble-time{font-size:0.62rem;color:var(--muted);margin-top:4px;padding:0 4px}
.msg-row.user .bubble-time{text-align:right}

/* Typing indicator */
.typing-row{display:flex;gap:10px;align-items:center}
.typing-bubble{background:var(--surface);border:1px solid var(--border);border-radius:18px;border-bottom-left-radius:4px;padding:12px 16px;display:flex;gap:5px;align-items:center}
.typing-dot{width:7px;height:7px;background:var(--muted);border-radius:50%;animation:td 1.2s ease-in-out infinite}
.typing-dot:nth-child(2){animation-delay:.2s}
.typing-dot:nth-child(3){animation-delay:.4s}
@keyframes td{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}

/* Interactive widgets inside chat */
.chat-widget{max-width:340px;width:100%}
.widget-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-top:4px}
.widget-label{font-size:0.72rem;font-weight:600;color:var(--muted);margin-bottom:12px;letter-spacing:0.04em}

/* Text input widget */
.occasion-input-wrap{display:flex;gap:8px}
.chat-text-input{flex:1;background:var(--surface2);border:1.5px solid var(--border2);border-radius:100px;padding:10px 16px;font-size:0.85rem;font-family:var(--sans);color:var(--ink);outline:none;transition:border-color .14s}
.chat-text-input:focus{border-color:var(--plum-mid)}
.chat-send-btn{background:var(--plum);color:#fff;border:none;border-radius:100px;padding:10px 18px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:var(--sans);transition:background .14s;white-space:nowrap}
.chat-send-btn:hover{background:#2d1358}
.chat-send-btn:disabled{opacity:.45;cursor:not-allowed}

/* Style pills widget */
.style-pills{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}
.style-pill{background:var(--surface2);border:1.5px solid var(--border2);color:var(--ink2);border-radius:100px;padding:7px 15px;font-size:0.82rem;cursor:pointer;font-family:var(--sans);transition:all .14s}
.style-pill:hover{border-color:var(--plum-mid);color:var(--plum)}
.style-pill.active{background:var(--plum);border-color:var(--plum);color:#fff;font-weight:500}
.style-confirm-btn{background:var(--plum);color:#fff;border:none;border-radius:var(--r-sm);padding:9px 18px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:var(--sans);transition:background .14s}
.style-confirm-btn:hover{background:#2d1358}
.style-confirm-btn:disabled{opacity:.4;cursor:not-allowed}

/* Budget slider widget */
.budget-display{font-family:var(--serif);font-size:2.2rem;color:var(--plum);letter-spacing:-0.02em;margin-bottom:12px;line-height:1}
.budget-display span{font-size:1rem;color:var(--muted);font-family:var(--sans);font-weight:400;margin-left:4px}
input[type=range]{width:100%;accent-color:var(--plum);height:3px;cursor:pointer;margin-bottom:6px}
.range-ends{display:flex;justify-content:space-between;font-size:0.66rem;color:var(--muted);margin-bottom:14px}

/* City input widget */
.city-input-wrap{display:flex;gap:8px}
.city-text-input{flex:1;background:var(--surface2);border:1.5px solid var(--border2);border-radius:var(--r-sm);padding:10px 14px;font-size:0.88rem;font-family:var(--sans);color:var(--ink);outline:none;transition:border-color .14s}
.city-text-input:focus{border-color:var(--plum-mid)}

/* Confirm summary */
.confirm-card{background:var(--surface2);border:1.5px solid var(--border2);border-radius:var(--r);padding:14px 16px;margin-top:4px}
.confirm-row{display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid var(--border)}
.confirm-row:last-of-type{border-bottom:none}
.confirm-key{font-size:0.75rem;color:var(--muted)}
.confirm-val{font-size:0.82rem;font-weight:500;color:var(--ink)}
.confirm-btn{width:100%;margin-top:14px;background:var(--plum);color:#fff;border:none;border-radius:var(--r-sm);padding:12px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:var(--sans);transition:background .14s}
.confirm-btn:hover{background:#2d1358}

/* Bottom input bar (city / occasion free text) */
.chat-inputbar{background:var(--surface);border-top:1px solid var(--border);padding:12px 16px;display:flex;gap:10px;align-items:center;flex-shrink:0}
.bar-input{flex:1;background:var(--surface2);border:1.5px solid var(--border2);border-radius:100px;padding:11px 18px;font-size:0.88rem;font-family:var(--sans);color:var(--ink);outline:none;transition:border-color .14s}
.bar-input:focus{border-color:var(--plum-mid)}
.bar-send{width:40px;height:40px;background:var(--plum);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .14s;flex-shrink:0}
.bar-send:hover{background:#2d1358}
.bar-send:disabled{opacity:.4;cursor:not-allowed}
.bar-send svg{width:16px;height:16px;fill:#fff}

/* Message fade-in */
.msg-row{animation:msgIn .2s ease}
@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ── Processing screen ── */
.processing{background:var(--ink);color:#fff;justify-content:center;align-items:center;padding:40px 24px}
.processing-inner{max-width:420px;width:100%}
.proc-header{text-align:center;margin-bottom:48px}
.proc-cosmo-dot{width:10px;height:10px;background:var(--plum-mid);border-radius:50%;display:inline-block;margin-right:8px;animation:pdot 1.4s ease-in-out infinite}
@keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}
.proc-title{font-family:var(--serif);font-size:1.8rem;color:#fff;margin-bottom:8px;letter-spacing:-.02em}
.proc-subtitle{font-size:.82rem;color:rgba(255,255,255,.45)}
.agents-list{display:flex;flex-direction:column;gap:12px}
.agent-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-sm);transition:border-color .3s,background .3s}
.agent-row.running{border-color:rgba(139,92,246,.5);background:rgba(139,92,246,.08)}
.agent-row.done{border-color:rgba(74,222,128,.35);background:rgba(74,222,128,.05)}
.agent-icon-wrap{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;background:rgba(255,255,255,.07)}
.agent-row.running .agent-icon-wrap{background:rgba(139,92,246,.2)}
.agent-row.done .agent-icon-wrap{background:rgba(74,222,128,.15)}
.agent-info{flex:1}
.agent-name{font-size:.88rem;font-weight:500;color:rgba(255,255,255,.9)}
.agent-desc{font-size:.7rem;color:rgba(255,255,255,.4);margin-top:2px}
.agent-status-wrap{display:flex;align-items:center;gap:8px}
.status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.status-dot.pending{background:rgba(255,255,255,.2)}
.status-dot.running{background:var(--plum-mid);animation:sring 1s linear infinite;box-shadow:0 0 0 2px rgba(139,92,246,.3)}
@keyframes sring{0%{box-shadow:0 0 0 2px rgba(139,92,246,.3)}50%{box-shadow:0 0 0 4px rgba(139,92,246,.1)}100%{box-shadow:0 0 0 2px rgba(139,92,246,.3)}}
.status-dot.done{background:#4ade80}
.status-label{font-size:.72rem;color:rgba(255,255,255,.45)}
.agent-row.running .status-label{color:var(--plum-mid)}
.agent-row.done .status-label{color:#4ade80}
.agent-ms{font-size:.65rem;color:rgba(255,255,255,.25)}
.proc-bar-wrap{margin-top:32px}
.proc-bar-bg{height:2px;background:rgba(255,255,255,.1);border-radius:100px}
.proc-bar-fill{height:100%;background:linear-gradient(90deg,var(--plum-mid),#a78bfa);border-radius:100px;transition:width .5s ease}
.proc-pct{font-size:.72rem;color:rgba(255,255,255,.35);text-align:right;margin-top:6px}

/* ── Results screen ── */
.results{background:var(--bg)}
.results-header{background:var(--ink);padding:20px}
.results-header-inner{max-width:640px;margin:0 auto;display:flex;align-items:center;gap:12px}
.back-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);border-radius:100px;padding:6px 14px;font-size:.78rem;cursor:pointer;font-family:var(--sans);transition:background .14s}
.back-btn:hover{background:rgba(255,255,255,.18)}
.results-title{font-family:var(--serif);font-size:1.3rem;color:#fff;flex:1}
.results-title em{color:var(--plum-mid);font-style:italic}
.results-body{max-width:640px;margin:0 auto;padding:24px 20px 60px;display:flex;flex-direction:column;gap:20px}
.hero-card{background:var(--surface);border-radius:16px;overflow:hidden;border:1.5px solid var(--border)}
.hero-img-wrap{position:relative;aspect-ratio:4/3;overflow:hidden}
.hero-img{width:100%;height:100%;object-fit:cover}
.hero-badges{position:absolute;top:12px;left:12px;display:flex;flex-direction:column;gap:6px}
.badge{font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:100px;line-height:1.3}
.badge-plum{background:var(--plum);color:#fff}
.badge-gold{background:var(--gold-light);color:var(--gold);border:1px solid rgba(154,107,0,.25)}
.badge-sage{background:var(--sage-light);color:var(--sage)}
.badge-rose{background:var(--rose-light);color:var(--rose)}
.hero-body{padding:20px}
.hero-brand{font-size:.68rem;font-weight:600;color:var(--muted);letter-spacing:.06em;margin-bottom:4px}
.hero-name{font-family:var(--serif);font-size:1.6rem;color:var(--ink);letter-spacing:-.02em;margin-bottom:12px}
.hero-meta{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap}
.meta-item{display:flex;flex-direction:column;gap:2px}
.meta-label{font-size:.62rem;color:var(--muted)}
.meta-val{font-size:.88rem;font-weight:600;color:var(--ink)}
.star-row{color:#d4a017;font-size:.75rem}
.hero-cta-row{display:flex;gap:10px}
.cta-primary{flex:1;background:var(--plum);color:#fff;border:none;border-radius:var(--r-sm);padding:12px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:var(--sans)}
.cta-primary:disabled{opacity:.4;cursor:not-allowed}
.cta-ghost{background:transparent;border:1.5px solid var(--border2);color:var(--ink2);border-radius:var(--r-sm);padding:12px 16px;font-size:.88rem;cursor:pointer;font-family:var(--sans)}
.section-card{background:var(--surface);border-radius:14px;border:1.5px solid var(--border);overflow:hidden}
.section-head{padding:16px 18px 0;display:flex;align-items:center;gap:10px}
.section-icon{font-size:1.1rem}
.section-title{font-size:.88rem;font-weight:600;color:var(--ink);flex:1}
.section-chip{font-size:.65rem;font-weight:600;padding:3px 9px;border-radius:100px}
.chip-plum{background:var(--plum-light);color:var(--plum)}
.chip-sage{background:var(--sage-light);color:var(--sage)}
.chip-gold{background:var(--gold-light);color:var(--gold)}
.section-body{padding:14px 18px 18px}
.trend-score-big{font-family:var(--serif);font-size:3.5rem;color:var(--plum);line-height:1;margin-bottom:2px}
.trend-score-label{font-size:.72rem;color:var(--muted);margin-bottom:16px}
.colors-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.color-swatch{display:flex;flex-direction:column;align-items:center;gap:5px}
.swatch-circle{width:38px;height:38px;border-radius:50%;border:2px solid var(--border)}
.swatch-label{font-size:.6rem;color:var(--muted);text-align:center;max-width:44px}
.trend-cats{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.trend-cat-row{display:flex;align-items:center;gap:10px}
.trend-cat-name{font-size:.78rem;color:var(--ink2);flex:1}
.trend-cat-bar-bg{width:80px;height:4px;background:var(--border);border-radius:100px;overflow:hidden}
.trend-cat-bar-fill{height:100%;background:var(--plum-mid);border-radius:100px}
.trend-cat-delta{font-size:.68rem;color:var(--sage);font-weight:600;min-width:36px;text-align:right}
.vibe-pills{display:flex;flex-wrap:wrap;gap:6px}
.vibe-pill{background:var(--surface2);border:1px solid var(--border2);border-radius:100px;font-size:.72rem;padding:4px 11px;color:var(--ink2)}
.avail-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.avail-row:last-child{border-bottom:none;padding-bottom:0}
.avail-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.avail-dot.ok{background:var(--success)}
.avail-dot.none{background:var(--muted)}
.avail-name{font-size:.82rem;color:var(--ink2);flex:1}
.avail-eta{font-size:.72rem;color:var(--muted)}
.avail-cost{font-size:.72rem;font-weight:600;color:var(--plum);min-width:36px;text-align:right}
.ship-note{font-size:.72rem;color:var(--muted);margin-top:10px;background:var(--surface2);border-radius:var(--r-sm);padding:8px 12px}
.room-id-wrap{background:var(--surface2);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.room-id-label{font-size:.68rem;color:var(--muted)}
.room-id-val{font-size:.92rem;font-weight:700;color:var(--plum);font-family:monospace;letter-spacing:.15em}
.copy-btn{background:transparent;border:1px solid var(--border2);border-radius:var(--r-sm);padding:4px 10px;font-size:.68rem;color:var(--ink2);cursor:pointer;font-family:var(--sans)}
.friend-members{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.friend-av{width:32px;height:32px;border-radius:50%;background:var(--plum-light);border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600;color:var(--plum)}
.votes-list{display:flex;flex-direction:column;gap:9px}
.vote-item{display:flex;align-items:center;gap:10px}
.vote-item-name{font-size:.78rem;color:var(--ink2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vote-bar-bg{width:90px;height:5px;background:var(--border);border-radius:100px;overflow:hidden}
.vote-bar-fill{height:100%;background:var(--plum-mid);border-radius:100px}
.vote-count{font-size:.72rem;font-weight:600;color:var(--plum);min-width:24px;text-align:right}
.friend-winner{margin-top:12px;background:var(--plum-light);border-radius:var(--r-sm);padding:10px 14px;font-size:.8rem;color:var(--plum);font-weight:500}
.stylist-intro{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.stylist-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--plum),var(--plum-mid));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.stylist-name{font-size:.88rem;font-weight:600;color:var(--ink)}
.stylist-role{font-size:.68rem;color:var(--muted)}
.stylist-explanation{font-size:.85rem;line-height:1.65;color:var(--ink2);border-left:2.5px solid var(--plum-mid);padding-left:12px;margin-bottom:18px}
.accessories-row{display:flex;flex-direction:column;gap:7px;margin-bottom:18px}
.accessory-item{display:flex;align-items:center;gap:9px;font-size:.82rem;color:var(--ink2)}
.acc-dot{width:6px;height:6px;border-radius:50%;background:var(--plum-mid);flex-shrink:0}
.palette-row-stylist{display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap}
.pal-chip{display:flex;flex-direction:column;align-items:center;gap:4px}
.pal-swatch{width:36px;height:36px;border-radius:8px;border:1.5px solid var(--border)}
.pal-name{font-size:.58rem;color:var(--muted);text-align:center;max-width:40px}
.pal-advice{font-size:.75rem;color:var(--ink2);line-height:1.4;flex:1}
.occasion-fit{display:flex;align-items:baseline;gap:6px;margin-bottom:4px}
.fit-score{font-family:var(--serif);font-size:2.5rem;color:var(--sage);line-height:1}
.fit-label{font-size:.72rem;color:var(--muted)}
.fit-bar-bg{height:4px;background:var(--border);border-radius:100px;overflow:hidden;margin-bottom:14px}
.fit-bar-fill{height:100%;background:linear-gradient(90deg,var(--sage),#4ade80);border-radius:100px}
.stylist-tip{background:var(--gold-light);border-radius:var(--r-sm);padding:10px 14px;font-size:.8rem;color:var(--gold);line-height:1.5}
.alt-list{display:flex;flex-direction:column;gap:8px}
.alt-item{padding:10px 14px;background:var(--surface2);border-radius:var(--r-sm)}
.alt-name{font-size:.82rem;font-weight:500;color:var(--ink);margin-bottom:3px}
.alt-why{font-size:.72rem;color:var(--muted)}
.picks-row{display:flex;flex-direction:column;gap:10px}
.pick-card{display:flex;gap:12px;align-items:center;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:10px;cursor:pointer}
.pick-card:hover{border-color:var(--plum-mid)}
.pick-img{width:56px;height:56px;border-radius:var(--r-sm);object-fit:cover;flex-shrink:0}
.pick-info{flex:1}
.pick-brand{font-size:.62rem;color:var(--muted)}
.pick-name{font-size:.82rem;font-weight:500;color:var(--ink)}
.pick-price{font-size:.82rem;font-weight:600;color:var(--plum);margin-top:2px}
.pick-rank{width:24px;height:24px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;color:var(--muted);flex-shrink:0}

@media(max-width:420px){
  .bubble{max-width:88%}
  .hero-name{font-size:1.35rem}
  .trend-score-big{font-size:2.8rem}
}
`;

// ─── HELPER ───────────────────────────────────────────────────────────────────
function stars(n) { return "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n)); }
function initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AGENT_DEFS = [
  { id:"recommendation", label:"Recommendation Agent", desc:"Filtering & ranking catalog",  icon:"🎯" },
  { id:"trends",         label:"Trend Agent",           desc:"Analysing seasonal data",       icon:"📈" },
  { id:"localization",   label:"Localization Agent",    desc:"Checking local inventory",      icon:"🌍" },
  { id:"friends",        label:"Friend Influence Agent",desc:"Tallying friend votes",          icon:"👯" },
  { id:"stylist",        label:"Virtual Stylist Agent", desc:"Generating style advice",        icon:"✦"  },
];

// ─── CHAT SCREEN ──────────────────────────────────────────────────────────────
function ChatScreen({ onComplete }) {
  const [messages, setMessages]     = useState([{ ...cosmoGreeting(), time: now() }]);
  const [step, setStep]             = useState(0);   // index into CHAT_STEPS
  const [done, setDone]             = useState(false);
  const [isTyping, setIsTyping]     = useState(false);
  const [intent, setIntent]         = useState({ occasion:"", style:"", budget:200, city:"" });
  const [textVal, setTextVal]       = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [budgetLocal, setBudgetLocal]     = useState(200);
  const [cityVal, setCityVal]       = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const currentStep = CHAT_STEPS[step];

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Ask first question after greeting
  useEffect(() => {
    addCosmoMessage(COSMO_QUESTIONS["occasion"]);
  }, []);

  function addCosmoMessage(text, extra = {}) {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), from:"cosmo", type:"text", text, time: now(), ...extra }]);
    }, 900 + Math.random() * 400);
  }

  function addUserMessage(text) {
    setMessages(prev => [...prev, { id: Date.now(), from:"user", type:"text", text, time: now() }]);
  }

  function addWidget(type, data = {}) {
    setMessages(prev => [...prev, { id: Date.now() + 1, from:"cosmo", type, time: now(), ...data }]);
  }

  function advanceStep(newIntent) {
    const nextStep = step + 1;
    setStep(nextStep);
    const nextKey = CHAT_STEPS[nextStep];

    if (nextKey === "style") {
      setTimeout(() => {
        addCosmoMessage(COSMO_QUESTIONS["style"]);
        setTimeout(() => addWidget("style-picker"), 1200);
      }, 300);
    } else if (nextKey === "budget") {
      setTimeout(() => {
        addCosmoMessage(COSMO_QUESTIONS["budget"]);
        setTimeout(() => addWidget("budget-slider"), 1200);
      }, 300);
    } else if (nextKey === "city") {
      setTimeout(() => {
        addCosmoMessage(COSMO_QUESTIONS["city"]);
      }, 300);
    } else if (!nextKey) {
      // All collected — show confirm
      setTimeout(() => {
        addCosmoMessage(`Perfect. Here's what I've got — let me confirm before I fire up the agents.`);
        setTimeout(() => addWidget("confirm", { intent: newIntent }), 1300);
        setDone(true);
      }, 300);
    }
  }

  // ── Handlers ──
  function handleOccasionSubmit() {
    const val = textVal.trim();
    if (!val) return;
    addUserMessage(val);
    setTextVal("");
    const updated = { ...intent, occasion: val };
    setIntent(updated);
    advanceStep(updated);
  }

  function handleStyleConfirm() {
    if (!selectedStyle) return;
    addUserMessage(selectedStyle);
    const updated = { ...intent, style: selectedStyle };
    setIntent(updated);
    advanceStep(updated);
  }

  function handleBudgetConfirm() {
    addUserMessage(`$${budgetLocal}`);
    const updated = { ...intent, budget: budgetLocal };
    setIntent(updated);
    advanceStep(updated);
  }

  function handleCitySubmit() {
    const val = cityVal.trim();
    if (!val) return;
    addUserMessage(val);
    setCityVal("");
    const updated = { ...intent, city: val };
    setIntent(updated);
    advanceStep(updated);
  }

  function handleConfirm(finalIntent) {
    onComplete(finalIntent);
  }

  // ── Render ──
  return (
    <div className="chat-screen">
      <style>{CSS}</style>

      {/* Top bar */}
      <div className="chat-topbar">
        <div className="chat-avatar">✦</div>
        <div>
          <div className="chat-title">Cosmo</div>
          <div className="chat-subtitle">Personal shopping assistant</div>
        </div>
        <div className="chat-online" />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id}>
            {/* Text bubble */}
            {msg.type === "text" && (
              <div className={`msg-row ${msg.from}`}>
                <div className={`bubble-avatar ${msg.from}`}>
                  {msg.from === "cosmo" ? "✦" : "U"}
                </div>
                <div>
                  <div className={`bubble ${msg.from}`}>{msg.text}</div>
                  <div className="bubble-time">{msg.time}</div>
                </div>
              </div>
            )}

            {/* Style picker widget */}
            {msg.type === "style-picker" && (
              <div className="msg-row cosmo">
                <div className="bubble-avatar cosmo">✦</div>
                <div className="chat-widget">
                  <div className="widget-card">
                    <div className="widget-label">Choose your style</div>
                    <div className="style-pills">
                      {STYLE_OPTIONS.map(s => (
                        <button key={s}
                          className={`style-pill ${selectedStyle === s ? "active" : ""}`}
                          onClick={() => setSelectedStyle(s)}
                        >{s}</button>
                      ))}
                    </div>
                    <button className="style-confirm-btn" onClick={handleStyleConfirm} disabled={!selectedStyle || step !== 1}>
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Budget slider widget */}
            {msg.type === "budget-slider" && (
              <div className="msg-row cosmo">
                <div className="bubble-avatar cosmo">✦</div>
                <div className="chat-widget">
                  <div className="widget-card">
                    <div className="widget-label">Set your budget</div>
                    <div className="budget-display">
                      ${budgetLocal}<span>USD</span>
                    </div>
                    <input type="range" min={30} max={500} step={10} value={budgetLocal}
                      onChange={e => setBudgetLocal(Number(e.target.value))} />
                    <div className="range-ends"><span>$30</span><span>$500</span></div>
                    <button className="style-confirm-btn" onClick={handleBudgetConfirm} disabled={step !== 2}>
                      Confirm ${budgetLocal}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm summary widget */}
            {msg.type === "confirm" && (
              <div className="msg-row cosmo">
                <div className="bubble-avatar cosmo">✦</div>
                <div className="chat-widget">
                  <div className="confirm-card">
                    {[
                      ["Occasion", msg.intent?.occasion],
                      ["Style",    msg.intent?.style],
                      ["Budget",   `$${msg.intent?.budget}`],
                      ["City",     msg.intent?.city],
                    ].map(([k, v]) => (
                      <div key={k} className="confirm-row">
                        <span className="confirm-key">{k}</span>
                        <span className="confirm-val">{v}</span>
                      </div>
                    ))}
                    <button className="confirm-btn" onClick={() => handleConfirm(msg.intent)}>
                      Find my look ✦
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-row">
            <div className="bubble-avatar cosmo">✦</div>
            <div className="typing-bubble">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom input bar — only for occasion and city (free text steps) */}
      {(currentStep === "occasion" || currentStep === "city") && !done && (
        <div className="chat-inputbar">
          {currentStep === "occasion" && (
            <>
              <input ref={inputRef} className="bar-input" placeholder="e.g. a summer wedding in Italy…"
                value={textVal} onChange={e => setTextVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleOccasionSubmit()} autoFocus />
              <button className="bar-send" onClick={handleOccasionSubmit} disabled={!textVal.trim()}>
                <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
              </button>
            </>
          )}
          {currentStep === "city" && (
            <>
              <input ref={inputRef} className="bar-input" placeholder="e.g. New York, London, Tokyo…"
                value={cityVal} onChange={e => setCityVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCitySubmit()} autoFocus />
              <button className="bar-send" onClick={handleCitySubmit} disabled={!cityVal.trim()}>
                <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function CosmoApp() {
  const [screen, setScreen]         = useState("chat");
  const [intent, setIntent]         = useState(null);
  const [agentStates, setAgentStates] = useState({});
  const [agentData, setAgentData]   = useState({});
  const [copied, setCopied]         = useState(false);

  const runAgents = useCallback(async (finalIntent) => {
    setIntent(finalIntent);
    setScreen("processing");

    const states = {};
    AGENT_DEFS.forEach(a => { states[a.id] = { status:"pending", ms:null }; });
    setAgentStates({ ...states });

    const t0 = Date.now();
    const markRunning = id => setAgentStates(prev => ({ ...prev, [id]: { status:"running", ms:null } }));
    const markDone    = id => setAgentStates(prev => ({ ...prev, [id]: { status:"done", ms: Date.now() - t0 } }));

    setTimeout(() => markRunning("recommendation"), 50);
    setTimeout(() => markRunning("trends"),         100);
    setTimeout(() => markRunning("localization"),   120);
    setTimeout(() => markRunning("friends"),        90);
    setTimeout(() => markRunning("stylist"),        160);

    const [recs, trends, loc, friends] = await Promise.all([
      runRecommendationAgent(finalIntent).then(r => { markDone("recommendation"); return r; }),
      runTrendAgent(finalIntent).then(r         => { markDone("trends");          return r; }),
      runLocalizationAgent(finalIntent).then(r  => { markDone("localization");    return r; }),
      runFriendAgent(finalIntent).then(r        => { markDone("friends");         return r; }),
    ]);

    const topItem = recs[0];
    const stylist = await runStylistAgent(finalIntent, topItem).then(r => { markDone("stylist"); return r; });

    setAgentData({ recs, trends, loc, friends, stylist });
    await new Promise(r => setTimeout(r, 900));
    setScreen("results");
  }, []);

  const doneCount = Object.values(agentStates).filter(s => s.status === "done").length;
  const pct = Math.round((doneCount / AGENT_DEFS.length) * 100);

  // ── Chat screen ──
  if (screen === "chat") return <ChatScreen onComplete={runAgents} />;

  // ── Processing screen ──
  if (screen === "processing") return (
    <div className="screen processing">
      <style>{CSS}</style>
      <div className="processing-inner">
        <div className="proc-header">
          <div><span className="proc-cosmo-dot" />Cosmo</div>
          <div className="proc-title">Coordinating specialists…</div>
          <div className="proc-subtitle">{intent?.occasion} · ${intent?.budget} · {intent?.city}</div>
        </div>
        <div className="agents-list">
          {AGENT_DEFS.map(ag => {
            const st = agentStates[ag.id] || { status:"pending" };
            return (
              <div key={ag.id} className={`agent-row ${st.status}`}>
                <div className="agent-icon-wrap">{ag.icon}</div>
                <div className="agent-info">
                  <div className="agent-name">{ag.label}</div>
                  <div className="agent-desc">{ag.desc}</div>
                </div>
                <div className="agent-status-wrap">
                  <div className={`status-dot ${st.status}`} />
                  <span className="status-label">
                    {st.status === "pending" ? "Pending" : st.status === "running" ? "Running" : "Complete"}
                  </span>
                  {st.status === "done" && st.ms && <span className="agent-ms">{st.ms}ms</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="proc-bar-wrap">
          <div className="proc-bar-bg"><div className="proc-bar-fill" style={{ width:`${pct}%` }} /></div>
          <div className="proc-pct">{pct}% complete</div>
        </div>
      </div>
    </div>
  );

  // ── Results screen ──
  const { recs=[], trends={}, loc={}, friends={}, stylist={} } = agentData;
  const top = recs[0] || CATALOG[0];
  const topInv = loc.availability?.[top.id] || { inStock:true, qty:5, shipping:{ eta:"2-3 days", cost:"$8" } };
  const maxVotes = Math.max(...Object.values(friends.votes || {}), 1);

  const handleCopy = () => {
    navigator.clipboard?.writeText(friends.roomId || "ROOM01").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="screen results">
      <style>{CSS}</style>
      <div className="results-header">
        <div className="results-header-inner">
          <button className="back-btn" onClick={() => setScreen("chat")}>← New search</button>
          <div className="results-title">Cos<em>mo</em> found your look</div>
        </div>
      </div>

      <div className="results-body">

        {/* Hero card */}
        <div className="hero-card">
          <div className="hero-img-wrap">
            <img className="hero-img" src={top.image} alt={top.name} />
            <div className="hero-badges">
              <span className="badge badge-plum">✦ Top Pick</span>
              {topInv.inStock ? <span className="badge badge-sage">In stock</span> : <span className="badge badge-rose">Sold out</span>}
              <span className="badge badge-gold">Trend {trends.popularityScore}%</span>
            </div>
          </div>
          <div className="hero-body">
            <div className="hero-brand">{top.brand}</div>
            <div className="hero-name">{top.name}</div>
            <div className="hero-meta">
              <div className="meta-item"><span className="meta-label">Price</span><span className="meta-val">${top.price}</span></div>
              <div className="meta-item"><span className="meta-label">Rating</span><span className="meta-val"><span className="star-row">{stars(top.rating)}</span> {top.rating}</span></div>
              <div className="meta-item"><span className="meta-label">Delivery</span><span className="meta-val">{topInv.shipping.eta}</span></div>
              <div className="meta-item"><span className="meta-label">Ship cost</span><span className="meta-val">{topInv.shipping.cost}</span></div>
            </div>
            <div className="hero-cta-row">
              <button className="cta-primary" disabled={!topInv.inStock}>{topInv.inStock ? "Add to bag" : "Notify me"}</button>
              <button className="cta-ghost">Save</button>
            </div>
          </div>
        </div>

        {/* Trend report */}
        <div className="section-card">
          <div className="section-head">
            <span className="section-icon">📈</span>
            <span className="section-title">Trend report</span>
            <span className="section-chip chip-plum">{trends.season}</span>
          </div>
          <div className="section-body">
            <div className="trend-score-big">{trends.popularityScore}<span style={{fontSize:"1.4rem"}}>%</span></div>
            <div className="trend-score-label">popularity score for {intent?.occasion} looks this season</div>
            <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:"8px",fontWeight:600}}>Trending colours</div>
            <div className="colors-row">
              {(trends.trendingColors || []).slice(0, 5).map(c => (
                <div key={c.name} className="color-swatch">
                  <div className="swatch-circle" style={{background:c.hex}} />
                  <div className="swatch-label">{c.name}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:"10px",fontWeight:600}}>Trending categories</div>
            <div className="trend-cats">
              {(trends.trendingCategories || []).map(cat => (
                <div key={cat.name} className="trend-cat-row">
                  <span className="trend-cat-name">{cat.name}</span>
                  <div className="trend-cat-bar-bg"><div className="trend-cat-bar-fill" style={{width:`${cat.score}%`}} /></div>
                  <span className="trend-cat-delta">{cat.delta}</span>
                </div>
              ))}
            </div>
            <div className="vibe-pills">
              {(trends.vibes || []).map(v => <span key={v} className="vibe-pill">{v}</span>)}
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="section-card">
          <div className="section-head">
            <span className="section-icon">🌍</span>
            <span className="section-title">Availability in {loc.city || intent?.city}</span>
            <span className="section-chip chip-sage">{recs.filter(r => loc.availability?.[r.id]?.inStock).length} in stock</span>
          </div>
          <div className="section-body">
            {recs.map(item => {
              const inv = loc.availability?.[item.id] || { inStock:false, shipping:{eta:"—",cost:"—"} };
              return (
                <div key={item.id} className="avail-row">
                  <div className={`avail-dot ${inv.inStock ? "ok" : "none"}`} />
                  <span className="avail-name">{item.name}</span>
                  <span className="avail-eta">{inv.shipping.eta}</span>
                  <span className="avail-cost">{inv.shipping.cost}</span>
                </div>
              );
            })}
            <div className="ship-note">Estimates to {loc.city || intent?.city}. Express options at checkout.</div>
          </div>
        </div>

        {/* Friend room */}
        <div className="section-card">
          <div className="section-head">
            <span className="section-icon">👯</span>
            <span className="section-title">Friend room</span>
            <span className="section-chip chip-plum">{friends.totalVotes || 0} votes</span>
          </div>
          <div className="section-body">
            <div className="room-id-wrap">
              <div>
                <div className="room-id-label">Room code</div>
                <div className="room-id-val">{friends.roomId || "ROOM01"}</div>
              </div>
              <button className="copy-btn" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
            </div>
            <div className="friend-members">
              {(friends.members || []).map(m => <div key={m} className="friend-av" title={m}>{initials(m)}</div>)}
            </div>
            <div className="votes-list">
              {recs.slice(0, 5).map(item => {
                const v = friends.votes?.[item.id] || 0;
                return (
                  <div key={item.id} className="vote-item">
                    <span className="vote-item-name">{item.name}</span>
                    <div className="vote-bar-bg"><div className="vote-bar-fill" style={{width:`${Math.round((v/maxVotes)*100)}%`}} /></div>
                    <span className="vote-count">{v}</span>
                  </div>
                );
              })}
            </div>
            {friends.topVotedName && <div className="friend-winner">★ Friends' favourite: <strong>{friends.topVotedName}</strong></div>}
          </div>
        </div>

        {/* Virtual Stylist */}
        <div className="section-card">
          <div className="section-head">
            <span className="section-icon">✦</span>
            <span className="section-title">Stylist notes</span>
            <span className="section-chip chip-gold">Claude AI</span>
          </div>
          <div className="section-body">
            <div className="stylist-intro">
              <div className="stylist-avatar">✦</div>
              <div>
                <div className="stylist-name">Virtual Stylist</div>
                <div className="stylist-role">Powered by Claude — LLM-only agent</div>
              </div>
            </div>
            {stylist.explanation && <div className="stylist-explanation">{stylist.explanation}</div>}
            {stylist.occasionFit && (
              <>
                <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:"6px",fontWeight:600}}>Occasion fit</div>
                <div className="occasion-fit">
                  <span className="fit-score">{stylist.occasionFit}</span>
                  <span className="fit-label">/ 100 for {intent?.occasion}</span>
                </div>
                <div className="fit-bar-bg"><div className="fit-bar-fill" style={{width:`${stylist.occasionFit}%`}} /></div>
              </>
            )}
            {stylist.accessories?.length > 0 && (
              <>
                <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:"8px",fontWeight:600}}>Accessories</div>
                <div className="accessories-row">
                  {stylist.accessories.map((a,i) => <div key={i} className="accessory-item"><span className="acc-dot" />{a}</div>)}
                </div>
              </>
            )}
            {stylist.colorPairing && (
              <>
                <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:"8px",fontWeight:600}}>Colour pairing</div>
                <div className="palette-row-stylist">
                  {["primary","accent","neutral"].map(role => (
                    <div key={role} className="pal-chip">
                      <div className="pal-swatch" style={{background:stylist.colorPairing[role]||"#ccc"}} />
                      <div className="pal-name">{role}</div>
                    </div>
                  ))}
                  <div className="pal-advice">{stylist.colorPairing.advice}</div>
                </div>
              </>
            )}
            {stylist.stylistTip && <div className="stylist-tip">💡 {stylist.stylistTip}</div>}
            {stylist.alternatives?.length > 0 && (
              <>
                <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:"18px",marginBottom:"8px",fontWeight:600}}>Alternative options</div>
                <div className="alt-list">
                  {stylist.alternatives.map((alt,i) => (
                    <div key={i} className="alt-item">
                      <div className="alt-name">{alt.name}</div>
                      <div className="alt-why">{alt.why}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* More picks */}
        <div className="section-card">
          <div className="section-head">
            <span className="section-icon">🎯</span>
            <span className="section-title">More picks for you</span>
            <span className="section-chip chip-plum">Top 5</span>
          </div>
          <div className="section-body">
            <div className="picks-row">
              {recs.slice(1).map((item,i) => (
                <div key={item.id} className="pick-card">
                  <img className="pick-img" src={item.image} alt={item.name} loading="lazy" />
                  <div className="pick-info">
                    <div className="pick-brand">{item.brand}</div>
                    <div className="pick-name">{item.name}</div>
                    <div className="pick-price">${item.price}</div>
                  </div>
                  <div className="pick-rank">#{i+2}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
