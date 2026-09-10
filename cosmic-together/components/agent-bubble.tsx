'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Box, Send, Sparkles, X } from 'lucide-react';
import { Photo } from './photo';
import { Bubble, BubbleContent, BubbleGroup } from './ui/bubble';
import { api } from '@/lib/client';
import { inferIntent, orchestrate } from '@/lib/agents';
import { money, productById } from '@/lib/catalog';
import type { ShoppingResult } from '@/lib/contracts';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recs?: ShoppingResult['recommendations'];
  offline?: boolean;
};

// crypto.randomUUID is undefined in insecure contexts (LAN IP over http) — the
// exact cross-device path the invite flow documents. Fall back gracefully.
const newId = () =>
  crypto.randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const greeting: Message = {
  id: 'greeting',
  role: 'assistant',
  text: 'Hi — I’m Cosmo. Tell me what you’re looking for and I’ll pull together a shortlist. Try “a warm floor lamp for my reading corner”.',
};

export function AgentBubble() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const panel = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // Never cover the AR capture UI — hide entirely on the immersive routes.
  const hidden = pathname?.startsWith('/ar/');

  useEffect(() => {
    // Move focus into the panel on open and back to the launcher on close,
    // but never steal focus on the initial mount.
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
  }, [messages, loading, reduce]);

  if (hidden) return null;

  async function submit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { id: newId(), role: 'user', text }]);
    setLoading(true);
    const parsed = inferIntent(text);
    const request = {
      intent: text,
      category: parsed.category,
      budget: parsed.budget ?? 500,
      formality: parsed.formality,
      style: 'familiar' as const,
      location: 'Chicago' as const,
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
      data = orchestrate(request);
      offline = true;
    }
    setMessages((m) => [
      ...m,
      {
        id: newId(),
        role: 'assistant',
        text: data.summary,
        recs: data.recommendations,
        offline,
      },
    ]);
    setLoading(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    // Exclude disabled controls — the Send button is disabled in the resting
    // (empty-input) state, and including it would let Tab escape the dialog.
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

  return (
    <div className="agent-bubble-root">
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
                <span>A shortlist, whenever you need one.</span>
              </div>
              <button
                className="icon-button"
                aria-label="Close Cosmo"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="agent-messages" ref={scroller} aria-live="polite">
              {messages.map((m) => (
                <BubbleGroup key={m.id}>
                  <Bubble
                    variant={m.role === 'user' ? 'default' : 'muted'}
                    align={m.role === 'user' ? 'end' : 'start'}
                  >
                    <BubbleContent>{m.text}</BubbleContent>
                  </Bubble>
                  {m.recs && m.recs.length > 0 && (
                    <div className="agent-recs">
                      {m.recs.map((r) => {
                        const p = productById(r.productId);
                        if (!p) return null;
                        return (
                          <div className="agent-rec" key={r.productId}>
                            <Photo
                              src={p.image}
                              alt={p.name}
                              width={64}
                              height={64}
                            />
                            <div className="agent-rec-body">
                              <strong>{p.name}</strong>
                              <span>{money(p.price)}</span>
                              <div className="agent-rec-links">
                                <a href={'/product/' + p.id}>
                                  Explore <ArrowUpRight size={12} />
                                </a>
                                <a href={'/ar/' + p.category + '/' + p.id}>
                                  <Box size={12} /> Your world
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {m.offline && (
                    <p className="agent-offline">
                      From the on-device sample catalog.
                    </p>
                  )}
                </BubbleGroup>
              ))}
              {loading && (
                <BubbleGroup>
                  <Bubble variant="muted" align="start">
                    <BubbleContent>
                      <span className="agent-typing" aria-label="Thinking">
                        <i />
                        <i />
                        <i />
                      </span>
                    </BubbleContent>
                  </Bubble>
                </BubbleGroup>
              )}
            </div>
            <form
              className="agent-input"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                ref={field}
                aria-label="Ask Cosmo"
                placeholder="What are you shopping for?"
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                aria-label="Send"
                disabled={loading || !input.trim()}
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
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
    </div>
  );
}
