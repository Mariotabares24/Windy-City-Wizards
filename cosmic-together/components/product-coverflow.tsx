'use client';
import { useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, MoveHorizontal } from 'lucide-react';
import { Photo } from './photo';
import {
  categoryLabel,
  money,
  type Product,
  type Category,
} from '@/lib/catalog';

/** Finite, category-scoped coverflow. Pointer capture starts only for a horizontal drag. */
export function ProductCoverflow({
  products,
  category,
  renderDetail,
}: {
  products: Product[];
  category: Category;
  renderDetail?: (product: Product, index: number) => ReactNode;
}) {
  const items = products.filter((p) => p.category === category);
  const [index, setIndex] = useState(
    renderDetail ? 0 : Math.floor((items.length - 1) / 2),
  );
  const [drag, setDrag] = useState(0);
  const covers = useRef<Array<HTMLButtonElement | null>>([]);
  const gesture = useRef({
    x: 0,
    y: 0,
    lastX: 0,
    time: 0,
    velocity: 0,
    active: false,
    horizontal: false,
    moved: false,
  });
  const active = Math.min(index, Math.max(0, items.length - 1));
  const move = (next: number, focus = false) => {
    const selected = Math.max(0, Math.min(items.length - 1, next));
    setIndex(selected);
    if (focus) covers.current[selected]?.focus({ preventScroll: true });
  };
  if (!items.length) return null;
  const p = items[active];
  return (
    <section
      className="coverflow"
      aria-label={`${categoryLabel[category]} product carousel`}
      aria-roledescription="carousel"
    >
      <div className="coverflow-stage">
        {items.map((item, i) => {
          const offset = i - active + drag;
          return (
            <button
              type="button"
              key={item.id}
              ref={(element) => { covers.current[i] = element; }}
              tabIndex={i === active ? 0 : -1}
              className={'coverflow-cover ' + (i === active ? 'is-active' : '')}
              style={
                {
                  '--offset': offset,
                  '--depth': Math.abs(offset),
                  zIndex: items.length - Math.abs(i - active),
                  transition: drag ? 'none' : undefined,
                } as CSSProperties
              }
              aria-label={`Show ${item.name}`}
              aria-pressed={i === active}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  move(active + (e.key === 'ArrowRight' ? 1 : -1), true);
                }
                if (e.key === 'Home') {
                  e.preventDefault();
                  move(0, true);
                }
                if (e.key === 'End') {
                  e.preventDefault();
                  move(items.length - 1, true);
                }
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                gesture.current = {
                  x: e.clientX,
                  y: e.clientY,
                  lastX: e.clientX,
                  time: e.timeStamp,
                  velocity: 0,
                  active: true,
                  horizontal: false,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                const g = gesture.current;
                if (!g.active) return;
                if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) {
                  g.active = false; setDrag(0); return;
                }
                const dx = e.clientX - g.x,
                  dy = e.clientY - g.y;
                if (
                  !g.horizontal &&
                  Math.abs(dy) > Math.abs(dx) &&
                  Math.abs(dy) > 10
                ) {
                  g.active = false;
                  return;
                }
                if (Math.abs(dx) > 10) {
                  g.horizontal = true;
                  g.moved = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
                if (!g.horizontal) return;
                g.velocity =
                  (e.clientX - g.lastX) / Math.max(1, e.timeStamp - g.time);
                g.lastX = e.clientX;
                g.time = e.timeStamp;
                setDrag(Math.max(-1, Math.min(1, dx / 230)));
              }}
              onPointerUp={(e) => {
                const g = gesture.current;
                if (g.horizontal) {
                  const distance = e.clientX - g.x;
                  const velocity = e.timeStamp - g.time < 120 ? g.velocity : 0;
                  const projected = distance + velocity * 120;
                  if (Math.abs(distance) > 45 || Math.abs(velocity) > 0.5)
                    move(active + (projected < 0 ? 1 : -1));
                }
                g.active = false;
                setDrag(0);
              }}
              onPointerCancel={() => {
                gesture.current.active = false;
                setDrag(0);
              }}
              onPointerLeave={() => {
                if (!gesture.current.horizontal) gesture.current.active = false;
              }}
              onClick={() => {
                if (!gesture.current.moved) move(i);
                gesture.current.moved = false;
              }}
            >
              <Photo
                src={item.image}
                alt={item.name}
                draggable={false}
                loading="lazy"
              />
              <span>
                {item.name}
                <b>{money(item.price)}</b>
              </span>
            </button>
          );
        })}
      </div>
      <div className="coverflow-navigation">
        <button
          className="icon-button"
          aria-label="Previous product"
          disabled={active === 0}
          onClick={() => move(active - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <span aria-live="polite" aria-atomic="true">
          {String(active + 1).padStart(2, '0')} <i>/</i>{' '}
          {String(items.length).padStart(2, '0')}{' '}
          <small>{categoryLabel[category]}</small>
        </span>
        <button
          className="icon-button"
          aria-label="Next product"
          disabled={active === items.length - 1}
          onClick={() => move(active + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="coverflow-detail" key={p.id}>
        {renderDetail ? (
          renderDetail(p, active)
        ) : (
          <>
            <p className="eyebrow">
              {p.material} · {p.color}
            </p>
            <h3>
              {p.name} <span>{money(p.price)}</span>
            </h3>
            <p>{p.description}</p>
            <div className="coverflow-actions">
              <a className="button primary" href={'/product/' + p.id}>
                Explore this find <ArrowRight size={16} />
              </a>
              <a className="button" href={'/ar/' + p.category + '/' + p.id}>
                Try it in your world
              </a>
            </div>
          </>
        )}
      </div>
      {items.length > 1 && (
        <p className="coverflow-hint">
          <MoveHorizontal size={14} /> Drag, swipe, or use the arrows to explore
          this category.
        </p>
      )}
    </section>
  );
}
