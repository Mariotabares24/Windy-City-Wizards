'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Check,
  ChevronDown,
  GitCompareArrows,
  MapPin,
  Search,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { Header, Footer } from './brand';
import { ProductCard, CompareDialog } from './commerce';
import { ProductCoverflow } from './product-coverflow';
import { CirclePanel, useCircle } from './circle-panel';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  products,
  productById,
  categoryLabel,
  type Category,
  type Product,
} from '@/lib/catalog';
import { api } from '@/lib/client';
import { inferIntent, orchestrate } from '@/lib/agents';
import type { ShoppingResult, Preferences } from '@/lib/contracts';
export function Shop({ demo = false }: { demo?: boolean }) {
  const query = useSearchParams();
  const initialIntent = query.get('intent') || '';
  const initialCategory = (
    ['fashion', 'home', 'gadgets'].includes(query.get('category') || '')
      ? query.get('category')
      : 'fashion'
  ) as Category;
  const inferred = inferIntent(initialIntent, initialCategory);
  const [intent, setIntent] = useState(
    demo ? 'An outfit for a fall wedding under $200' : initialIntent,
  );
  const [category, setCategory] = useState<Category>(inferred.category);
  const [budget, setBudget] = useState(inferred.budget || 200);
  const [formality, setFormality] = useState<
    'casual' | 'semi-formal' | 'formal' | 'black tie'
  >(inferred.formality || 'semi-formal');
  const [style, setStyle] = useState<'familiar' | 'explore'>('familiar');
  const [result, setResult] = useState<ShoppingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [compare, setCompare] = useState(false);
  const [circleId, setCircleId] = useState<string | null>(query.get('party'));
  const [showEvidence, setShowEvidence] = useState(false);
  const [search, setSearch] = useState('');
  const [prefs, setPrefs] = useState<Preferences>({
    name: 'Mario',
    mode: 'solo',
    history: false,
    location: 'Chicago',
    colors: [],
  });
  const { circle, error: circleError, act } = useCircle(circleId);
  const ready = useRef(false);
  const restored = useRef<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [circleSetup, setCircleSetup] = useState(query.get('circle') === '1');
  useEffect(() => {
    api<{ preferences: Preferences }>('/api/profile')
      .then((d) => setPrefs(d.preferences))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (circle && restored.current !== circle.id) {
      restored.current = circle.id;
      sessionStorage.setItem('cosmic-active-circle', circle.id);
      queueMicrotask(() => {
        setIntent(circle.goal);
        if (circle.constraints.budget) setBudget(circle.constraints.budget);
        if (circle.constraints.category)
          setCategory(circle.constraints.category);
        if (circle.constraints.formality)
          setFormality(circle.constraints.formality);
      });
    }
  }, [circle]);
  const recommend = useCallback(async () => {
    if (!intent.trim()) {
      setError('Tell us a little about what you’re looking for.');
      return;
    }
    setLoading(true);
    setError('');
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, 4)), 350);
    const request = {
      intent,
      category,
      budget,
      formality,
      style,
      location: prefs.location,
      colors: prefs.mode === 'personalized' ? prefs.colors : [],
      votes: circle?.votes || {},
      demo,
    };
    try {
      let data: ShoppingResult;
      try {
        [data] = await Promise.all([
          api<ShoppingResult>('/api/concierge', request),
          new Promise((r) => setTimeout(r, 1500)),
        ]);
      } catch {
        data = await orchestrate(request);
        setError(
          'Connection interrupted. Your shortlist is available from the on-device sample catalog.',
        );
      }
      setCategory(data.constraints.category);
      setBudget(data.constraints.budget);
      setResult(data);
      setSelected([]);
      if (circle?.host && data.recommendations.length)
        await act({
          action: 'sync',
          productIds: data.recommendations.map((r) => r.productId),
          constraints: { budget, category, formality },
        });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }, [intent, category, budget, formality, style, prefs, circle, demo, act]);
  useEffect(() => {
    if ((demo || initialIntent.trim()) && !ready.current) {
      ready.current = true;
      queueMicrotask(() => void recommend());
    }
  }, [demo, initialIntent, recommend]);
  const cards = result
    ? result.recommendations
        .map((r) => productById(r.productId))
        .filter((p) => !!p)
    : circle
      ? circle.productIds
          .map(productById)
          .filter(
            (p): p is Product => !!p && p.category === category && !p.retired,
          )
      : products.filter(
          (p) =>
            p.category === category &&
            (!search ||
              [p.name, p.description, p.color]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())),
        );
  async function createCircle() {
    setCreating(true);
    try {
      const shortlist =
        result?.recommendations.map((r) => r.productId) ||
        cards.slice(0, 3).map((p) => p.id);
      const picked = productById(query.get('pick') || '');
      const ids = picked
        ? [picked.id, ...shortlist.filter((id) => id !== picked.id)].slice(0, 3)
        : shortlist;
      if (!ids.length)
        throw new Error('Find a shortlist before inviting your friends.');
      const { id } = await api<{ id: string }>('/api/circles', {
        goal:
          intent ||
          'Let’s find something ' +
            (category === 'home'
              ? 'for home'
              : category === 'fashion'
                ? 'to wear'
                : 'to listen to'),
        name: prefs.name,
        productIds: ids,
        constraints: { budget, category, formality },
      });
      setCircleId(id);
      setCircleSetup(false);
      sessionStorage.setItem('cosmic-active-circle', id);
      window.history.replaceState(null, '', '/shop?party=' + id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }
  function toggle(id: string) {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else if (selected.length < 3) setSelected([...selected, id]);
    else setError('Compare up to three products at a time.');
  }
  // Mirrors the agents Cosmo actually fans out to, so the progress list names
  // the real work rather than generic phases.
  const steps = [
    'Recommendation agent',
    'Trend agent',
    'Localization agent',
    'Stylist agent',
    'Stock & budget checks',
  ];
  return (
    <>
      <Header active="shop" />
      <main className="shop-page">
        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              {demo
                ? 'YOUR THREE-MINUTE WALKTHROUGH'
                : 'YOUR TASTE. YOUR PEOPLE.'}
            </div>
            <h1>
              {result
                ? 'A few finds. A lot of possibility.'
                : 'Let’s find your kind of perfect.'}
            </h1>
            <p>
              {demo
                ? 'Find a wedding look → Invite Kass → Vote → Preview → Review your bag'
                : 'Start with a little inspiration. We’ll take it from there.'}
            </p>
          </div>
          <button
            className="button"
            onClick={() => setCircleSetup(true)}
            disabled={creating || !!circleId}
          >
            <UsersRound size={17} />
            {circleId
              ? 'Circle is open'
              : creating
                ? 'Opening…'
                : 'Invite a friend'}
          </button>
        </div>
        <div className={'shopping-layout ' + (circleId ? 'with-circle' : '')}>
          <div className="shopping-main">
            <section className="concierge">
              <div className="concierge-label">
                <span className="mini-spark">
                  <Sparkles size={18} />
                </span>
                <div>
                  <strong>Cosmo</strong>
                  <span>
                    {prefs.mode === 'solo'
                      ? 'Just this session. Just for you.'
                      : 'Using only the preferences you chose.'}
                  </span>
                </div>
                <span className="catalog-mode">Catalog guidance</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void recommend();
                }}
              >
                <div className="goal-input">
                  <input
                    aria-label="Shopping goal"
                    placeholder="I need an outfit for a fall wedding…"
                    value={intent}
                    onChange={(e) => {
                      setIntent(e.target.value);
                      const parsed = inferIntent(e.target.value, category);
                      setCategory(parsed.category);
                      if (parsed.budget !== undefined) setBudget(parsed.budget);
                      if (parsed.formality) setFormality(parsed.formality);
                    }}
                    maxLength={1000}
                  />
                  <button className="button primary" disabled={loading}>
                    {loading ? (
                      'Finding your favorites…'
                    ) : (
                      <>
                        <span>Find my favorites</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
                <div className="constraint-row">
                  <label>
                    Budget up to
                    <span className="currency-input">
                      $
                      <input
                        type="number"
                        aria-label="Maximum budget"
                        min={1}
                        max={10000}
                        required
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                      />
                    </span>
                  </label>
                  {category === 'fashion' && (
                    <label>
                      Occasion
                      <select
                        aria-label="Occasion formality"
                        value={formality}
                        onChange={(e) =>
                          setFormality(e.target.value as typeof formality)
                        }
                      >
                        <option value="semi-formal">Semi-formal</option>
                        <option value="formal">Formal</option>
                        <option value="black tie">Black tie</option>
                        <option value="casual">Casual</option>
                      </select>
                    </label>
                  )}
                  <label>
                    Your direction
                    <select
                      aria-label="Style direction"
                      value={style}
                      onChange={(e) => setStyle(e.target.value as typeof style)}
                    >
                      <option value="familiar">Stay close to my style</option>
                      <option value="explore">Try something different</option>
                    </select>
                  </label>
                  <span className="location">
                    <MapPin size={14} />
                    {prefs.location}
                    <a href="/settings">Edit</a>
                  </span>
                </div>
              </form>
              {loading && (
                <div className="research-progress" aria-live="polite">
                  {steps.map((s, i) => (
                    <span className={i <= stage ? 'done' : ''} key={s}>
                      {i < stage ? (
                        <Check size={14} />
                      ) : (
                        <span className="progress-dot" />
                      )}
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {result && !loading && (
                <div className="concierge-result">
                  <p>{result.summary}</p>
                  <button
                    className="text-button"
                    onClick={() => setShowEvidence(!showEvidence)}
                    aria-expanded={showEvidence}
                  >
                    How these were selected <ChevronDown size={14} />
                  </button>
                  {showEvidence && (
                    <ol className="evidence-list">
                      {result.steps.map((s) => {
                        const timing = result.timings?.find(
                          (t) => t.label === s.label,
                        );
                        return (
                          <li key={s.agent}>
                            <strong>
                              {s.agent}
                              {timing ? (
                                <em className="agent-timing">{timing.ms}ms</em>
                              ) : null}
                            </strong>
                            <span>{s.evidence}</span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              )}
            </section>
            {error && <output className="notice">{error}</output>}
            <div className="collection-toolbar">
              <fieldset className="category-tabs" aria-label="Product category">
                {(['fashion', 'home', 'gadgets'] as Category[]).map((c) => (
                  <button
                    className={c === category ? 'active' : ''}
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setResult(null);
                      setSearch('');
                      setSelected([]);
                      setIntent(
                        c === 'home'
                          ? 'A warm floor lamp for my reading corner'
                          : c === 'gadgets'
                            ? 'Comfortable headphones for everyday listening'
                            : 'An outfit for a fall wedding',
                      );
                    }}
                  >
                    {categoryLabel[c]}
                  </button>
                ))}
              </fieldset>
              {result ? (
                <button className="text-button" onClick={() => setResult(null)}>
                  Browse the collection
                </button>
              ) : (
                <label className="catalog-search">
                  <Search size={15} />
                  <input
                    aria-label="Search collection"
                    placeholder="Search finds"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              )}
            </div>
            <div className="results-label">
              <span>
                {result
                  ? 'CURATED FOR YOUR MOMENT'
                  : 'THE CONSIDERED COLLECTION'}
              </span>
              <span>
                {cards.length} {cards.length === 1 ? 'find' : 'finds'} · Sample
                catalog
              </span>
            </div>
            <ProductCoverflow
              key={category + cards.map((p) => p.id).join()}
              products={cards}
              category={category}
              renderDetail={(p, i) => (
                <ProductCard
                  key={p.id}
                  compact
                  product={p}
                  rank={result ? i : undefined}
                  recommendation={result?.recommendations.find(
                    (r) => r.productId === p.id,
                  )}
                  selected={selected.includes(p.id)}
                  onCompare={toggle}
                  votes={circle?.votes[p.id] || 0}
                  voted={circle?.myVotes.includes(p.id)}
                  onVote={
                    circle
                      ? async (id) => {
                          try {
                            await act({
                              action: 'vote',
                              productId: id,
                              selected: !circle.myVotes.includes(id),
                            });
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }
                      : undefined
                  }
                />
              )}
            />
            {cards.length === 0 && (
              <div className="empty-state">
                <Search size={30} />
                <h2>No perfect match yet.</h2>
                <p>
                  Try a broader search, a different occasion, or a little more
                  room in your budget.
                </p>
                <button
                  className="button"
                  onClick={() => {
                    setSearch('');
                    setBudget(300);
                    setResult(null);
                  }}
                >
                  Explore the collection
                </button>
              </div>
            )}
            {result && (
              <p className="fine-print">
                *Match scores come from transparent catalog rules and your
                selected preferences. This deployment uses deterministic
                guidance; it does not call a live language model.
              </p>
            )}
            {circle?.host && (
              <button
                className="button primary"
                disabled={loading}
                onClick={recommend}
              >
                <Sparkles size={16} /> Refine with the circle’s votes
              </button>
            )}
          </div>
          {circleId && (
            <CirclePanel
              circle={circle}
              error={circleError}
              onAction={act}
              onEnd={() => {
                setCircleId(null);
                window.history.replaceState(null, '', '/shop');
              }}
            />
          )}
        </div>
        {selected.length > 0 && (
          <div className="compare-dock">
            <span>{selected.length} / 3 selected</span>
            <button
              className="button primary small"
              disabled={selected.length < 2}
              onClick={() => setCompare(true)}
            >
              <GitCompareArrows size={16} /> Compare finds
            </button>
            <button
              className="icon-button"
              aria-label="Clear comparison"
              onClick={() => setSelected([])}
            >
              <X size={17} />
            </button>
          </div>
        )}
        <CompareDialog
          ids={selected}
          open={compare}
          onClose={() => setCompare(false)}
        />
        <Dialog open={circleSetup} onOpenChange={setCircleSetup}>
          <DialogContent className="cosmic-modal">
            <DialogTitle>Start your shopping circle</DialogTitle>
            <DialogDescription>
              Give your friends a shared shortlist. Create a circle, then copy
              its invitation link to bring them in.
            </DialogDescription>
            <form
              className="circle-setup"
              onSubmit={(event) => {
                event.preventDefault();
                void createCircle();
              }}
            >
              <label htmlFor="circle-goal">What are you shopping for?</label>
              <input
                id="circle-goal"
                value={intent}
                maxLength={1000}
                placeholder="An outfit for a fall wedding"
                onChange={(event) => setIntent(event.target.value)}
              />
              <p>
                {Math.min(3, cards.length)} finds from your current collection
                will start the conversation.
              </p>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              <button
                className="button primary full"
                disabled={creating || cards.length === 0}
              >
                <UsersRound size={17} />{' '}
                {creating
                  ? 'Opening your circle…'
                  : 'Create circle & get invite link'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
}
