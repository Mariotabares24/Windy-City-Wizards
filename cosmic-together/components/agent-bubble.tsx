'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Box, Check, Send, Sparkles, X } from 'lucide-react';
import { Photo } from './photo';
import { Bubble, BubbleContent, BubbleGroup } from './ui/bubble';
import { api } from '@/lib/client';
import { inferIntent, orchestrate } from '@/lib/agents';
import { money, productById } from '@/lib/catalog';
import type { ShoppingResult } from '@/lib/contracts';

// Guided intake ported from the cosmos-agent branch: Cosmo asks four questions
// (occasion → style → budget → city), confirms, then fans out to the agents.
const STEPS = ['occasion', 'style', 'budget', 'city'] as const;
type Step = (typeof STEPS)[number] | 'confirm' | 'running' | 'done';

const QUESTIONS: Record<(typeof STEPS)[number], string> = {
  occasion:
    'What’s the occasion? Tell me in your own words — a wedding, a job interview, a first date, brunch with friends, anything.',
  style: 'Love it. How would you describe your personal style?',
  budget: 'Got it. What’s your budget? You can drag the slider or type a number.',
  city: 'Almost there — which city are you shopping for? This helps me check local availability and shipping.',
};

const GREETING =
  'Hi, I’m Cosmo ✦ — your personal shopping assistant. I’ll find your perfect look by consulting five specialist agents. Let’s start with a few quick questions.';

const STYLE_OPTIONS = [
  'Minimalist',
  'Classic',
  'Bohemian',
  'Edgy',
  'Romantic',
  'Sporty',
] as const;

const AGENT_DEFS = [
  { id: 'recommendation', icon: '🎯', label: 'Recommendation Agent', desc: 'Filtering & ranking catalog' },
  { id: 'trends', icon: '📈', label: 'Trend Agent', desc: 'Analysing seasonal data' },
  { id: 'localization', icon: '🌍', label: 'Localization Agent', desc: 'Checking local inventory' },
  { id: 'friends', icon: '👯', label: 'Friend Influence Agent', desc: 'Tallying circle votes' },
  { id: 'stylist', icon: '✦', label: 'Virtual Stylist Agent', desc: 'Generating style advice' },
];

type Intake = { occasion: string; style: string; budget: number; city: string };

type Msg =
  | { id: string; kind: 'text'; from: 'cosmo' | 'user'; text: string }
  | { id: string; kind: 'style' }
  | { id: string; kind: 'budget' }
  | { id: string; kind: 'confirm'; intake: Intake }
  | { id: string; kind: 'result'; data: ShoppingResult; offline: boolean };

// crypto.randomUUID is undefined in insecure contexts (LAN IP over http) — the
// exact cross-device path the invite flow documents. Fall back gracefully.
const newId = () =>
  crypto.randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const EMPTY: Intake = { occasion: '', style: '', budget: 200, city: '' };

