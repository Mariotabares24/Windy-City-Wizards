'use client';
import { Photo } from '@/components/photo';
import { useState } from 'react';
import {
  ArrowRight,
  Box,
  Check,
  Heart,
  MapPin,
  Plus,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { productById, money, colorHex, type Product } from '@/lib/catalog';
import { api } from '@/lib/client';
import type { ShoppingResult } from '@/lib/contracts';
export function ProductCard({
  product: p,
  recommendation: r,
  selected,
  onCompare,
  votes = 0,
  voted = false,
  onVote,
  rank,
  compact = false,
}: {
  product: Product;
  recommendation?: ShoppingResult['recommendations'][number];
  selected?: boolean;
  onCompare?: (id: string) => void;
  votes?: number;
  voted?: boolean;
  onVote?: (id: string) => void;
  rank?: number;
  compact?: boolean;
}) {
  return (
    <article
      className={
        'product-card ' +
        (selected ? 'selected ' : '') +
        (compact ? 'compact-product' : '')
      }
    >
      <div className="product-visual">
        {!compact && (
          <a href={'/product/' + p.id}>
            <Photo
              src={p.image}
              alt={`${p.name} — illustrative ${p.category} photography`}
              loading="lazy"
              width={600}
              height={700}
            />
          </a>
        )}
        {rank === 0 && (
          <span className="top-pick">
            <Sparkles size={13} /> Your starting point
          </span>
        )}
        {onVote ? (
          <button
            className={'favorite ' + (voted ? 'voted' : '')}
            aria-label={(voted ? 'Remove vote for ' : 'Vote for ') + p.name}
            aria-pressed={voted}
            onClick={() => onVote?.(p.id)}
            title="Vote for this find"
          >
            <Heart size={18} fill={voted ? 'currentColor' : 'none'} />
            {votes > 0 && <span>{votes}</span>}
          </button>
        ) : (
          <a
            className="favorite"
            href={'/shop?circle=1&category=' + p.category + '&pick=' + p.id}
            aria-label={'Start a circle to vote for ' + p.name}
            title="Start a circle to vote"
          >
            <Heart size={18} />
          </a>
        )}
        <a className="try-link" href={'/ar/' + p.category + '/' + p.id}>
          <Box size={15} />
          {p.ar ? 'Try it in your world' : 'View product preview'}
          <ArrowRight size={14} />
        </a>
      </div>
      <div className="product-content">
        <div className="product-topline">
          <span>
            {p.color} / {p.material}
          </span>
          {r && <span className="match">{r.score}% match*</span>}
        </div>
        <div className="product-title">
          <a href={'/product/' + p.id}>
            <h3>{p.name}</h3>
          </a>
          <strong>{money(p.price)}</strong>
        </div>
        <p>{r ? r.reasons[1] : p.description}</p>
        <div className="product-tags">
          {(r ? r.reasons.slice(0, 2) : p.tags).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="product-bottom">
          <span className={p.stock ? 'stock' : 'out-stock'}>
            <MapPin size={12} />
            {p.stock ? 'Sample stock available' : 'Currently unavailable'}
          </span>
          {onCompare && (
            <button
              className="text-button"
              onClick={() => onCompare(p.id)}
              aria-pressed={selected}
            >
              {selected ? <Check size={14} /> : <Plus size={14} />} Compare
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
export function CompareDialog({
  ids,
  open,
  onClose,
}: {
  ids: string[];
  open: boolean;
  onClose: () => void;
}) {
  const ps = ids.map(productById).filter((p): p is Product => !!p);
  const keys = Array.from(new Set(ps.flatMap((p) => Object.keys(p.specs))));
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="cosmic-modal compare-modal">
        <DialogTitle>Look a little closer.</DialogTitle>
        <DialogDescription>
          Compare the differences that matter. All details are sample catalog
          data.
        </DialogDescription>
        <div className="compare-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">The details</th>
                {ps.map((p) => (
                  <th scope="col" key={p.id}>
                    <Photo src={p.image} alt={p.name} />
                    <a href={'/product/' + p.id}>{p.name}</a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Price</th>
                {ps.map((p) => (
                  <td key={p.id}>{money(p.price)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Color</th>
                {ps.map((p) => (
                  <td key={p.id}>{p.color}</td>
                ))}
              </tr>
              {keys.map((k) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  {ps.map((p) => (
                    <td key={p.id}>{p.specs[k] || '—'}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Availability</th>
                {ps.map((p) => (
                  <td key={p.id}>
                    {p.stock ? 'In sample stock' : 'Unavailable'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function AddToBag({
  product: p,
  selectedColor,
  onColorChange,
  rationale = 'Selected by you after reviewing the product.',
}: {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  rationale?: string;
}) {
  const [localColor, setColor] = useState(p.color);
  const color = selectedColor ?? localColor;
  const [size, setSize] = useState('M');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  async function add() {
    setBusy(true);
    setError('');
    try {
      await api('/api/cart', {
        action: 'add',
        productId: p.id,
        color,
        size: p.category === 'fashion' ? size : 'One size',
        rationale,
      });
      setAdded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="add-to-bag">
      <div className="option-row">
        <span>
          Color <strong>{color}</strong>
        </span>
        <div className="swatches">
          {p.colors.map((c) => (
            <button
              key={c}
              className={color === c ? 'chosen' : ''}
              style={{ background: colorHex[c] || '#777' }}
              aria-label={c}
              aria-pressed={color === c}
              onClick={() => {
                setColor(c);
                onColorChange?.(c);
                setAdded(false);
              }}
            />
          ))}
        </div>
      </div>
      {p.category === 'fashion' && (
        <label className="option-row">
          Size
          <select
            aria-label="Garment size"
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setAdded(false);
            }}
          >
            {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
      <button
        className="button primary full"
        onClick={add}
        disabled={busy || !p.stock}
      >
        {busy ? (
          'Adding…'
        ) : added ? (
          <>
            <Check size={18} /> Added to your bag
          </>
        ) : (
          <>
            <ShoppingBag size={18} /> Add to bag · {money(p.price)}
          </>
        )}
      </button>
      {added && (
        <a className="button full" href="/cart">
          Review your bag <ArrowRight size={16} />
        </a>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <p className="fine-print">
        Sample catalog. No payment is collected. Photography is illustrative;
        the 3D preview shows the selected prototype design.
      </p>
    </div>
  );
}
