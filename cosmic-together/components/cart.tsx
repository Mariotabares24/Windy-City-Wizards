'use client';
import { Photo } from '@/components/photo';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { Header, Footer } from './brand';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/lib/client';
import { productById, money } from '@/lib/catalog';
import type { CartItem } from '@/lib/contracts';
export function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [version, setVersion] = useState(0);
  async function refresh() {
    try {
      const d = await api<{ items: CartItem[]; version: number }>('/api/cart');
      setItems(d.items);
      setVersion(d.version);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, []);
  async function mutate(body: unknown) {
    setBusy(true);
    try {
      await api('/api/cart', body);
      await refresh();
      setReview(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const total = items.reduce(
    (n, i) => n + (productById(i.productId)?.price || 0) * i.quantity,
    0,
  );
  const unavailable = items.some((i) => !productById(i.productId)?.stock);
  const confirmed =
    !unavailable && items.length > 0 && items.every((i) => i.confirmed);
  return (
    <>
      <Header />
      <main className="cart-page">
        <a className="text-button" href="/shop">
          <ArrowLeft size={15} /> Keep exploring
        </a>
        <div className="shop-heading">
          <div>
            <div className="eyebrow">GOOD CHOICES LOOK GOOD ON YOU</div>
            <h1>
              {confirmed
                ? 'Consider it decided.'
                : 'Your bag. Your good finds.'}
            </h1>
            <p>
              {confirmed
                ? 'Your prototype selection is saved. No order was placed and no payment was collected.'
                : 'One last look before you make the call.'}
            </p>
          </div>
          <ShoppingBag size={32} />
        </div>
        {error && (
          <p role="alert" className="notice">
            {error}{' '}
            <button className="text-button" onClick={refresh}>
              Retry
            </button>
          </p>
        )}
        {loading ? (
          <p className="page-loading">Opening your bag…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={38} />
            <h2>A little room for something good.</h2>
            <p>
              Explore the collection or let your concierge find a few favorites.
            </p>
            <a className="button primary" href="/shop">
              Find my next favorite <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              {items.map((item) => {
                const p = productById(item.productId);
                if (!p)
                  return (
                    <article key={item.id} className="cart-item">
                      <div>
                        <h2>Unavailable item</h2>
                        <p>This item is no longer in the collection.</p>
                        <button
                          className="button"
                          disabled={busy}
                          onClick={() =>
                            mutate({
                              action: 'quantity',
                              id: item.id,
                              quantity: 0,
                            })
                          }
                        >
                          Remove unavailable item
                        </button>
                      </div>
                    </article>
                  );
                return (
                  <article key={item.id} className="cart-item">
                    <a href={'/product/' + p.id}>
                      <Photo src={p.image} alt={p.name} />
                    </a>
                    <div>
                      <h2>{p.name}</h2>
                      <p>
                        {item.color} · {item.size}
                      </p>
                      <span className={p.stock ? 'stock' : 'out-stock'}>
                        {p.stock
                          ? 'Sample inventory available'
                          : 'Retired from the collection · remove to continue'}
                      </span>
                      <p className="cart-rationale">{item.rationale}</p>
                      <div className="quantity">
                        <button
                          aria-label={'Decrease quantity of ' + p.name}
                          disabled={busy}
                          onClick={() =>
                            mutate({
                              action: 'quantity',
                              id: item.id,
                              quantity: item.quantity - 1,
                            })
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span aria-label="Quantity">{item.quantity}</span>
                        <button
                          aria-label={'Increase quantity of ' + p.name}
                          disabled={
                            busy || item.quantity >= Math.min(10, p.stock)
                          }
                          onClick={() =>
                            mutate({
                              action: 'quantity',
                              id: item.id,
                              quantity: item.quantity + 1,
                            })
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="cart-price">
                      <strong>{money(p.price * item.quantity)}</strong>
                      <button
                        className="icon-button"
                        aria-label={'Remove ' + p.name}
                        disabled={busy}
                        onClick={() =>
                          mutate({
                            action: 'quantity',
                            id: item.id,
                            quantity: 0,
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <aside className="order-summary">
              <h2>{confirmed ? 'Selection saved' : 'The little details'}</h2>
              <div>
                <span>Subtotal</span>
                <strong>{money(total)}</strong>
              </div>
              <div>
                <span>Shipping & tax</span>
                <span>Not charged</span>
              </div>
              <hr />
              <div>
                <strong>Sample total</strong>
                <strong>{money(total)}</strong>
              </div>
              {confirmed ? (
                <p className="confirmation">
                  <CheckCircle2 size={26} /> Your selection is confirmed.
                </p>
              ) : (
                <button
                  className="button primary full"
                  onClick={() => setReview(true)}
                  disabled={busy || unavailable}
                >
                  Review purchase <ArrowRight size={17} />
                </button>
              )}
              {unavailable && (
                <p role="alert" className="notice">
                  Remove unavailable items before confirming.
                </p>
              )}
              <p className="fine-print">
                This is a prototype. Confirming saves your selection; it does
                not place an order, reserve inventory, or charge a payment
                method.
              </p>
            </aside>
          </div>
        )}
        <Dialog open={review} onOpenChange={setReview}>
          <DialogContent className="cosmic-modal">
            <DialogTitle>Your choice, ready to confirm.</DialogTitle>
            <DialogDescription>
              Review these sample items. Confirming saves your selection without
              placing a real order.
            </DialogDescription>
            <div className="review-items">
              {items.map((i) => (
                <p key={i.id}>
                  <span>
                    {productById(i.productId)?.name} × {i.quantity}
                  </span>
                  <strong>
                    {money((productById(i.productId)?.price || 0) * i.quantity)}
                  </strong>
                </p>
              ))}
            </div>
            <strong className="review-total">
              Sample total {money(total)}
            </strong>
            <button
              className="button primary full"
              disabled={busy}
              onClick={() => mutate({ action: 'confirm', version })}
            >
              {busy ? (
                'Saving…'
              ) : (
                <>
                  <Check size={17} /> Confirm selection
                </>
              )}
            </button>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
}