export function AgentBubble() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'greeting', kind: 'text', from: 'cosmo', text: GREETING },
  ]);
  const [step, setStep] = useState<Step>('occasion');
  const [intake, setIntake] = useState<Intake>(EMPTY);
  const [input, setInput] = useState('');
  const [budgetDraft, setBudgetDraft] = useState(200);
  const [styleDraft, setStyleDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [agentDone, setAgentDone] = useState(0);
  const [timings, setTimings] = useState<Record<string, number>>({});

  const panel = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  const asked = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const hidden = pathname?.startsWith('/ar/');

  function later(fn: () => void, ms: number) {
    const t = setTimeout(fn, reduce ? 0 : ms);
    timers.current.push(t);
  }

  // Clear pending typing timers if the widget unmounts mid-conversation.
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (open) field.current?.focus();
    else launcher.current?.focus();
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [messages, typing, agentDone, reduce]);

  if (hidden) return null;

  // Asked from the launcher rather than an effect, so the greeting and the
  // first question are tied to the user opening the panel.
  function openPanel() {
    setOpen((v) => !v);
    if (asked.current) return;
    asked.current = true;
    say(QUESTIONS.occasion);
  }

  function push(m: Msg) {
    setMessages((prev) => [...prev, m]);
  }

  function say(text: string, then?: () => void) {
    setTyping(true);
    later(() => {
      setTyping(false);
      push({ id: newId(), kind: 'text', from: 'cosmo', text });
      then?.();
    }, 900);
  }

  function advance(next: Step, updated: Intake) {
    setIntake(updated);
    setStep(next);
    if (next === 'style')
      say(QUESTIONS.style, () =>
        later(() => push({ id: newId(), kind: 'style' }), 400),
      );
    else if (next === 'budget')
      say(QUESTIONS.budget, () =>
        later(() => push({ id: newId(), kind: 'budget' }), 400),
      );
    else if (next === 'city') say(QUESTIONS.city);
    else if (next === 'confirm')
      say('Perfect. Here’s what I’ve got — let me confirm before I fire up the agents.', () =>
        later(
          () => push({ id: newId(), kind: 'confirm', intake: updated }),
          400,
        ),
      );
  }

  function submitText() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    push({ id: newId(), kind: 'text', from: 'user', text });
    if (step === 'occasion') advance('style', { ...intake, occasion: text });
    else if (step === 'city') advance('confirm', { ...intake, city: text });
    else if (step === 'budget') {
      const n = Number(text.replace(/[^0-9.]/g, ''));
      advance('city', { ...intake, budget: n > 0 ? Math.round(n) : intake.budget });
    }
  }

  async function run(final: Intake) {
    setStep('running');
    setAgentDone(0);
    // Stagger the visible agent states while the request is in flight.
    AGENT_DEFS.forEach((_, i) =>
      later(() => setAgentDone((v) => Math.max(v, i)), 180 * (i + 1)),
    );

    const parsed = inferIntent(`${final.occasion} ${final.style}`);
    const request = {
      intent: `${final.occasion} — ${final.style} style`,
      category: parsed.category,
      budget: final.budget,
      formality: parsed.formality,
      styleProfile: final.style.toLowerCase() as
        | 'minimalist'
        | 'classic'
        | 'bohemian'
        | 'edgy'
        | 'romantic'
        | 'sporty',
      location: final.city || 'Chicago',
      colors: [] as string[],
      votes: {} as Record<string, number>,
      demo: false,
    };
    let offline = false;
    let data: ShoppingResult;
    try {
      data = await api<ShoppingResult>('/api/concierge', request);
    } catch {
      // Mirror the shop's resilience: fall back to the on-device catalog agent.
      data = await orchestrate(request);
      offline = true;
    }
    setTimings(
      Object.fromEntries((data.timings || []).map((t) => [t.id, t.ms])),
    );
    setAgentDone(AGENT_DEFS.length);
    setStep('done');
    push({ id: newId(), kind: 'result', data, offline });
  }

  function restart() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setIntake(EMPTY);
    setStyleDraft('');
    setBudgetDraft(200);
    setInput('');
    setTimings({});
    setAgentDone(0);
    setStep('occasion');
    setMessages([{ id: newId(), kind: 'text', from: 'cosmo', text: GREETING }]);
    say(QUESTIONS.occasion);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const focusables = panel.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const typedInputActive =
    step === 'occasion' || step === 'city' || step === 'budget';
  const placeholder =
    step === 'occasion'
      ? 'A fall wedding, a first date…'
      : step === 'city'
        ? 'Chicago, London, Tokyo…'
        : step === 'budget'
          ? 'Or type a number'
          : 'Cosmo is working…';

  return (
    <div className={'agent-dock' + (open ? ' is-open' : '')}>
      <AnimatePresence>
        {open && (
          <motion.dialog
            open
            ref={panel}
            className="agent-panel"
            aria-label="Cosmo chat"
            onKeyDown={onKeyDown}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="agent-head">
              <span className="mini-spark">
                <Sparkles size={17} />
              </span>
              <div>
                <strong>Cosmo</strong>
                <span>Five specialist agents, one shortlist.</span>
              </div>
              {step === 'done' && (
                <button className="text-button" onClick={restart}>
                  Start over
                </button>
              )}
              <button
                className="icon-button"
                aria-label="Close Cosmo"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            <div className="agent-messages" ref={scroller} aria-live="polite">
              {messages.map((m) => {
                if (m.kind === 'text')
                  return (
                    <BubbleGroup key={m.id}>
                      <Bubble
                        variant={m.from === 'user' ? 'default' : 'muted'}
                        align={m.from === 'user' ? 'end' : 'start'}
                      >
                        <BubbleContent>{m.text}</BubbleContent>
                      </Bubble>
                    </BubbleGroup>
                  );

                if (m.kind === 'style')
                  return (
                    <div className="cosmo-widget" key={m.id}>
                      <p className="cosmo-widget-label">Choose your style</p>
                      <div className="cosmo-pills">
                        {STYLE_OPTIONS.map((s) => (
                          <button
                            key={s}
                            className={styleDraft === s ? 'active' : ''}
                            disabled={step !== 'style'}
                            onClick={() => setStyleDraft(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <button
                        className="cosmo-widget-confirm"
                        disabled={!styleDraft || step !== 'style'}
                        onClick={() => {
                          push({
                            id: newId(),
                            kind: 'text',
                            from: 'user',
                            text: styleDraft,
                          });
                          advance('budget', { ...intake, style: styleDraft });
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  );

                if (m.kind === 'budget')
                  return (
                    <div className="cosmo-widget" key={m.id}>
                      <p className="cosmo-widget-label">Set your budget</p>
                      <p className="cosmo-budget-value">
                        ${budgetDraft}
                        <span>USD</span>
                      </p>
                      <input
                        type="range"
                        min={30}
                        max={500}
                        step={10}
                        value={budgetDraft}
                        disabled={step !== 'budget'}
                        aria-label="Budget"
                        onChange={(e) => setBudgetDraft(Number(e.target.value))}
                      />
                      <div className="cosmo-range-ends">
                        <span>$30</span>
                        <span>$500</span>
                      </div>
                      <button
                        className="cosmo-widget-confirm"
                        disabled={step !== 'budget'}
                        onClick={() => {
                          push({
                            id: newId(),
                            kind: 'text',
                            from: 'user',
                            text: `$${budgetDraft}`,
                          });
                          advance('city', { ...intake, budget: budgetDraft });
                        }}
                      >
                        Confirm ${budgetDraft}
                      </button>
                    </div>
                  );

                if (m.kind === 'confirm')
                  return (
                    <div className="cosmo-widget cosmo-confirm" key={m.id}>
                      {[
                        ['Occasion', m.intake.occasion],
                        ['Style', m.intake.style],
                        ['Budget', `$${m.intake.budget}`],
                        ['City', m.intake.city],
                      ].map(([k, v]) => (
                        <div className="cosmo-confirm-row" key={k}>
                          <span>{k}</span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                      <button
                        className="cosmo-widget-confirm"
                        disabled={step !== 'confirm'}
                        onClick={() => void run(m.intake)}
                      >
                        Find my look ✦
                      </button>
                    </div>
                  );

                return <Result key={m.id} msg={m} />;
              })}

              {typing && (
                <BubbleGroup>
                  <Bubble variant="muted" align="start">
                    <BubbleContent>
                      <span className="agent-typing" aria-label="Cosmo is typing">
                        <i />
                        <i />
                        <i />
                      </span>
                    </BubbleContent>
                  </Bubble>
                </BubbleGroup>
              )}

              {(step === 'running' || step === 'done') && (
                <div className="cosmo-agents" aria-label="Cosmo agents">
                  <p className="cosmo-widget-label">
                    Cosmo is consulting all agents in parallel
                  </p>
                  {AGENT_DEFS.map((a, i) => {
                    const done = i < agentDone || step === 'done';
                    return (
                      <div
                        className={'cosmo-agent-row ' + (done ? 'done' : 'running')}
                        key={a.id}
                      >
                        <span className="cosmo-agent-icon">{a.icon}</span>
                        <span className="cosmo-agent-text">
                          <strong>{a.label}</strong>
                          <em>{a.desc}</em>
                        </span>
                        {done ? (
                          <span className="cosmo-agent-badge">
                            {timings[a.id] != null ? `${timings[a.id]}ms` : <Check size={13} />}
                          </span>
                        ) : (
                          <span className="cosmo-agent-bar">
                            <i />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form
              className="agent-input"
              onSubmit={(e) => {
                e.preventDefault();
                submitText();
              }}
            >
              <input
                ref={field}
                aria-label="Reply to Cosmo"
                placeholder={placeholder}
                value={input}
                maxLength={200}
                disabled={!typedInputActive}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                aria-label="Send"
                disabled={!typedInputActive || !input.trim()}
              >
                <Send size={17} />
              </button>
            </form>
          </motion.dialog>
        )}
      </AnimatePresence>
      <button
        ref={launcher}
        className={'agent-launcher' + (open ? ' is-open' : '')}
        aria-label={open ? 'Close Cosmo' : 'Open Cosmo'}
        aria-expanded={open}
        onClick={openPanel}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
    </div>
  );
}

function Result({
  msg,
}: {
  msg: { data: ShoppingResult; offline: boolean };
}) {
  const { data, offline } = msg;
  const loc = data.localization;
  const review = (id: string) => data.reviews?.find((r) => r.productId === id);
  const size = (id: string) => data.sizes?.find((s) => s.productId === id);
  return (
    <div className="cosmo-result">
      <BubbleGroup>
        <Bubble variant="muted" align="start">
          <BubbleContent>{data.summary}</BubbleContent>
        </Bubble>
      </BubbleGroup>

      {data.recommendations.map((r, i) => {
        const p = productById(r.productId);
        if (!p) return null;
        const rv = review(p.id);
        const sz = size(p.id);
        const votes = data.friends?.votes?.[p.id] || 0;
        return (
          <div className={'agent-rec' + (i === 0 ? ' is-top' : '')} key={p.id}>
            <Photo src={p.image} alt={p.name} width={64} height={64} />
            <div className="agent-rec-body">
              {i === 0 && <span className="cosmo-top-badge">✦ Top pick</span>}
              <strong>{p.name}</strong>
              <span>
                {loc && loc.rate !== 1 ? (
                  <>
                    {loc.symbol}
                    {Math.round(p.price * loc.rate).toLocaleString()}{' '}
                    <em className="cosmo-price-base">{money(p.price)}</em>
                  </>
                ) : (
                  money(p.price)
                )}
              </span>
              {rv && (
                <span className="cosmo-stars">
                  {'★'.repeat(Math.round(rv.rating))}
                  {'☆'.repeat(5 - Math.round(rv.rating))} sample rating{' '}
                  {rv.rating}
                </span>
              )}
              <span className="cosmo-rec-meta">
                {sz ? `Size ${sz.size} suggested` : null}
                {votes ? ` · 👥 ${votes} circle ${votes === 1 ? 'vote' : 'votes'}` : null}
              </span>
              <div className="agent-rec-links">
                <a href={'/product/' + p.id}>
                  Explore <ArrowUpRight size={12} />
                </a>
                {p.ar && (
                  <a href={'/ar/' + p.category + '/' + p.id}>
                    <Box size={12} /> Your world
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {data.budgetCheck && (
        <p
          className={
            'cosmo-budget-badge ' + (data.budgetCheck.approved ? 'ok' : 'warn')
          }
        >
          {data.budgetCheck.approved ? '✓' : '!'} {data.budgetCheck.message}
        </p>
      )}

      {data.stylist && (
        <div className="cosmo-stylist">
          <p className="cosmo-widget-label">✦ Virtual Stylist</p>
          <p className="cosmo-stylist-advice">{data.stylist.advice}</p>
          <ul className="cosmo-tips">
            {data.stylist.outfitTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="cosmo-palette">
            {data.stylist.palette.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {data.trends && (
        <div className="cosmo-trends">
          <p className="cosmo-widget-label">
            Trending now — {data.trends.season}
          </p>
          <div className="cosmo-trend-pills">
            {data.trends.trending.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="cosmo-trend-score">
            <div style={{ width: `${data.trends.score}%` }} />
          </div>
          <span className="cosmo-trend-label">
            Trend alignment: {data.trends.score}%
          </span>
        </div>
      )}

      {data.localization && (
        <p className="cosmo-ship">
          🌍 {data.localization.region} · ships in{' '}
          {data.localization.shippingEstimate}
        </p>
      )}

      {offline && (
        <p className="agent-offline">From the on-device sample catalog.</p>
      )}
    </div>
  );
}
