'use client';
import * as React from 'react';
import { motion, stagger, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

// Shared editorial easing — a soft, confident settle used across the landing.
export const EDITORIAL_EASE = [0.16, 1, 0.3, 1] as const;

const MOTION = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  li: motion.li,
  h2: motion.h2,
  p: motion.p,
  a: motion.a,
  span: motion.span,
} as const;

type Tag = keyof typeof MOTION;

// Extra attributes (href, style, onClick, …) are forwarded verbatim. We keep
// them loose because the rendered tag varies (a, span-like, section, …); the
// resolved component is cast to ElementType so it accepts both DOM and motion
// props without fighting union types.
type Extra = Record<string, unknown>;

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Vertical travel, in px, before settling. */
  y?: number;
  delay?: number;
  duration?: number;
  /** IntersectionObserver root margin — when the reveal fires. */
  margin?: string;
  once?: boolean;
} & Extra;

/**
 * Reveals its contents once they scroll into view. No-ops entirely under
 * `prefers-reduced-motion`, mirroring the discipline already in globals.css.
 */
export function SectionReveal({
  children,
  className,
  as = 'div',
  y = 28,
  delay = 0,
  duration = 0.7,
  margin = '-12% 0px -12% 0px',
  once = true,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as as React.ElementType;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Tag = MOTION[as] as React.ElementType;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin }}
      transition={{ duration, ease: EDITORIAL_EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggered container. Pair with <StaggerItem> children so each rises in turn.
 */
export function StaggerReveal({
  children,
  className,
  as = 'div',
  gap = 0.09,
  margin = '-10% 0px -10% 0px',
  once = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  gap?: number;
  margin?: string;
  once?: boolean;
} & Extra) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as as React.ElementType;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Tag = MOTION[as] as React.ElementType;
  const container: Variants = {
    hidden: {},
    show: { transition: { delayChildren: stagger(gap, { startDelay: 0.05 }) } },
  };
  return (
    <Tag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EDITORIAL_EASE },
  },
};

export function StaggerItem({
  children,
  className,
  as = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
} & Extra) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as as React.ElementType;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Tag = MOTION[as] as React.ElementType;
  return (
    <Tag className={className} variants={itemVariants} {...rest}>
      {children}
    </Tag>
  );
}
