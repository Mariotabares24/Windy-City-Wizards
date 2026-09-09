'use client';
import { Photo } from './photo';
import { ProductCoverflow } from './product-coverflow';
import { products, categoryLabel, type Category } from '@/lib/catalog';
import { useState, useRef } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Header, Footer } from './brand';
export function Landing() {
  const [intent, setIntent] = useState('');
  const [category, setCategory] = useState<Category>('fashion');
  const art = useRef<HTMLDivElement>(null);
  return (
    <>
      <Header />
      <main className="landing">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> A LITTLE MORE HUMAN. A LOT MORE
              YOU.
            </div>
            <h1>
              Objects with
              <br />a point of view.
              <br />
              <em>Yours.</em>
            </h1>
            <p>
              Tell us what you’re looking for. Find your favorites,
              <br className="desktop-only" /> bring your people, and see it in
              your world.
            </p>
            <form className="intent-field" action="/shop">
              <Sparkles size={22} />
              <input
                name="intent"
                aria-label="What are you shopping for?"
                placeholder="An outfit for a fall wedding…"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              />
              <button aria-label="Find my favorites">
                <ArrowRight size={21} />
              </button>
            </form>
            <div className="hero-chips">
              <a href="/shop?intent=An%20outfit%20for%20a%20fall%20wedding">
                Wedding guest edit <ArrowUpRight size={13} />
              </a>
              <a href="/shop?category=home">
                A cozier corner <ArrowUpRight size={13} />
              </a>
              <a href="/shop?category=gadgets">
                My everyday soundtrack <ArrowUpRight size={13} />
              </a>
            </div>
            <div className="hero-foot">
              <span className="avatar-stack">
                <i>M</i>
                <i>K</i>
                <i>E</i>
              </span>
              <span>
                Some things are better
                <br />
                <strong>with a second opinion.</strong>
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            ref={art}
            onPointerMove={(event) => {
              if (
                event.pointerType !== 'mouse' ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
              )
                return;
              const rect = event.currentTarget.getBoundingClientRect();
              art.current?.style.setProperty(
                '--tilt-x',
                `${((event.clientX - rect.left) / rect.width) * 8 - 4}deg`,
              );
              art.current?.style.setProperty(
                '--tilt-y',
                `${4 - ((event.clientY - rect.top) / rect.height) * 8}deg`,
              );
            }}
            onPointerLeave={() => {
              art.current?.style.setProperty('--tilt-x', '0deg');
              art.current?.style.setProperty('--tilt-y', '0deg');
            }}
          >
            <Photo
              className="hero-image"
              src="/images/hero.jpg"
              alt="Autumn fashion editorial, a camel coat among fall leaves"
              fetchPriority="high"
            />
            <div className="image-caption">
              <span>THE CONSIDERED COLLECTION</span>
              <span>EST. 2026</span>
            </div>
            <div className="floating-note">
              <span className="mini-spark">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>Very you. A little unexpected.</strong>
                <span>Consider this your starting point.</span>
              </div>
              <Check size={17} />
            </div>
            <div className="hero-editorial">
              Fewer things.
              <br />
              <em>Better chosen.</em>
            </div>
            <a className="spatial-link" href="/ar/fashion/f01">
              <Box size={18} /> See it in your world <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <div className="benefit-strip">
          <span>
            <Sparkles size={17} /> A shortlist that gets you
          </span>
          <span>
            <UsersRound size={17} /> Your people, in the decision
          </span>
          <span>
            <Box size={17} /> Less imagining. More seeing.
          </span>
          <span>
            <ShieldCheck size={17} /> Always your call
          </span>
        </div>
        <section className="category-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
              <h2>A good place to start.</h2>
            </div>
            <a href="/shop">
              Explore all finds <ArrowRight size={17} />
            </a>
          </div>
          <div className="category-grid">
            {[
              {
                id: 'fashion',
                label: 'Fashion',
                sub: 'For your next main-character moment.',
                class: 'fashion',
                num: '01',
              },
              {
                id: 'home',
                label: 'Home & living',
                sub: 'Make a little room for you.',
                class: 'home',
                num: '02',
              },
              {
                id: 'gadgets',
                label: 'Gadgets',
                sub: 'Meet your new everyday essential.',
                class: 'gadgets',
                num: '03',
              },
            ].map((c) => (
              <a
                key={c.id}
                href={'/shop?category=' + c.id}
                className={'category-tile ' + c.class}
              >
                <span className="category-number">{c.num} / THE EDIT</span>
                <div>
                  <h3>{c.label}</h3>
                  <p>{c.sub}</p>
                </div>
                <span className="category-arrow">
                  <ArrowUpRight size={23} />
                </span>
              </a>
            ))}
          </div>
        </section>
        <section className="landing-collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SEVEN OBJECTS. THREE WORLDS.</p>
              <h2>Find your point of view.</h2>
            </div>
          </div>
          <fieldset
            className="category-tabs"
            aria-label="Featured product category"
          >
            {(['fashion', 'home', 'gadgets'] as Category[]).map((c) => (
              <button
                key={c}
                className={category === c ? 'active' : ''}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {categoryLabel[c]}
              </button>
            ))}
          </fieldset>
          <ProductCoverflow
            key={category}
            products={products}
            category={category}
          />
        </section>
        <section className="together-banner">
          <div className="orb-icon">
            <UsersRound size={30} />
          </div>
          <div>
            <div className="eyebrow">
              LESS SECOND-GUESSING. MORE SECOND OPINIONS.
            </div>
            <h2>Your group chat has great taste.</h2>
            <p>
              Give it a place to shop. Invite a friend, share a shortlist, find
              the one.
            </p>
          </div>
          <a className="button primary" href="/shop?circle=1">
            Start a shopping circle <ChevronRight size={18} />
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
