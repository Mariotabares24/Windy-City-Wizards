'use client';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Photo } from '@/components/photo';
import { ChevronDown } from 'lucide-react';

type Props = {
  src: string;
  alt?: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  children?: ReactNode;
};

/**
 * Editorial scroll-expand opener. Adapted from the community `ScrollExpandMedia`
 * pattern: recolored to the Cosmic palette, using the project `Photo` component,
 * `motion/react`, and a hardened wheel/touch/keyboard handoff that only
 * intercepts input until the media is fully expanded — after which normal page
 * scroll continues cleanly into the sections below. No-ops under
 * `prefers-reduced-motion`, rendering the media and manifesto statically.
 */
export function ScrollExpandMedia({
  src,
  alt = '',
  title,
  date,
  scrollToExpand,
  children,
}: Props) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartY = useRef(0);

  // Under reduced motion, skip the whole scroll-jacking dance: present the
  // media expanded and the manifesto visible from the first paint.
  useEffect(() => {
    if (!reduce) return;
    setProgress(1);
    setShowContent(true);
    setExpanded(true);
  }, [reduce]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (reduce) return;

    const advance = (delta: number) => {
      setProgress((prev) => {
        const next = Math.min(Math.max(prev + delta, 0), 1);
        if (next >= 1) {
          setExpanded(true);
          setShowContent(true);
        } else if (next < 0.75) {
          setShowContent(false);
        }
        return next;
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (expanded && e.deltaY < 0 && window.scrollY <= 5) {
        setExpanded(false);
        e.preventDefault();
      } else if (!expanded) {
        e.preventDefault();
        advance(e.deltaY * 0.0009);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current) return;
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (expanded && deltaY < -20 && window.scrollY <= 5) {
        setExpanded(false);
        e.preventDefault();
      } else if (!expanded) {
        e.preventDefault();
        advance(deltaY * (deltaY < 0 ? 0.008 : 0.005));
        touchStartY.current = e.touches[0].clientY;
      }
    };
    const onTouchEnd = () => {
      touchStartY.current = 0;
    };
    // Keep the window pinned at the top until the media has fully expanded so
    // keyboard PageDown / Space don't scroll past the still-collapsed hero.
    const onScroll = () => {
      if (!expanded) window.scrollTo(0, 0);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const down = ['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(e.key);
      const up = ['ArrowUp', 'PageUp'].includes(e.key);
      if (!expanded && (down || e.key === 'End')) {
        e.preventDefault();
        advance(e.key === 'End' ? 1 : e.key === 'PageDown' ? 0.4 : 0.18);
      } else if (!expanded && (up || e.key === 'Home')) {
        e.preventDefault();
        advance(e.key === 'Home' ? -1 : -0.18);
      } else if (expanded && up && window.scrollY <= 5) {
        e.preventDefault();
        setExpanded(false);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [reduce, expanded]);

  const width = 320 + progress * (isMobile ? 560 : 1160);
  const height = 420 + progress * (isMobile ? 200 : 340);
  // Slide distance is tuned to the title's rendered width: Space Grotesk is
  // wider than the serif this was first set for, so the words need less travel
  // to read as separated without the longer line leaving the viewport.
  const shift = progress * (isMobile ? 24 : 15);
  const firstWord = title ? title.split(' ')[0] : '';
  const restTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div className="scroll-hero">
      <section className="scroll-hero-stage">
        <div className="scroll-hero-viewport">
          <div
            className="scroll-hero-frame"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <Photo
              className="scroll-hero-media"
              src={src}
              alt={alt}
              width={1280}
              height={720}
              loading="eager"
              fetchPriority="high"
            />
            <motion.div
              className="scroll-hero-scrim"
              initial={false}
              animate={{ opacity: 0.5 - progress * 0.32 }}
              transition={{ duration: 0.2 }}
            />
            <div className="scroll-hero-meta" aria-hidden="true">
              {date && (
                <p style={{ transform: `translateX(-${shift}vw)` }}>{date}</p>
              )}
              {scrollToExpand && !expanded && (
                <p
                  className="scroll-hero-cue"
                  style={{ transform: `translateX(${shift}vw)` }}
                >
                  <ChevronDown size={15} /> {scrollToExpand}
                </p>
              )}
            </div>
          </div>

          <div className="scroll-hero-title" role="presentation">
            <motion.span style={{ transform: `translateX(-${shift}vw)` }}>
              {firstWord}
            </motion.span>
            <motion.span style={{ transform: `translateX(${shift}vw)` }}>
              {restTitle}
            </motion.span>
          </div>
        </div>

        <motion.div
          className="scroll-hero-reveal"
          initial={false}
          animate={{
            opacity: showContent ? 1 : 0,
            y: showContent ? 0 : 24,
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden={!showContent}
        >
          {children}
        </motion.div>
      </section>
    </div>
  );
}

export default ScrollExpandMedia;
