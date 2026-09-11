'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Phone, Send, Settings as SettingsIcon, Sparkles, Users, X, Lock } from 'lucide-react';
import { Bubble, BubbleContent, BubbleGroup } from './ui/bubble';
import { api } from '@/lib/client';
import { money } from '@/lib/catalog';
import {
  isHarmful,
  isOutOfCatalog,
  isInviteIntent,
  isAffirmative,
  resolveCategory,
  resolveColorFamilies,
  resolveOccasion,
  resolveSeason,
  type CategoryGroup,
  type ColorFamily,
  type Occasion,
  type Season,
} from '@/lib/cosmo/keywords';
import { runGatesWithFallback, newRoomCode, type Intake, type Scored } from '@/lib/cosmo/gates';
import { FRIEND_ROSTER, friendLine, type Friend } from '@/lib/cosmo/friends';
import { prefsStore, isPrivateShopping, DEFAULT_PREFS } from '@/lib/prefs-store';
import type { Preferences } from '@/lib/contracts';

type QR = { label: string; value: string };
type BubbleMsg = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  quickReplies?: QR[];
  agentRun?: boolean;
  results?: Scored[];
  friendPicker?: boolean;
  phoneCard?: boolean;
  groupPicker?: boolean;
  cardActions?: boolean;
  settingsLink?: boolean;
};

type Phase =
  | 'greeting'
  | 'intake-open'
  | 'ask-budget'
  | 'ask-size'
  | 'ask-season'
  | 'agents-running'
  | 'results'
  | 'invite-picker'
  | 'invite-chatting'
  | 'invite-confirm'
  | 'intercept';

const AGENTS = [
  { key: 'localization', label: 'Localization Agent — checking regional stock', ms: 550 },
  { key: 'trend', label: 'Trend Agent — scoring seasonal fit', ms: 700 },
  { key: 'friend', label: 'Friend Influence Agent — collecting room votes', ms: 500 },
  { key: 'recommendation', label: 'Recommendation Agent — applying hard gates', ms: 850 },
] as const;
const LONGEST_MS = Math.max(...AGENTS.map((a) => a.ms)) + 150;

const BUDGET_REPLIES: QR[] = [
  { label: 'Under $50', value: '50' },
  { label: '$50–100', value: '100' },
  { label: '$100–150', value: '150' },
  { label: 'No limit', value: 'nolimit' },
];
const SIZE_REPLIES: QR[] = ['XS', 'S', 'M', 'L', 'XL'].map((s) => ({ label: s, value: s }));
const SEASON_REPLIES: QR[] = ['Spring', 'Summer', 'Fall', 'Winter'].map((s) => ({
  label: s,
  value: s.toLowerCase(),
}));
const PRIVACY_REPLIES: QR[] = [
  { label: 'Keep personalized', value: 'personalized' },
  { label: 'Change privacy settings', value: 'settings' },
];
const GROUP_REPLIES: QR[] = [
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Home', value: 'Home' },
  { label: 'Lifestyle', value: 'Lifestyle' },
];

const GREETING =
  "Hi, I'm Cosmo ✦ What are you shopping for today? I can help you find trending items, see what your friends like, and recommend picks based on your saved preferences! You're browsing in personalized mode by default — let me know if you'd rather switch to private shopping.";

const OFFTOPIC_REPLIES = [
  "I'm your CosmicMart shopping assistant — I can only help with fashion, home, or lifestyle items from our catalog. What are you shopping for?",
  "Let's keep it focused on shopping. Tell me what you're looking for — a suit, a dress, a chair, a headset, or a watch — and I'll take it from there.",
  "That's outside what I can help with. Try something like “a dress for a wedding under $250” or “a reading chair in a warm neutral.”",
];

const newId = () =>
  crypto.randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2);

function emptyIntake(): Intake {
  return {
    category: null,
    categoryGroup: null,
    colors: [],
    occasion: null,
    budget: null,
    size: null,
    season: null,
    roomCode: newRoomCode(),
  };
}

function labelFor(key: 'colors' | 'occasion' | 'budget' | 'category') {
  return key === 'colors'
    ? 'colour'
    : key === 'occasion'
      ? 'occasion'
      : key === 'budget'
        ? 'budget'
        : 'category';
}

