// Cosmic Mart mark: crescent flanked by two orbiting dots.
export function CosmicMark({ size = 23 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <mask id="cosmic-crescent">
        <rect width="100" height="100" fill="black" />
        <circle cx="50" cy="50" r="30" fill="white" />
        <circle cx="64" cy="42" r="24" fill="black" />
      </mask>
      <rect width="100" height="100" fill="#a855f7" mask="url(#cosmic-crescent)" />
      <circle cx="16" cy="50" r="8" fill="#22d3ee" />
      <circle cx="86" cy="50" r="8" fill="#22d3ee" />
    </svg>
  );
}
