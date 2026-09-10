'use client';
import { Fragment, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
};

// Warm, on-brand second opinions from "your people" — Cosmic Mart's voice.
export const testimonials: Testimonial[] = [
  {
    text: 'I described a fall wedding in one sentence and got three looks that actually felt like me. My group chat picked the winner.',
    image: 'https://i.pravatar.cc/120?img=47',
    name: 'Maya Okafor',
    role: 'Found the October Blazer',
  },
  {
    text: 'Seeing the floor lamp in my actual reading corner — before buying — is the thing I never knew I needed. No more guessing.',
    image: 'https://i.pravatar.cc/120?img=12',
    name: 'Daniel Rees',
    role: 'Placed the Arc Lamp',
  },
  {
    text: 'A second opinion from my sister, in the moment, without forty screenshots. We just voted and it was done.',
    image: 'https://i.pravatar.cc/120?img=32',
    name: 'Priya Nair',
    role: 'Shopping circle host',
  },
  {
    text: 'Fewer tabs, fewer maybes. It kept my budget honest and still surprised me with something I loved.',
    image: 'https://i.pravatar.cc/120?img=5',
    name: 'Theo Almeida',
    role: 'Everyday listening',
  },
  {
    text: 'Cosmo didn’t push. It listened, then gave me a shortlist I could stand behind. That’s rare.',
    image: 'https://i.pravatar.cc/120?img=26',
    name: 'Grace Lin',
    role: 'Refined a shortlist',
  },
  {
    text: 'Trying the headphones on in 3D, then sharing the snapshot with my roommates — shopping finally felt like a group thing.',
    image: 'https://i.pravatar.cc/120?img=15',
    name: 'Ibrahim Cole',
    role: 'Circle of four',
  },
  {
    text: 'It’s the calmest way I’ve ever shopped. A little guidance, my people in the loop, and always my call.',
    image: 'https://i.pravatar.cc/120?img=44',
    name: 'Sofia Marchetti',
    role: 'Home & living',
  },
  {
    text: 'I explored a direction I’d never have tried alone — and my friends were right there cheering it on.',
    image: 'https://i.pravatar.cc/120?img=8',
    name: 'Marcus Bell',
    role: 'Tried something new',
  },
  {
    text: 'From “I have no idea” to “that’s the one” in a single evening. With good taste, shared.',
    image: 'https://i.pravatar.cc/120?img=36',
    name: 'Amara Diallo',
    role: 'Wedding guest edit',
  },
];

function Avatar({ image, name }: { image: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className="testimonial-avatar fallback" aria-hidden="true">
        {name.charAt(0)}
      </span>
    );
  return (
    // A small external avatar; plain <img> keeps it out of the image-optim cache.
    <img
      className="testimonial-avatar"
      width={44}
      height={44}
      src={image}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="testimonial-card">
      <blockquote>{t.text}</blockquote>
      <figcaption>
        <Avatar image={t.image} name={t.name} />
        <span>
          <strong>{t.name}</strong>
          <small>{t.role}</small>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsColumn({
  className,
  items,
  duration = 16,
}: {
  className?: string;
  items: Testimonial[];
  duration?: number;
}) {
  return (
    <div className={'testimonials-column ' + (className || '')}>
      <motion.div
        className="testimonials-track"
        animate={{ translateY: '-50%' }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
      >
        {[0, 1].map((dup) => (
          <Fragment key={dup}>
            {items.map((t, i) => (
              <Card key={dup + '-' + i} t={t} />
            ))}
          </Fragment>
        ))}
      </motion.div>
    </div>
  );
}

/** Three vertical marquee columns; degrades to a static grid under reduced motion. */
export function TestimonialsColumns() {
  const reduce = useReducedMotion();
  const columns = [
    testimonials.slice(0, 3),
    testimonials.slice(3, 6),
    testimonials.slice(6, 9),
  ];
  if (reduce)
    return (
      <div className="testimonials-grid">
        {testimonials.map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </div>
    );
  return (
    <div className="testimonials-wall">
      <TestimonialsColumn items={columns[0]} duration={22} />
      <TestimonialsColumn
        items={columns[1]}
        duration={28}
        className="hide-md"
      />
      <TestimonialsColumn
        items={columns[2]}
        duration={25}
        className="hide-lg"
      />
    </div>
  );
}
