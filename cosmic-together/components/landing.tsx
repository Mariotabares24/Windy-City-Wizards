'use client';
import { Photo } from './photo';
import { ProductCoverflow } from './product-coverflow';
import { products, categoryLabel, type Category } from '@/lib/catalog';
import { useState, useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
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
import {
  SectionReveal,
  StaggerReveal,
  StaggerItem,
  EDITORIAL_EASE,
} from './section-reveal';
import { ScrollExpandMedia } from './ui/scroll-expansion-hero';
import { TestimonialsColumns } from './ui/testimonials-columns';
export function Landing() {
  const [intent, setIntent] = useState('');
  const [category, setCategory] = useState<Category>('fashion');
  const art = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  });
  const artY = useTransform(heroScroll, [0, 1], [40, -40]);
  const { scrollYProgress: catScroll } = useScroll({
    target: categoryRef,
    offset: ['start end', 'end start'],
  });
  const tileShift = useTransform(catScroll, [0, 1], ['16px', '-16px']);
  return (
    <>
      <Header />
      <main className="landing">
        <ScrollExpandMedia
          src="/images/hero.jpg"
          alt="Autumn fashion editorial, a camel coat among fall leaves"
          title="Objects with a point of view. Yours."
          date="THE CONSIDERED COLLECTION · EST. 2026"
          scrollToExpand="Scroll to open the collection"
        >
          <div className="manifesto">
            <SectionReveal className="manifesto-inner" y={34}>
              <p className="eyebrow">
                <span className="status-dot" /> A LITTLE MORE HUMAN. A LOT MORE
                YOU.
              </p>
              <h2>
                Fewer things.
                <br />
                <em>Better chosen.</em>
              </h2>
              <p>
                Cosmic Together is a calmer way to shop fashion, home, and
                gadgets — a little guidance from a concierge that actually
                listens, your favorite people in the decision, and a way to see
                it in your world before it’s ever in your hands.
              </p>
              <p>
                No endless tabs. No second-guessing. Just a considered
                shortlist, shared with the people whose taste you trust — and
                always, entirely, your call.
              </p>
              <a className="button primary" href="/shop">
                Start with a little inspiration <ArrowRight size={17} />
              </a>
            </SectionReveal>
          </div>
        </ScrollExpandMedia>
        <section className="hero" ref={heroRef}>
          <SectionReveal className="hero-copy" as="div" y={30} duration={0.8}>
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
          </SectionReveal>
          <motion.div
            className="hero-art-wrap"
            style={reduce ? undefined : { y: artY }}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={reduce ? undefined : { opacity: 1 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.8, ease: EDITORIAL_EASE }}
          >
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
          </motion.div>
        </section>
        <StaggerReveal as="div" className="benefit-strip">
          <StaggerItem as="span">
            <Sparkles size={17} /> A shortlist that gets you
          </StaggerItem>
          <StaggerItem as="span">
            <UsersRound size={17} /> Your people, in the decision
          </StaggerItem>
          <StaggerItem as="span">
            <Box size={17} /> Less imagining. More seeing.
          </StaggerItem>
          <StaggerItem as="span">
            <ShieldCheck size={17} /> Always your call
          </StaggerItem>
        </StaggerReveal>
        <section className="category-section" ref={categoryRef}>
          <SectionReveal className="section-heading" as="div">
            <div>
              <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
              <h2>A good place to start.</h2>
            </div>
            <a href="/shop">
              Explore all finds <ArrowRight size={17} />
            </a>
          </SectionReveal>
          <StaggerReveal
            as="div"
            className="category-grid"
            style={reduce ? undefined : { ['--tile-shift' as string]: tileShift }}
          >
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
              <StaggerItem
                key={c.id}
                as="a"
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
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>
        <SectionReveal className="landing-collection" as="section" margin="-8% 0px">
          <div className="section-heading collection-heading">
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
        </SectionReveal>
        <section className="testimonials-section">
          <SectionReveal className="section-heading testimonials-heading" as="div">
            <div>
              <p className="eyebrow">SECOND OPINIONS FROM YOUR PEOPLE</p>
              <h2>Better, together.</h2>
              <p className="testimonials-sub">
                Real decisions feel lighter with the right people in the room.
              </p>
            </div>
          </SectionReveal>
          <TestimonialsColumns />
        </section>
        <SectionReveal className="together-banner" as="section" y={32}>
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
        </SectionReveal>
      </main>
      <Footer />
    </>
  );
}