export function AgentBubble() {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('greeting');
  const priorPhase = useRef<Phase>('greeting');
  const [intake, setIntake] = useState<Intake>(() => emptyIntake());
  const [prefs, setPrefs] = useState<Preferences>(() => prefsStore.get());
  const [selectedProduct, setSelectedProduct] = useState<Scored | null>(null);
  const [pickedFriends, setPickedFriends] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [offtopicStreak, setOfftopicStreak] = useState(0);
  const [messages, setMessages] = useState<BubbleMsg[]>([
    {
      id: 'greet',
      role: 'assistant',
      text: GREETING,
      quickReplies: PRIVACY_REPLIES,
    },
  ]);
  const panel = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  const hidden = pathname?.startsWith('/ar/');
  const privateMode = isPrivateShopping(prefs);

  useEffect(() => {
    const off = prefsStore.subscribe(setPrefs);
    api<{ preferences: Preferences }>('/api/profile')
      .then((d) => prefsStore.set({ ...DEFAULT_PREFS, ...d.preferences }))
      .catch(() => {});
    return off;
  }, []);

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
  }, [messages, busy, reduce]);

  if (hidden) return null;

  function push(msg: Omit<BubbleMsg, 'id'>) {
    setMessages((m) => [...m, { id: newId(), ...msg }]);
  }
  function pushUser(text: string) {
    push({ role: 'user', text });
  }
  function pushCosmo(text: string, extra: Partial<BubbleMsg> = {}) {
    push({ role: 'assistant', text, ...extra });
  }

  function ask(phaseNext: 'ask-budget' | 'ask-size' | 'ask-season') {
    if (phaseNext === 'ask-budget') {
      pushCosmo("What's your budget?", { quickReplies: BUDGET_REPLIES });
    } else if (phaseNext === 'ask-size') {
      pushCosmo("What's your size?", { quickReplies: SIZE_REPLIES });
    } else {
      pushCosmo('Last one — what’s the season?', { quickReplies: SEASON_REPLIES });
    }
    setPhase(phaseNext);
  }

  function nextIntakeQuestion(current: Intake) {
    if (current.budget === null) ask('ask-budget');
    else if (current.size === null) ask('ask-size');
    else if (current.season === null) ask('ask-season');
    else void runAgents(current);
  }

  async function runAgents(finalIntake: Intake) {
    setPhase('agents-running');
    pushCosmo('On it — running four agents in parallel now ✦', { agentRun: true });
    await new Promise((r) => setTimeout(r, LONGEST_MS));
    const { scored, relaxed } = runGatesWithFallback(finalIntake);
    const sizeChunk = finalIntake.size ? ' in size ' + finalIntake.size : '';
    if (relaxed.length === 0) {
      pushCosmo(
        `Here’s what passed the budget, category, and colour gates${sizeChunk} — ranked by fit, trend, rating, and your friends in room ${finalIntake.roomCode}. Tap a card, then ${privateMode ? 'add it to your bag.' : 'ask me to invite friends for advice.'}`,
        { results: scored },
      );
    } else if (scored.length > 0) {
      const rl = relaxed.map(labelFor).join(', ');
      pushCosmo(
        `No exact match on every gate, so I softened the ${rl} filter and kept everything inside the ${finalIntake.category ?? finalIntake.categoryGroup ?? 'catalog'} you asked for${sizeChunk}. Tap a card to keep going.`,
        { results: scored },
      );
    } else {
      const askedFor =
        finalIntake.category ??
        finalIntake.categoryGroup ??
        'that';
      pushCosmo(
        `Nothing in ${askedFor} matched your filters — I won't cross into other categories. Try a wider budget, drop the colour, or ask for a different item and I'll pull a fresh list.`,
      );
    }
    setPhase('results');
  }

  function localParse(text: string): Partial<Intake> {
    const local: Partial<Intake> = {
      colors: resolveColorFamilies(text),
      occasion: resolveOccasion(text),
      season: resolveSeason(text),
    };
    const cat = resolveCategory(text);
    if (cat.category) local.category = cat.category;
    if (cat.group) local.categoryGroup = cat.group;
    const budgetMatch = text.match(/\$(\d{2,4})|\bunder\s*\$?(\d{2,4})/i);
    if (budgetMatch) local.budget = Number(budgetMatch[1] || budgetMatch[2]);
    return local;
  }

  function hasShoppingSignal(p: Partial<Intake>): boolean {
    return !!(
      p.category ||
      p.categoryGroup ||
      (p.colors && p.colors.length > 0) ||
      p.occasion ||
      p.budget !== undefined && p.budget !== null
    );
  }

  async function parseInitial(
    text: string,
  ): Promise<{ parsed: Partial<Intake>; shoppable: boolean }> {
    const local = localParse(text);
    const localShoppable = hasShoppingSignal(local);
    try {
      const data = await api<{
        intent: Partial<Intake> & { isShoppingIntent?: boolean };
      }>('/api/cosmo', { mode: 'parse', text });
      const i = data?.intent ?? {};
      const merged: Partial<Intake> = {
        category: (i.category as string) ?? local.category ?? null,
        categoryGroup:
          (i.categoryGroup as CategoryGroup) ?? local.categoryGroup ?? null,
        colors:
          Array.isArray(i.colors) && i.colors.length > 0
            ? (i.colors as ColorFamily[])
            : local.colors ?? [],
        occasion: (i.occasion as Occasion) ?? local.occasion ?? null,
        budget:
          typeof i.budget === 'number' ? i.budget : local.budget ?? null,
        season: (i.season as Season) ?? local.season ?? null,
      };
      const modelSaysShoppable = i.isShoppingIntent !== false;
      return { parsed: merged, shoppable: localShoppable || (modelSaysShoppable && hasShoppingSignal(merged)) };
    } catch {
      return { parsed: local, shoppable: localShoppable };
    }
  }

  function interceptOnly(text: string): boolean {
    if (isHarmful(text)) {
      priorPhase.current = phase;
      pushUser(text);
      pushCosmo(
        "I'm a virtual shopping assistant. If you no longer wish to speak with me, I can refer you to a representative:",
        { phoneCard: true },
      );
      setPhase('intercept');
      return true;
    }
    if (isOutOfCatalog(text)) {
      pushUser(text);
      pushCosmo(
        "That's not something CosmicMart carries today, but here's what I can help you find:",
        { groupPicker: true },
      );
      return true;
    }
    return false;
  }

  function refuseOfftopic(text: string) {
    pushUser(text);
    const line = OFFTOPIC_REPLIES[Math.min(offtopicStreak, OFFTOPIC_REPLIES.length - 1)];
    setOfftopicStreak((s) => s + 1);
    pushCosmo(line);
  }

  async function handleFreeText(text: string) {
    if (interceptOnly(text)) return;

    if (phase === 'results' && selectedProduct) {
      if (isInviteIntent(text)) {
        pushUser(text);
        openInvitePicker(selectedProduct);
        return;
      }
      // Scripted-only in results phase — never hand freeform text to the model
      // once the customer is browsing recommendations, to keep Cosmo on-script.
      pushUser(text);
      pushCosmo(
        `Happy to help with the ${selectedProduct.product.name} — add it to your bag, pick a different card above, or ${privateMode ? 'switch to personalized mode to invite friends.' : 'say “invite my friends” for advice ✦'}`,
      );
      return;
    }

    if (phase === 'results' && !selectedProduct) {
      // No product picked yet — treat as new shopping intent or refuse.
      const { parsed, shoppable } = await parseInitial(text);
      if (!shoppable) {
        refuseOfftopic(text);
        return;
      }
      pushUser(text);
      const nextIntake: Intake = {
        ...emptyIntake(),
        ...parsed,
        colors: parsed.colors ?? [],
        roomCode: intake.roomCode,
      };
      setIntake(nextIntake);
      nextIntakeQuestion(nextIntake);
      return;
    }

    if (phase === 'invite-confirm') {
      pushUser(text);
      if (isAffirmative(text) && selectedProduct) {
        await addToBag(selectedProduct, 'Added from Cosmo after friend advice.');
      } else pushCosmo("No problem — let me know if you’d like to add it later.");
      setPhase('results');
      return;
    }

    if (phase === 'greeting' || phase === 'intake-open') {
      setBusy(true);
      const { parsed, shoppable } = await parseInitial(text);
      setBusy(false);
      if (!shoppable) {
        refuseOfftopic(text);
        return;
      }
      pushUser(text);
      const next: Intake = {
        ...intake,
        ...parsed,
        colors: parsed.colors ?? intake.colors,
      };
      setIntake(next);
      setOfftopicStreak(0);
      nextIntakeQuestion(next);
      return;
    }

    // Any other phase (asking questions, agents running, invite-picker, chatting):
    // freeform text is off-script; keep guardrail.
    refuseOfftopic(text);
  }

  async function submit(fromInput?: string) {
    const text = (fromInput ?? input).trim();
    if (!text || busy) return;
    setInput('');
    await handleFreeText(text);
  }

  function chooseQuickReply(qr: QR) {
    if (phase === 'greeting') {
      pushUser(qr.label);
      if (qr.value === 'personalized') {
        pushCosmo('Sounds good — staying in personalized mode ✦');
      } else {
        pushCosmo(
          'Opening your privacy settings now. Toggle Private shopping there and I’ll update here in real time.',
          { settingsLink: true },
        );
        setTimeout(() => router.push('/settings'), 200);
      }
      pushCosmo('Whenever you’re ready — tell me what you’re shopping for.');
      setPhase('intake-open');
      return;
    }
    if (phase === 'ask-budget') {
      pushUser(qr.label);
      const budget = qr.value === 'nolimit' ? null : Number(qr.value);
      const next: Intake = { ...intake, budget };
      setIntake(next);
      if (next.size === null) ask('ask-size');
      else if (next.season === null) ask('ask-season');
      else void runAgents(next);
      return;
    }
    if (phase === 'ask-size') {
      pushUser(qr.label);
      const next: Intake = { ...intake, size: qr.value };
      setIntake(next);
      if (next.season === null) ask('ask-season');
      else void runAgents(next);
      return;
    }
    if (phase === 'ask-season') {
      pushUser(qr.label);
      const next: Intake = { ...intake, season: qr.value };
      setIntake(next);
      void runAgents(next);
      return;
    }
    if (phase === 'invite-confirm') {
      pushUser(qr.label);
      if (qr.value === 'yes' && selectedProduct) {
        void addToBag(selectedProduct, 'Added from Cosmo after friend advice.');
      } else pushCosmo("No problem — let me know if you’d like to add it later.");
      setPhase('results');
      return;
    }
  }

  function chooseGroup(group: CategoryGroup) {
    pushUser(group);
    const next: Intake = {
      ...intake,
      category: null,
      categoryGroup: group,
      colors: [],
      occasion: null,
    };
    setIntake(next);
    pushCosmo(`Show me something from ${group} — great, let’s narrow it down.`);
    if (next.budget === null) ask('ask-budget');
    else if (next.size === null) ask('ask-size');
    else if (next.season === null) ask('ask-season');
    else void runAgents(next);
  }

  function keepShopping() {
    pushCosmo('Great — where were we?');
    setPhase(
      priorPhase.current === 'intercept' ? 'intake-open' : priorPhase.current,
    );
  }

  function selectCard(s: Scored) {
    setSelectedProduct(s);
    pushUser(`Tell me more about the ${s.product.name}.`);
    pushCosmo(
      `Great pick — the ${s.product.name} at ${money(s.product.price)}. ${privateMode ? 'Add it to your bag when you’re ready.' : 'Say “invite my friends” if you’d like second opinions, or add it to your bag.'}`,
      { cardActions: true },
    );
  }

  function openInvitePicker(s: Scored) {
    if (privateMode) {
      pushCosmo(
        'Sharing and friend invites are off in private shopping. If you’d like to share, turn on personalized mode from your settings.',
        { settingsLink: true },
      );
      return;
    }
    setSelectedProduct(s);
    setPickedFriends([]);
    pushCosmo(`Great choice on the ${s.product.name} ✦ Who’s around to weigh in?`, {
      friendPicker: true,
    });
    setPhase('invite-picker');
  }

  async function inviteFriends() {
    const picked = pickedFriends;
    if (picked.length === 0 || !selectedProduct) return;
    setPhase('invite-chatting');
    const names =
      picked.length === 1
        ? picked[0]
        : `${picked.slice(0, -1).join(', ')} and ${picked[picked.length - 1]}`;
    pushCosmo(`${names} joined the call ✦`);
    for (let i = 0; i < picked.length; i++) {
      await new Promise((r) => setTimeout(r, 500 + i * 700));
      const name = picked[i];
      push({ role: 'assistant', text: `${name}: ${friendLine(name)}` });
    }
    await new Promise((r) => setTimeout(r, 500));
    pushCosmo('Your friends love it — would you like to add it to cart?', {
      quickReplies: [
        { label: 'Yes, add to cart', value: 'yes' },
        { label: 'Not right now', value: 'no' },
      ],
    });
    setPhase('invite-confirm');
  }

  async function addToBag(s: Scored, note?: string) {
    const p = s.product;
    if (p.stock <= 0) {
      pushCosmo(`The ${p.name} is out of stock right now — sorry about that.`);
      return;
    }
    const size =
      p.category === 'fashion' ? intake.size ?? 'M' : 'One size';
    try {
      await api('/api/cart', {
        action: 'add',
        productId: p.id,
        color: p.color,
        size,
        rationale: note ?? 'Added from Cosmo chat.',
      });
      pushCosmo(
        `Added the ${p.name} (${p.color}${p.category === 'fashion' ? `, size ${size}` : ''}) to your bag ✦ Open your bag to check out.`,
        { cardActions: false },
      );
    } catch (e) {
      pushCosmo(
        `I couldn't add that to your bag: ${(e as Error).message}. Please try again from the product page.`,
      );
    }
  }

  function toggleFriend(name: string) {
    setPickedFriends((cur) =>
      cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name],
    );
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
                <span>
                  {privateMode ? (
                    <>
                      <Lock size={11} /> Private shopping · Room {intake.roomCode}
                    </>
                  ) : (
                    <>Personalized · Room {intake.roomCode}</>
                  )}
                </span>
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
                  {m.text && (
                    <Bubble
                      variant={m.role === 'user' ? 'default' : 'muted'}
                      align={m.role === 'user' ? 'end' : 'start'}
                    >
                      <BubbleContent>{m.text}</BubbleContent>
                    </Bubble>
                  )}
                  {m.agentRun && <AgentRunAnimation />}
                  {m.phoneCard && (
                    <div className="cosmo-phone-card">
                      <Phone size={14} /> (123) 123-1234
                      <button
                        className="cosmo-chip"
                        type="button"
                        onClick={keepShopping}
                      >
                        Let&rsquo;s keep shopping
                      </button>
                    </div>
                  )}
                  {m.settingsLink && (
                    <div className="cosmo-chip-row">
                      <a className="cosmo-chip" href="/settings">
                        <SettingsIcon size={12} /> Open privacy settings
                      </a>
                    </div>
                  )}
                  {m.groupPicker && (
                    <div className="cosmo-chip-row">
                      {GROUP_REPLIES.map((g) => (
                        <button
                          key={g.value}
                          className="cosmo-chip"
                          type="button"
                          onClick={() => chooseGroup(g.value as CategoryGroup)}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.quickReplies && (
                    <div className="cosmo-chip-row">
                      {m.quickReplies.map((qr) => (
                        <button
                          key={qr.value}
                          className="cosmo-chip"
                          type="button"
                          onClick={() => chooseQuickReply(qr)}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.friendPicker && (
                    <FriendPicker
                      roster={FRIEND_ROSTER}
                      picked={pickedFriends}
                      onToggle={toggleFriend}
                      onSubmit={inviteFriends}
                    />
                  )}
                  {m.results && m.results.length > 0 && (
                    <div className="agent-recs">
                      {m.results.map((s) => (
                        <ResultCard
                          key={s.product.id}
                          scored={s}
                          privateMode={privateMode}
                          onSelect={() => selectCard(s)}
                          onInvite={() => openInvitePicker(s)}
                          onAdd={() => void addToBag(s)}
                        />
                      ))}
                    </div>
                  )}
                  {m.cardActions && selectedProduct && (
                    <div className="cosmo-chip-row">
                      <button
                        className="cosmo-chip primary"
                        type="button"
                        disabled={selectedProduct.product.stock <= 0}
                        onClick={() => void addToBag(selectedProduct)}
                      >
                        Add to bag
                      </button>
                      {!privateMode && (
                        <button
                          className="cosmo-chip"
                          type="button"
                          onClick={() => openInvitePicker(selectedProduct)}
                        >
                          <Users size={12} /> Invite friends
                        </button>
                      )}
                      <a
                        className="cosmo-chip"
                        href={'/product/' + selectedProduct.product.id}
                      >
                        <ArrowUpRight size={12} /> View product
                      </a>
                    </div>
                  )}
                </BubbleGroup>
              ))}
              {busy && (
                <BubbleGroup>
                  <Bubble variant="muted" align="start">
                    <BubbleContent>
                      <span className="agent-typing" aria-label="Cosmo thinking">
                        <i /><i /><i />
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
                placeholder="Type a message…"
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
              />
              <button aria-label="Send" disabled={busy || !input.trim()}>
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

function AgentRunAnimation() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let acc = 0;
    AGENTS.forEach((a, i) => {
      acc += a.ms;
      setTimeout(() => {
        if (!cancelled) setStage(i + 1);
      }, acc);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="cosmo-agent-run">
      <strong>Running your search across 4 agents…</strong>
      <ul className="agent-progress">
        {AGENTS.map((a, i) => (
          <li
            key={a.key}
            className={i < stage ? 'done' : i === stage ? 'active' : ''}
          >
            {i < stage ? <Check size={12} /> : <span className="agent-progress-dot" />}
            {a.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({
  scored,
  privateMode,
  onSelect,
  onInvite,
  onAdd,
}: {
  scored: Scored;
  privateMode: boolean;
  onSelect: () => void;
  onInvite: () => void;
  onAdd: () => void;
}) {
  const p = scored.product;
  const badges: string[] = [];
  if (scored.topPick) badges.push('★ Top pick');
  if (p.popularity >= 85) badges.push('Selling fast');
  if (p.stock <= 0) badges.push('Out of stock');
  else badges.push(`Ships in ${p.shipsInDays}d`);
  const upNames = scored.friendVotes.up;
  const friendLineText = privateMode
    ? 'Friend votes hidden in private shopping'
    : upNames.length === 0
      ? 'No friend votes yet'
      : upNames.length <= 2
        ? `Liked by ${upNames.join(' and ')}`
        : `${upNames.length}/${scored.friendVotes.total} friends voted up`;
  return (
    <div className="cosmo-result-card">
      <button type="button" className="cosmo-result-tap" onClick={onSelect}>
        <span className="cosmo-emoji" aria-hidden>
          {p.emoji}
        </span>
        <div className="cosmo-result-body">
          <strong>{p.name}</strong>
          <span className="cosmo-price">{money(p.price)}</span>
          <div className="cosmo-badges">
            {badges.map((b) => (
              <span key={b} className={'cosmo-badge' + (b === '★ Top pick' ? ' top' : '')}>
                {b}
              </span>
            ))}
          </div>
          <div className="cosmo-friend-line">
            {friendLineText} · trend {scored.trendScore} · ★ {p.rating.toFixed(1)}
          </div>
        </div>
      </button>
      <div className="cosmo-chip-row">
        {!privateMode && (
          <button className="cosmo-chip" type="button" onClick={onInvite}>
            <Users size={12} /> Invite friends
          </button>
        )}
        <button
          className="cosmo-chip primary"
          type="button"
          disabled={p.stock <= 0}
          onClick={onAdd}
        >
          {p.stock <= 0 ? 'Out of stock' : 'Add to bag'}
        </button>
      </div>
    </div>
  );
}

function FriendPicker({
  roster,
  picked,
  onToggle,
  onSubmit,
}: {
  roster: Friend[];
  picked: string[];
  onToggle: (name: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="cosmo-friend-picker">
      <strong>Who&rsquo;s active right now?</strong>
      <ul>
        {roster.map((f) => (
          <li key={f.name} className={f.active ? '' : 'offline'}>
            <label>
              <input
                type="checkbox"
                disabled={!f.active}
                checked={picked.includes(f.name)}
                onChange={() => onToggle(f.name)}
              />
              {f.name}
              {!f.active && <span> · offline</span>}
            </label>
          </li>
        ))}
      </ul>
      <button
        className="cosmo-chip primary"
        type="button"
        disabled={picked.length === 0}
        onClick={onSubmit}
      >
        Invite {picked.length || ''} friend{picked.length === 1 ? '' : 's'}
      </button>
    </div>
  );
}
