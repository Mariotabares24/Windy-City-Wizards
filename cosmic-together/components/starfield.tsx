import type { CSSProperties } from 'react';

// Seeded so server and client render identical markup (no hydration mismatch).
function makeStars(count: number, seed: number) {
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: rand() * 100,
    y: rand() * 100,
    size: rand() * 1.8 + 0.5,
    dur: rand() * 4 + 2,
    delay: rand() * 4,
    minOp: rand() * 0.2 + 0.08,
    maxOp: rand() * 0.45 + 0.4,
  }));
}

const STARS = makeStars(140, 20260909);

export function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="nebula nebula-cyan" />
      <div className="nebula nebula-purple" />
      <div className="nebula nebula-violet" />
      {STARS.map((s) => (
        <span
          key={s.id}
          className="star"
          style={
            {
              left: `${s.x.toFixed(3)}%`,
              top: `${s.y.toFixed(3)}%`,
              width: `${s.size.toFixed(2)}px`,
              height: `${s.size.toFixed(2)}px`,
              '--dur': `${s.dur.toFixed(2)}s`,
              '--delay': `${s.delay.toFixed(2)}s`,
              '--min-op': s.minOp.toFixed(3),
              '--max-op': s.maxOp.toFixed(3),
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
