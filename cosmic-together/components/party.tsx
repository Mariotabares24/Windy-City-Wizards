'use client';
import { useEffect, useState } from 'react';
import { Sparkles, UsersRound } from 'lucide-react';
import { Header, Footer } from './brand';
import { CirclePanel, useCircle } from './circle-panel';
import { ProductCard, CompareDialog } from './commerce';
import { api, circlePath } from '@/lib/client';
import { productById } from '@/lib/catalog';
export function Party({ id }: { id: string }) {
  const { circle, error, act, refresh } = useCircle(id);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [compare, setCompare] = useState(false);
  useEffect(() => {
    api<{ goal: string }>(circlePath(id))
      .then((d) => setGoal(d.goal))
      .catch((e) => setLocalError(e.message));
  }, [id]);
  async function join() {
    setBusy(true);
    try {
      await api(circlePath(id), { action: 'join', name });
      sessionStorage.setItem('cosmic-active-circle', id);
      await refresh();
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="shop-page">
        {!circle ? (
          <div className="join-card">
            <div className="orb-icon">
              <UsersRound size={32} />
            </div>
            <div className="eyebrow">YOUR OPINION IS INVITED</div>
            <h1>Good finds need good company.</h1>
            <p>
              {goal || 'Join a friend’s shopping circle and help find the one.'}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void join();
              }}
            >
              <label>
                Your first name
                <input
                  aria-label="Your first name"
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                />
              </label>
              <button
                className="button primary full"
                disabled={busy || !name.trim()}
              >
                {busy ? 'Joining…' : 'Join the circle'}
              </button>
            </form>
            <p className="fine-print">
              No account needed. You’ll see this circle’s products,
              conversation, and votes. Private profiles stay private.
            </p>
            {(localError || error) && (
              <p className="error-text" role="alert">
                {localError || error}
              </p>
            )}
            <a className="text-button" href="/shop">
              Shop on my own →
            </a>
          </div>
        ) : (
          <>
            <div className="shop-heading">
              <div>
                <div className="eyebrow">BETTER WITH A SECOND OPINION</div>
                <h1>You’ve got good company.</h1>
                <p>{circle.goal}</p>
              </div>
              {circle.host && (
                <a className="button" href={'/shop?party=' + id}>
                  <Sparkles size={15} /> Refine this shortlist
                </a>
              )}
            </div>
            <div className="shopping-layout with-circle">
              <div>
                <div className="results-label">
                  <span>YOUR SHARED SHORTLIST</span>
                  <span>Vote for your favorites</span>
                </div>
                <div className="products-grid">
                  {circle.productIds.map((pid, i) => {
                    const p = productById(pid);
                    return p ? (
                      <ProductCard
                        key={pid}
                        product={p}
                        rank={i}
                        selected={selected.includes(pid)}
                        onCompare={(id) => {
                          if (selected.includes(id))
                            setSelected(selected.filter((x) => x !== id));
                          else if (selected.length < 3)
                            setSelected([...selected, id]);
                          else
                            setLocalError(
                              'Compare up to three products at a time.',
                            );
                        }}
                        votes={circle.votes[pid]}
                        voted={circle.myVotes.includes(pid)}
                        onVote={async (id) => {
                          try {
                            await act({
                              action: 'vote',
                              productId: id,
                              selected: !circle.myVotes.includes(id),
                            });
                          } catch (e) {
                            setLocalError((e as Error).message);
                          }
                        }}
                      />
                    ) : null;
                  })}
                </div>
                {selected.length > 1 && (
                  <button className="button" onClick={() => setCompare(true)}>
                    Compare selected finds
                  </button>
                )}
                {localError && (
                  <p role="alert" className="error-text">
                    {localError}
                  </p>
                )}
              </div>
              <CirclePanel
                circle={circle}
                error={error}
                onAction={act}
                onEnd={() => {
                  window.location.href = '/shop';
                }}
              />
            </div>
          </>
        )}
        <CompareDialog
          ids={selected}
          open={compare}
          onClose={() => setCompare(false)}
        />
      </main>
      <Footer />
    </>
  );
}
